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

import { Input } from './Input';
import { Select } from './Select';
import { Confirm } from './Confirm';
import { Password } from './Password';
import { Multiline } from './Multiline';
import { QAContext } from './QAContext';
import { MultiSelect } from './MultiSelect';
import React, { useEffect, useReducer } from 'react';
import { getQuestion, postSolution, wait } from '../networking/api';
import { ErrHTTP401, IProject, IWorkspace, ProblemT } from '../common/types';
import {
    Alert,
    Button,
    Wizard,
    WizardStep,
    WizardFooter,
    WizardContextConsumer,
    Spinner,
} from '@patternfly/react-core';

enum ActionType {
    NEW_STEP = 'new-step',
    SET_ERR = 'set-error',
    NEW_OUTPUT = 'new-output',
    SET_IS_OPEN = 'set-is-open',
    UPDATE_PROBLEM = 'update-problem',
    SET_DISABLED = 'set-next-disabled',
}

interface IAction {
    type: ActionType;
}

interface IActionNewStep extends IAction {
    projectOutputId: string;
    problem: ProblemT;
}

interface IActionSetErr extends IAction {
    projectOutputId: string;
    err: Error | null;
}

interface IActionNewOutput extends IAction {
    projectOutputId: string;
}

interface IActionSetIsOpen extends IAction {
    isOpen: boolean;
}

interface IActionUpdateProblem extends IAction {
    projectOutputId: string;
    idx: number;
    problem: ProblemT;
}

interface IActionSetNextDisabled extends IAction {
    projectOutputId: string;
    disabled: boolean;
}

interface IQAComponentProps {
    idx: number;
}

interface IQAWizardStep extends WizardStep {
    problem: ProblemT;
}

interface IQAWizardProps {
    isDisabled: boolean;
    workspace: IWorkspace;
    project: IProject;
    projectOutputId: string;
    onClose: () => void;
    onCancel: () => void;
}

interface IQAWizardState {
    isOpen: boolean;
    stateForOutputId: { [id: string]: IQAWizardStatePerOutput };
}

interface IQAWizardStatePerOutput {
    disableNextButton: boolean;
    solErr: Error | null;
    steps: Array<IQAWizardStep>;
}

function getQuestCompAndSetDefault(question: ProblemT): React.FunctionComponent<IQAComponentProps> {
    const componentsAndDefaults: { [id: string]: [React.FunctionComponent<IQAComponentProps>, unknown] } = {
        MultiSelect: [MultiSelect, []],
        Select: [Select, ''],
        Input: [Input, ''],
        Confirm: [Confirm, false],
        MultiLineInput: [Multiline, ''],
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
            id: state.stateForOutputId[act.projectOutputId].steps.length,
            canJumpTo: true,
            name: act.problem.id,
            problem: act.problem,
            component: <QuesComponent idx={state.stateForOutputId[act.projectOutputId].steps.length} />,
        };
        return {
            ...state,
            stateForOutputId: {
                ...state.stateForOutputId,
                [act.projectOutputId]: {
                    steps: [...state.stateForOutputId[act.projectOutputId].steps, newStep],
                    solErr: null,
                    disableNextButton: false,
                },
            },
        };
    }
    if (action.type === ActionType.SET_ERR) {
        const act = action as IActionSetErr;
        return {
            ...state,
            stateForOutputId: {
                ...state.stateForOutputId,
                [act.projectOutputId]: {
                    ...state.stateForOutputId[act.projectOutputId],
                    solErr: act.err,
                },
            },
        };
    }
    if (action.type === ActionType.NEW_OUTPUT) {
        const act = action as IActionNewOutput;
        if (act.projectOutputId in state.stateForOutputId) return state;
        return {
            ...state,
            stateForOutputId: {
                ...state.stateForOutputId,
                [act.projectOutputId]: initStateForOutputId(),
            },
        };
    }
    if (action.type === ActionType.SET_IS_OPEN) {
        const act = action as IActionSetIsOpen;
        return { ...state, isOpen: act.isOpen };
    }
    if (action.type === ActionType.UPDATE_PROBLEM) {
        const act = action as IActionUpdateProblem;
        const newSteps = [...state.stateForOutputId[act.projectOutputId].steps];
        newSteps[act.idx] = {
            ...newSteps[act.idx],
            problem: act.problem,
        };
        return {
            ...state,
            stateForOutputId: {
                ...state.stateForOutputId,
                [act.projectOutputId]: {
                    ...state.stateForOutputId[act.projectOutputId],
                    steps: newSteps,
                },
            },
        };
    }
    if (action.type === ActionType.SET_DISABLED) {
        const act = action as IActionSetNextDisabled;
        return {
            ...state,
            stateForOutputId: {
                ...state.stateForOutputId,
                [act.projectOutputId]: {
                    ...state.stateForOutputId[act.projectOutputId],
                    disableNextButton: act.disabled,
                },
            },
        };
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
        const problem =
            state.stateForOutputId[props.projectOutputId].steps[
                state.stateForOutputId[props.projectOutputId].steps.length - 1
            ].problem;
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
            const act: IActionSetErr = { type: ActionType.SET_ERR, projectOutputId: props.projectOutputId, err: null };
            dispatch(act);
            return onClose();
        }
        const act: IActionNewStep = {
            type: ActionType.NEW_STEP,
            projectOutputId: props.projectOutputId,
            problem: question,
        };
        dispatch(act);
        onNext();
    } catch (e) {
        const act: IActionSetErr = {
            projectOutputId: props.projectOutputId,
            type: ActionType.SET_ERR,
            err: e as Error,
        };
        dispatch(act);
        if (e instanceof ErrHTTP401) {
            onClose();
            props.onCancel();
        }
    }
}

