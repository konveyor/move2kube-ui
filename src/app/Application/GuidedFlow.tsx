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
// import { Modal, Button, Form, FormGroup, ModalVariant, TextInput, ActionGroup } from '@patternfly/react-core';
import { PageSection, Wizard, WizardStep, WizardContextConsumer, Spinner } from '@patternfly/react-core';
import { ApplicationContext, IApplicationContext } from '@app/Application/ApplicationContext';
import { NewAppForm } from '@app/Application/NewApplication';
import { ApplicationAssetUpload } from '@app/Application/ApplicationAssets';
import { ArtifactsTab } from '@app/Application/ApplicationArtifacts';
import { IPlan, newPlan } from '@app/Application/Types';
import Yaml from 'js-yaml';
import { copy } from '@app/utils/utils';
import { createApp } from '@app/Networking/api';
import { generatePlan, waitForPlan, updateStatus } from '@app/Networking/api';
import { Prompt } from 'react-router-dom';

interface IGuidedFlowState {
    steps: Array<WizardStep>;
    appContext: IApplicationContext;
}

class GuidedFlow extends React.Component<Readonly<unknown>, IGuidedFlowState> {
    constructor(props: Readonly<unknown>) {
        super(props);
        this.newAppCreated = this.newAppCreated.bind(this);
        this.updateApp = this.updateApp.bind(this);

        const navWarn = 'Are you sure you want to leave? Some progress may be lost.';
        this.state = {
            steps: [
                {
                    name: 'Create a new app',
                    component: (
                        <WizardContextConsumer>
                            {({ onNext }) => (
                                <NewAppForm createNewApplication={(aName) => this.newAppCreated(aName, onNext)} />
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
                                    <ApplicationAssetUpload update={onNext} /> <Prompt message={navWarn} />
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
                    name: 'Translate',
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
                changeApp: () => {
                    /*do nothing*/
                },
                updateApp: () => {
                    /*do nothing*/
                },
                setNewPlan: (plan: string) => {
                    const appContext = copy(this.state.appContext);
                    const planJson = Yaml.load(plan) as IPlan;
                    appContext.aPlan = planJson;
                    this.setState({ appContext });
                },
                selectServiceOption: () => {
                    /*do nothing*/
                },
                deleteServiceOption: () => {
                    /*do nothing*/
                },
            },
        };
    }

    async newAppCreated(aName: string, onNext: () => void): Promise<void> {
        const appContext = copy(this.state.appContext);
        appContext.aName = aName;
        this.setState({ appContext });
        await createApp(aName);
        onNext();
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
            alert(`Error while starting plan generation. ${e}`);
        }
    }

    render(): JSX.Element {
        return (
            <>
                <h1>Generating the plan. Please wait, this could take a few minutes....</h1>
                <Spinner />
            </>
        );
    }
}

export { GuidedFlow };
