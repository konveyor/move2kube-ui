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
import Yaml from 'js-yaml';
import { copy } from '@app/utils/utils';
import { Prompt } from 'react-router-dom';
import { History, LocationState } from 'history';
import { ErrHTTP403 } from '@app/Networking/types';
import { PlanTab } from '@app/Application/ApplicationPlan';
import { createApp, updatePlan } from '@app/Networking/api';
import { NewAppForm } from '@app/Application/NewApplication';
import { ArtifactsTab } from '@app/Application/ApplicationArtifacts';
import { ApplicationContext } from '@app/Application/ApplicationContext';
import { ApplicationAssetUpload } from '@app/Application/ApplicationAssets';
import { generatePlan, waitForPlan, updateStatus } from '@app/Networking/api';
import { IPlan, newPlan, validatePlan, IApplicationContext } from '@app/Application/Types';
import { PageSection, Wizard, WizardStep, WizardContextConsumer, Spinner } from '@patternfly/react-core';

interface IGuidedFlowProps {
    history: History<LocationState>;
}

interface IGuidedFlowState {
    steps: Array<WizardStep>;
    appContext: IApplicationContext;
}

class GuidedFlow extends React.Component<IGuidedFlowProps, IGuidedFlowState> {
    constructor(props: IGuidedFlowProps) {
        super(props);
        this.uploadPlan = this.uploadPlan.bind(this);
        this.createNewApp = this.createNewApp.bind(this);
        this.updateApp = this.updateApp.bind(this);

        const navWarn = 'Are you sure you want to leave? Some progress may be lost.';
        this.state = {
            steps: [
                {
                    name: 'Create a new app',
                    component: (
                        <WizardContextConsumer>
                            {({ onNext }) => (
                                <NewAppForm createNewApplication={(aName) => this.createNewApp(aName, onNext)} />
                            )}
                        </WizardContextConsumer>
                    ),
                    canJumpTo: false,
                },
                {
                    name: 'Upload the sources',
                    component: (
                        <WizardContextConsumer>
                            {({ onNext }) => (
                                <>
                                    <ApplicationAssetUpload isCustomization={false} onNext={onNext} />{' '}
                                    <Prompt message={navWarn} />
                                </>
                            )}
                        </WizardContextConsumer>
                    ),
                    canJumpTo: false,
                },
                {
                    name: 'Generate the plan',
                    component: (
                        <WizardContextConsumer>
                            {({ onNext }) => (
                                <>
                                    <WaitForPlanGeneration
                                        callback={async () => {
                                            await this.updateApp();
                                            onNext();
                                        }}
                                    />
                                    <Prompt message={navWarn} />
                                </>
                            )}
                        </WizardContextConsumer>
                    ),
                    canJumpTo: false,
                },
                {
                    name: 'View and Edit the plan',
                    component: (
                        <WizardContextConsumer>
                            {({ onNext }) => (
                                <>
                                    <PlanTab gotoNextStep={onNext} />
                                    <Prompt message={navWarn} />
                                </>
                            )}
                        </WizardContextConsumer>
                    ),
                    canJumpTo: false,
                },
                {
                    name: 'Transform',
                    component: (
                        <>
                            <ArtifactsTab />
                            <Prompt message={navWarn} />
                        </>
                    ),
                    canJumpTo: false,
                },
            ],
            appContext: {
                aName: '',
                aStatus: [],
                aPlan: newPlan(),
                isGuidedFlow: true,
                changeApp: () => {
                    /*do nothing*/
                },
                updateApp: () => {
                    /*do nothing*/
                },
                setNewPlan: (plan: string) => {
                    const appContext = copy(this.state.appContext);
                    const aPlan = Yaml.load(plan) as IPlan;
                    const err = validatePlan(aPlan);
                    if (err) {
                        console.error(err);
                        alert(err);
                        throw err;
                    }
                    appContext.aPlan = aPlan;
                    this.setState({ appContext }, this.uploadPlan);
                },
                selectServiceOption: (_: string, __: number): void => {
                    /*do nothing*/
                },
                deleteServiceOption: (_: string): void => {
                    /*do nothing*/
                },
                goToRoute: (route: string, message?: string) => {
                    this.props.history.push(route);
                    if (message) alert(message);
                },
            },
        };
    }

    async uploadPlan(): Promise<void> {
        try {
            updatePlan(this.state.appContext.aName, this.state.appContext.aPlan);
            console.log('Uploaded the new plan');
            this.updateApp();
        } catch (e) {
            console.error(e);
        }
    }

    async createNewApp(aName: string, onNext: () => void): Promise<void> {
        try {
            const appContext = copy(this.state.appContext);
            appContext.aName = aName;
            this.setState({ appContext });
            await createApp(aName);
            onNext();
        } catch (e) {
            console.error(e);
            if (e instanceof ErrHTTP403) {
                return this.state.appContext.goToRoute('/login', e.message);
            }
            alert(`Error while creating a new app. ${e}`);
        }
    }

    async updateApp(): Promise<void> {
        try {
            const data = await updateStatus(this.state.appContext.aName);
            const appContext = copy(this.state.appContext);
            appContext.aName = data.name;
            appContext.aStatus = data.status;
            this.setState(() => ({ appContext }));
        } catch (e) {
            console.error(e);
        }
    }

    render(): JSX.Element {
        const { steps, appContext } = this.state;
        return (
            <PageSection>
                <ApplicationContext.Provider value={appContext}>
                    <Wizard
                        navAriaLabel="Guided flow steps"
                        mainAriaLabel="Guided flow content"
                        steps={steps}
                        footer={<div></div>}
                    />
                </ApplicationContext.Provider>
            </PageSection>
        );
    }
}

interface IWaitForPlanGenerationProps {
    callback: () => void;
}

class WaitForPlanGeneration extends React.Component<IWaitForPlanGenerationProps> {
    declare context: React.ContextType<typeof ApplicationContext>;
    static contextType = ApplicationContext;

    constructor(props: IWaitForPlanGenerationProps) {
        super(props);
    }

    async componentDidMount() {
        try {
            await generatePlan(this.context.aName);
            const plan = await waitForPlan(this.context.aName);
            this.context.setNewPlan(plan);
            this.props.callback();
        } catch (e) {
            console.error(e);
            if (e instanceof ErrHTTP403) {
                return this.context.goToRoute('/login', e.message);
            }
            alert(`Error while starting plan generation. ${e}`);
        }
    }

    render(): JSX.Element {
        return (
            <>
                <h1>Generating the plan. Please wait, this could take a few minutes....</h1>
                <Spinner isSVG />
            </>
        );
    }
}

export { GuidedFlow };