function firstStep(): IQAWizardStep {
    return {
        id: 0,
        name: 'Get Started!',
        canJumpTo: true,
        problem: { id: '', type: '', description: '' },
        component: <p>Move2Kube will ask you a few questions if it requires any assistance. Click Next to start.</p>,
    };
}

function initStateForOutputId(): IQAWizardStatePerOutput {
    return {
        disableNextButton: false,
        solErr: null,
        steps: [firstStep()],
    };
}

function QAWizard(props: IQAWizardProps): JSX.Element {
    const initialState: IQAWizardState = {
        isOpen: true,
        stateForOutputId: {},
    };
    const [state, dispatch] = useReducer(reducer, initialState);
    useEffect(() => {
        const act: IActionNewOutput = { type: ActionType.NEW_OUTPUT, projectOutputId: props.projectOutputId };
        dispatch(act);
    }, [props.projectOutputId]);
    if (props.isDisabled) return <></>;
    const currState = state.stateForOutputId[props.projectOutputId] || initStateForOutputId();
    const getOnNext = (onNext: () => void, onClose: () => void, activeStep: WizardStep) => () => {
        if (activeStep.id !== currState.steps.length - 1) return onNext();
        const act: IActionSetNextDisabled = {
            type: ActionType.SET_DISABLED,
            projectOutputId: props.projectOutputId,
            disabled: true,
        };
        dispatch(act);
        getNextStep(onNext, onClose, props, state, dispatch);
    };
    const CustomFooter = (
        <WizardFooter>
            {currState.solErr && <Alert variant="danger" title={`${currState.solErr}`} />}
            <WizardContextConsumer>
                {({ onNext, onClose, activeStep }) => (
                    <>
                        <Button
                            onClick={getOnNext(onNext, onClose, activeStep)}
                            isDisabled={currState.disableNextButton}
                        >
                            {currState.disableNextButton ? 'Processing...' : 'Next'}
                            {currState.disableNextButton && <Spinner isSVG size="md" />}
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
                problems: currState.steps.map((s) => s.problem),
                setResolvedProblem: (idx, problem) => {
                    const act: IActionUpdateProblem = {
                        type: ActionType.UPDATE_PROBLEM,
                        projectOutputId: props.projectOutputId,
                        idx,
                        problem,
                    };
                    dispatch(act);
                },
                getOnNext,
            }}
        >
            <Wizard
                steps={currState.steps}
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

QAWizard.displayName = 'QAWizard';

export { QAWizard, IQAComponentProps };
