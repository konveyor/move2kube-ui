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
import React, { useReducer } from 'react';
import { Confirm } from '@app/qa/Confirm';
import { Password } from '@app/qa/Password';
import { Multiline } from '@app/qa/Multiline';
import { QAContext } from '@app/qa/QAContext';
import { MultiSelect } from '@app/qa/MultiSelect';
import { getQuestion, postSolution, wait } from '@app/networking/api';
import { ErrHTTP401, IProject, IWorkspace, ProblemT } from '@app/common/types';
import { Alert, Button, Wizard, WizardStep, WizardFooter, WizardContextConsumer } from '@patternfly/react-core';

enum ActionType {
    NEW_STEP = 'new-step',
    SET_ERR = 'set-error',
    SET_DISABLED = 'set-disabled',
    SET_IS_OPEN = 'set-is-open',
    UPDATE_PROBLEM = 'update-problem',
}

interface IAction {
    type: ActionType;
}

interface IActionUpdateProblem extends IAction {
    idx: number;
    problem: ProblemT;
}

interface IActionNewStep extends IAction {
    problem: ProblemT;
}

interface IActionSetErr extends IAction {
    err: Error | null;
}

interface IActionSetDisabled extends IAction {
    disabled: boolean;
}

interface IActionSetIsOpen extends IAction {
    isOpen: boolean;
}

interface IQAComponentProps {
    idx: number;
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

interface IQAWizardState {
    isOpen: boolean;
    disabled: boolean;
    solErr: Error | null;
    steps: Array<IQAWizardStep>;
}

function getQuestCompAndSetDefault(question: ProblemT): React.FunctionComponent<IQAComponentProps> {
    const componentsAndDefaults: { [id: string]: [React.FunctionComponent<IQAComponentProps>, unknown] } = {
        MultiSelect: [MultiSelect, []],
        Select: [Select, ''],
        Input: [Input, ''],
        Confirm: [Confirm, false],
        Multiline: [Multiline, ''],
        Password: [Password, ''],
    };
    if (!(question.type in componentsAndDefaults)) throw new Error(`unknown solution type: ${question.type}`);
    const [component, defaultAnswer] = componentsAndDefaults[question.type];
    question.answer = 'default' in question ? question.default : defaultAnswer;
    return component;
}

function reducer(state: IQAWizardState, action: IAction): IQAWizardState {
    if (action.type === ActionType.NEW_STEP) {
        const act = action as IActionNewStep;
        const QuesComponent = getQuestCompAndSetDefault(act.problem);
        const newStep = {
            canJumpTo: false,
            name: act.problem.id,
            problem: act.problem,
            component: <QuesComponent idx={state.steps.length} />,
        };
        return { ...state, steps: [...state.steps, newStep], solErr: null, disabled: false };
    }
    if (action.type === ActionType.SET_ERR) {
        return { ...state, solErr: (action as IActionSetErr).err };
    }
    if (action.type === ActionType.SET_DISABLED) {
        return { ...state, disabled: (action as IActionSetDisabled).disabled };
    }
    if (action.type === ActionType.SET_IS_OPEN) {
        return { ...state, isOpen: (action as IActionSetIsOpen).isOpen };
    }
    if (action.type === ActionType.UPDATE_PROBLEM) {
        const newSteps = [...state.steps];
        const act = action as IActionUpdateProblem;
        newSteps[act.idx] = {
            ...newSteps[act.idx],
            problem: act.problem,
        };
        return { ...state, steps: newSteps };
    }
    throw new Error(`inside QAWizard reducer, unknown action type. Actual: ${JSON.stringify(action)}`);
}

async function getNextStep(
    onNext: () => void,
    onClose: () => void,
    props: IQAWizardProps,
    state: IQAWizardState,
    dispatch: (value: IAction) => void,
): Promise<void> {
    try {
        const problem = state.steps[state.steps.length - 1].problem;
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
            const act: IActionSetErr = { type: ActionType.SET_ERR, err: null };
            dispatch(act);
            return onClose();
        }
        const act: IActionNewStep = {
            type: ActionType.NEW_STEP,
            problem: question,
        };
        dispatch(act);
        onNext();
    } catch (e) {
        const act: IActionSetErr = { type: ActionType.SET_ERR, err: e as Error };
        dispatch(act);
        if (e instanceof ErrHTTP401) {
            onClose();
            props.onCancel();
        }
    }
}

function QAWizard(props: IQAWizardProps): JSX.Element {
    const initialState: IQAWizardState = {
        isOpen: true,
        disabled: false,
        solErr: null,
        steps: [
            {
                name: 'Get Started!',
                canJumpTo: false,
                problem: { id: '', type: '', description: '' },
                component: (
                    <p>Move2Kube will ask you a few questions if it requires any assistance. Click Next to start.</p>
                ),
            },
        ],
    };
    const [state, dispatch] = useReducer(reducer, initialState);
    const CustomFooter = (
        <WizardFooter>
            {state.solErr && <Alert variant="danger" title={`${state.solErr}`} />}
            <WizardContextConsumer>
                {({ onNext, onClose }) => (
                    <>
                        <Button
                            onClick={() => {
                                const act: IActionSetDisabled = { type: ActionType.SET_DISABLED, disabled: true };
                                dispatch(act);
                                getNextStep(onNext, onClose, props, state, dispatch);
                            }}
                            isDisabled={state.disabled}
                        >
                            {state.disabled ? 'Processing...' : 'Next'}
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
        <QAContext.Provider
            value={{
                problems: state.steps.map((s) => s.problem),
                setResolvedProblem: (idx, problem) => {
                    const act: IActionUpdateProblem = { type: ActionType.UPDATE_PROBLEM, idx, problem };
                    dispatch(act);
                },
            }}
        >
            <Wizard
                steps={state.steps}
                footer={CustomFooter}
                isOpen={state.isOpen}
                onClose={() => {
                    const act: IActionSetIsOpen = { type: ActionType.SET_DISABLED, isOpen: false };
                    dispatch(act);
                    props.onClose();
                }}
            />
        </QAContext.Provider>
    );
}

export { QAWizard, IQAComponentProps };
