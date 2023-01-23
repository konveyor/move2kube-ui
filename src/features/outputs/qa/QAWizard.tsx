/*
Copyright IBM Corporation 2023

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

import { Alert, Button, Spinner, Split, SplitItem, TextContent, Wizard, WizardContextConsumer, WizardStep } from "@patternfly/react-core";
import { FunctionComponent, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { moveToNextQuestion } from "../outputsApi";
import { updateQAStep, setCurrentStatusId, selectCurrentStatus, TransformationStatus } from "../outputsSlice";
import { Confirm } from "./Confirm";
import { Input } from "./Input";
import { MultiLineInput } from "./MultiLineInput";
import { MultiSelect } from "./MultiSelect";
import { Password } from "./Password";
import { Select } from "./Select";
import { IQuestion, IQAStep } from "./types";

export interface IQAComponentProps {
    isDisabled?: boolean;
    outputId: string;
    stepIdx: number;
    question: IQuestion;
}

const QAComponent: FunctionComponent<IQAComponentProps> = ({ isDisabled, outputId, stepIdx, question }) => {
    isDisabled = isDisabled || false;
    const dispatch = useAppDispatch();
    const setAnswer = (answer: unknown) => dispatch(updateQAStep({ id: outputId, stepIdx, question: { ...question, answer } }));
    switch (question.type) {
        case 'MultiSelect':
            return <MultiSelect isDisabled={isDisabled} question={question} setAnswer={a => setAnswer(a)} />
        case 'Select':
            return <Select isDisabled={isDisabled} question={question} setAnswer={a => setAnswer(a)} />
        case 'Input':
            return <Input isDisabled={isDisabled} question={question} setAnswer={a => setAnswer(a)} />
        case 'Confirm':
            return <Confirm isDisabled={isDisabled} question={question} setAnswer={a => setAnswer(a)} />
        case 'MultiLineInput':
            return <MultiLineInput isDisabled={isDisabled} question={question} setAnswer={a => setAnswer(a)} />
        case 'Password':
            return <Password isDisabled={isDisabled} question={question} setAnswer={a => setAnswer(a)} />
        default:
            return <Alert variant="danger" title={`unknown solution type: ${question.type}`} />;
    }
};

// -----------------------------------------------------------------------------

const convert = (s: IQAStep, lastIdx: number, i: number, outputId: string): WizardStep => {
    return ({
        id: `step-${i}`,
        name: s.question.id,
        component: <QAComponent isDisabled={i !== lastIdx} outputId={outputId} stepIdx={i} question={s.question} />,
    });
};

interface IQAWizardProps {
    refetch?: () => void;
}

export const QAWizard: FunctionComponent<IQAWizardProps> = (props) => {
    const [isNextDisabled, setIsNextDisabled] = useState(false);
    const status: TransformationStatus = useAppSelector(selectCurrentStatus) || { workspaceId: '', projectId: '', outputId: '', steps: [] };
    const dispatch = useAppDispatch();
    const qaSteps: Array<IQAStep> = status?.steps || [];
    const startStep = {
        id: 'start',
        name: 'Getting Started!',
        component: <TextContent>Move2Kube will ask you a few questions if it requires any assistance. Click Next to start.</TextContent>,
    };
    const { outputId } = status;
    const lastIdx = qaSteps.length - 1;
    const steps = [startStep, ...qaSteps.map((s, i) => convert(s, lastIdx, i, outputId))];
    const customFooter = (
        <WizardContextConsumer>
            {() => (
                <Split hasGutter className="padding-1em">
                    <SplitItem>
                        <Button isDisabled={isNextDisabled} onClick={() => {
                            setIsNextDisabled(true);
                            dispatch(moveToNextQuestion())
                                .then(({ done }) => {
                                    if (done) {
                                        try {
                                            if (props.refetch) props.refetch();
                                        } catch (e) {
                                            console.log('failed to refetch', e);
                                        }
                                    } else {
                                        setIsNextDisabled(false);
                                    }
                                })
                                .catch(console.error);
                        }}>Next</Button>
                    </SplitItem>
                    <SplitItem>
                        <Button variant="secondary" onClick={() => {
                            dispatch(setCurrentStatusId(''));
                            try {
                                if (props.refetch) props.refetch();
                            } catch (e) {
                                console.log('failed to refetch:', e);
                            }
                        }}>Cancel</Button>
                    </SplitItem>
                    {isNextDisabled && (
                        <SplitItem>
                            <Spinner size="lg" />
                        </SplitItem>
                    )}
                </Split>
            )}
        </WizardContextConsumer>
    );
    return (
        <Wizard
            isOpen={outputId !== ''}
            hideClose
            startAtStep={1 + status.steps.length}
            steps={steps}
            footer={customFooter}
        />
    );
};
