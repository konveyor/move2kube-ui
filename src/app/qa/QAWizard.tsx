/*
Copyright IBM Corporation 2021

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Input } from '@app/qa/Input';
import { Select } from '@app/qa/Select';
import React, { useState } from 'react';
import { Confirm } from '@app/qa/Confirm';
import { Password } from '@app/qa/Password';
import { Multiline } from '@app/qa/Multiline';
import { MultiSelect } from '@app/qa/MultiSelect';
import { getQuestion, postSolution, wait } from '@app/networking/api';
import { ErrHTTP401, IProject, IWorkspace, ProblemT } from '@app/common/types';
import { Alert, Button, Wizard, WizardStep, WizardFooter, WizardContextConsumer } from '@patternfly/react-core';

interface IQAComponentProps {
    problem: ProblemT;
    setResolvedProblem: (x: ProblemT) => void;
}

interface IQAWizardStep extends WizardStep {
    problem: ProblemT;
}

interface IQAWizardProps {
    workspace: IWorkspace;
    project: IProject;
    projectOutputId: string;
    onClose: () => void;
    onCancel: () => void;
}

function getQuestCompAndSetDefault(p: ProblemT): React.FunctionComponent<IQAComponentProps> {
    const xs: { [id: string]: [React.FunctionComponent<IQAComponentProps>, unknown] } = {
        MultiSelect: [MultiSelect, []],
        Select: [Select, ''],
        Input: [Input, ''],
        Confirm: [Confirm, false],
        Multiline: [Multiline, ''],
        Password: [Password, ''],
    };
    if (p.type in xs) {
        const [f, x] = xs[p.type];
        p.answer = 'default' in p ? p.default : x;
        return f;
    }
    throw new Error(`unknown solution type: ${p.type}`);
}

function QAWizard(props: IQAWizardProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(true);
    const [disabled, setDisabled] = useState(false);
    const [solErr, setSolErr] = useState<Error | null>(null);
    const [steps, setSteps] = useState<Array<IQAWizardStep>>([
        {
            name: 'Get Started!',
            canJumpTo: false,
            problem: { id: '', type: '', description: '' },
            component: (
                <p>Move2Kube will ask you a few questions if it requires any assistance. Click Next to start.</p>
            ),
        },
    ]);
    const getNextStep = async (onNext: () => void, onClose: () => void): Promise<void> => {
        try {
            const problem = steps[steps.length - 1].problem;
            console.log('inside QAWizard. getNextStep. problem', problem);
            if (problem.id !== '') {
                await postSolution(props.workspace.id, props.project.id, props.projectOutputId, problem);
            }
            let question: ProblemT | null = null;
            try {
                question = await getQuestion(props.workspace.id, props.project.id, props.projectOutputId);
            } catch (e) {
                console.error(`failed to get the next question: ${e} . Waiting a few seconds and trying again...`);
                // wait a few seconds and try again to check if all questions have finished.
                await wait(2);
                question = await getQuestion(props.workspace.id, props.project.id, props.projectOutputId);
            }
            console.log('inside QAWizard. getNextStep. question', question);
            if (question === null) {
                setSolErr(null);
                onClose();
                return props.onClose();
            }
            const QuesComponent = getQuestCompAndSetDefault(question);
            const idx = steps.length;
            const setResolvedProblem = (p: ProblemT) => {
                const newSteps = [...steps];
                newSteps[idx] = {
                    ...newSteps[idx],
                    problem: p,
                    component: <QuesComponent problem={p} setResolvedProblem={setResolvedProblem} />,
                };
                setSteps(newSteps);
            };
            const newStep: IQAWizardStep = {
                name: question.id,
                canJumpTo: false,
                problem: question,
                component: <QuesComponent problem={question} setResolvedProblem={setResolvedProblem} />,
            };
            setSteps([...steps, newStep]);
            setSolErr(null);
            setDisabled(false);
            onNext();
        } catch (e) {
            setSolErr(e as Error);
            if (e instanceof ErrHTTP401) {
                onClose();
                props.onCancel();
            }
        }
    };
    const CustomFooter = (
        <WizardFooter>
            {solErr && <Alert variant="danger" title={`${solErr}`} />}
            <WizardContextConsumer>
                {({ onNext, onClose }) => (
                    <>
                        <Button
                            onClick={() => {
                                setDisabled(true);
                                getNextStep(onNext, onClose);
                            }}
                            isDisabled={disabled}
                        >
                            {disabled ? 'Processing...' : 'Next'}
                        </Button>
                        <Button
                            variant="link"
                            onClick={() => {
                                onClose();
                                props.onCancel();
                            }}
                        >
                            Cancel
                        </Button>
                    </>
                )}
            </WizardContextConsumer>
        </WizardFooter>
    );
    return (
        <Wizard
            steps={steps}
            footer={CustomFooter}
            isOpen={isOpen}
            onClose={() => {
                setIsOpen(false);
                props.onClose();
            }}
        />
    );
}

export { QAWizard, IQAComponentProps };
