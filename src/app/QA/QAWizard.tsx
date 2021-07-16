/*
Copyright IBM Corporation 2020

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

import React from 'react';
import {
    Button,
    Wizard,
    WizardFooter,
    WizardContextConsumer,
    WizardStep,
    WizardContextType,
} from '@patternfly/react-core';
import { MultiSelect } from './MultiSelect';
import { Select } from './Select';
import { Confirm } from './Confirm';
import { Input } from './Input';
import { Multiline } from './Multiline';
import { Password } from './Password';
import Yaml from 'js-yaml';
import { ProblemT } from './Types';

interface IQAWizardProps {
    aName: string;
    aPlan: unknown;
    aArtifactsName: string;
    disabled: boolean;
    close: () => void;
    update: () => void;
}

interface IQAWizardState {
    aName: string;
    aPlan: unknown;
    aArtifactsName: string;
    steps: Array<QAWizardStep>;
    disabled: boolean;
    currentQuestion?: ProblemT;
}

interface QAWizardStep extends WizardStep {
    local: boolean;
    problem?: ProblemT;
    handler?: () => void;
}

const localsteps: Array<QAWizardStep> = [
    {
        local: true,
        name: 'Get Started!',
        component: <p>Move2Kube will ask you a few questions, if it requires any assistance. Click Next to start.</p>,
    },
];

class QAWizard extends React.Component<IQAWizardProps, IQAWizardState> {
    currResolvedProblem: ProblemT;

    constructor(props: IQAWizardProps) {
        super(props);
        this.setResolvedProblem = this.setResolvedProblem.bind(this);
        this.getComponent = this.getComponent.bind(this);
        this.closeWizard = this.closeWizard.bind(this);
        this.getNextProblem = this.getNextProblem.bind(this);
        this.postSolution = this.postSolution.bind(this);
        this.getNextStep = this.getNextStep.bind(this);

        this.currResolvedProblem = {
            id: '',
            type: '',
            description: '',
            hints: [],
            options: [],
            default: null,
            answer: null,
        };
        this.state = {
            aName: props.aName,
            aPlan: props.aPlan,
            aArtifactsName: props.aArtifactsName,
            steps: [localsteps[0]],
            disabled: props.disabled,
        };
    }

    setResolvedProblem(resolvedProblem: ProblemT): void {
        this.currResolvedProblem = resolvedProblem;
    }

    getComponent(problem: ProblemT): JSX.Element {
        switch (problem.type) {
            case 'MultiSelect':
                return <MultiSelect key={problem.id} problem={problem} setResolvedProblem={this.setResolvedProblem} />;
            case 'Select':
                return <Select key={problem.id} problem={problem} setResolvedProblem={this.setResolvedProblem} />;
            case 'Input':
                return <Input key={problem.id} problem={problem} setResolvedProblem={this.setResolvedProblem} />;
            case 'Confirm':
                return <Confirm key={problem.id} problem={problem} setResolvedProblem={this.setResolvedProblem} />;
            case 'Multiline':
                return <Multiline key={problem.id} problem={problem} setResolvedProblem={this.setResolvedProblem} />;
            case 'Password':
                return <Password key={problem.id} problem={problem} setResolvedProblem={this.setResolvedProblem} />;
            default:
                throw new Error(`unknown solution type: ${problem}`);
        }
    }

    closeWizard(): void {
        this.props.close();
        this.props.update();
    }

    async getNextProblem(_: WizardStep, callback: () => void): Promise<void> {
        try {
            const url =
                '/api/v1/applications/' +
                encodeURIComponent(this.state.aName) +
                '/targetartifacts/' +
                encodeURIComponent(this.state.aArtifactsName) +
                '/problems/current';
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) {
                this.setState({ aArtifactsName: '' });
                this.closeWizard();
                throw new Error(
                    `Failed to get the next problem for the artifact ${this.state.aArtifactsName} of the app ${this.state.aName}. Status: ${res.status}`,
                );
            }
            const question = await res.json();
            const steps = this.state.steps.map((step) => ({ ...step, canJumpTo: false }));
            steps.push({
                local: false,
                name: question.id,
                component: this.getComponent(question),
                canJumpTo: false,
            });
            this.setState({ currentQuestion: question, steps, disabled: false }, callback);
        } catch (e) {
            console.error(e);
        }
    }

    async postSolution(activeStep: WizardStep, callback: () => void): Promise<void> {
        console.log(JSON.stringify(this.currResolvedProblem));
        try {
            const url =
                '/api/v1/applications/' +
                encodeURIComponent(this.state.aName) +
                '/targetartifacts/' +
                encodeURIComponent(this.state.aArtifactsName) +
                '/problems/current/solution';
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(this.currResolvedProblem),
            };
            const res = await fetch(url, options);
            if (!res.ok) {
                throw new Error(
                    `Failed to get the post the solution to the current problem for the artifact ${this.state.aArtifactsName} of the app ${this.state.aName}. Status: ${res.status}`,
                );
            }
            this.getNextProblem(activeStep, callback);
        } catch (e) {
            console.error(e);
        }
    }

    async getNextStep(activeStep: QAWizardStep, callback: WizardContextType['onClose']): Promise<void> {
        if (this.state.disabled) {
            return;
        }
        this.setState({ disabled: true });
        const lastlocalstepName = localsteps[localsteps.length - 1].name;
        if (this.state.aArtifactsName !== 'new') {
            if (activeStep.local) {
                // Resuming a previous run
                this.getNextProblem(activeStep, callback);
            } else {
                this.postSolution(activeStep, callback);
            }
        } else if (activeStep.name === lastlocalstepName) {
            if (activeStep.handler) {
                activeStep.handler();
            }
            const planYaml = Yaml.dump(this.state.aPlan);
            const formdata = new FormData();
            formdata.append('plan', planYaml);
            const value = new URLSearchParams(window.location.search);
            const debugSuffix = value.get('debug') ? `?debug=${value.get('debug')}` : '';
            const url =
                '/api/v1/applications/' + encodeURIComponent(this.state.aName) + '/targetartifacts' + debugSuffix;
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: formdata,
                });
                if (!res.ok)
                    throw new Error(
                        `Failed to send the plan ${planYaml} for the app ${this.state.aName}. Status: ${res.status}`,
                    );
                const artifacts = await res.text();
                this.setState({ aArtifactsName: artifacts, disabled: false }, () =>
                    this.getNextProblem(activeStep, callback),
                );
            } catch (e) {
                console.error(e);
            }
        } else {
            //Move to next local step
            if (activeStep.handler) {
                activeStep.handler();
            }
            // TODO: this is probably a bug since localsteps is never updated after it is defined.
            // At the very least it should be [this.state.steps.length-1]
            const newlocalstep = localsteps[this.state.steps.length];
            if (!newlocalstep.problem) {
                throw new Error('The local step has no problem configured.');
            }
            this.setResolvedProblem(newlocalstep.problem);
            const steps: Array<QAWizardStep> = this.state.steps.map((step) => ({ ...step, canJumpTo: false }));
            steps.push(newlocalstep);
            this.setState({ currentQuestion: newlocalstep.problem, steps, disabled: false }, callback);
        }
    }

    render(): JSX.Element {
        const { steps } = this.state;

        const CustomFooter = (
            <WizardFooter>
                <WizardContextConsumer>
                    {({ activeStep, onNext, onClose }) => {
                        return (
                            <>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    onClick={() => this.getNextStep(activeStep as QAWizardStep, onNext)}
                                    disabled={this.state.disabled}
                                >
                                    {this.state.disabled ? 'Processing...' : 'Next'}
                                </Button>
                                <Button variant="link" onClick={onClose}>
                                    Cancel
                                </Button>
                            </>
                        );
                    }}
                </WizardContextConsumer>
            </WizardFooter>
        );

        return <Wizard onClose={this.closeWizard} footer={CustomFooter} steps={steps} height={400} />;
    }
}

export { QAWizard };
