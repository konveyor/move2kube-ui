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
import { PageSection, TextArea, Toolbar, ToolbarContent, ToolbarItem, Button, Spinner } from '@patternfly/react-core';
import { ApplicationContext } from './ApplicationContext';
import Yaml from 'js-yaml';
import { generatePlan, waitForPlan } from '@app/Networking/api';

interface IPlanProps {
    gotoNextStep?: () => void;
}

interface IPlanTabState {
    showServiceOption: string;
    showServiceKebab: string;
    planYaml: string;
    waitingForPlan: boolean;
}

class PlanTab extends React.Component<IPlanProps, IPlanTabState> {
    declare context: React.ContextType<typeof ApplicationContext>;
    static contextType = ApplicationContext;

    constructor(props: IPlanProps) {
        super(props);
        this.refresh = this.refresh.bind(this);
        this.generatePlan = this.generatePlan.bind(this);
        this.kebabToggle = this.kebabToggle.bind(this);
        this.deleteService = this.deleteService.bind(this);
        this.showServiceOption = this.showServiceOption.bind(this);
        this.closeServiceOption = this.closeServiceOption.bind(this);
        this.handleServiceOptionChange = this.handleServiceOptionChange.bind(this);
        this.onPlanEditted = this.onPlanEditted.bind(this);
        this.saveEdittedPlan = this.saveEdittedPlan.bind(this);

        this.state = {
            showServiceOption: 'none',
            showServiceKebab: 'none',
            planYaml: '',
            waitingForPlan: false,
        };
    }

    async refresh(): Promise<void> {
        await this.context.updateApp();
        const planYaml = Yaml.dump(this.context.aPlan);
        this.setState({ planYaml });
    }

    async generatePlan(aName: string, aStatus: Array<string>): Promise<void> {
        if (!aStatus.includes('assets')) {
            return alert('Upload assets before starting plan generation.');
        }
        try {
            await generatePlan(aName);
            this.setState({ waitingForPlan: true });
            const plan = await waitForPlan(aName);
            this.setState({ waitingForPlan: false });
            this.context.setNewPlan(plan);
            this.context.updateApp();
        } catch (e) {
            console.error(e);
            alert(`Error while starting plan generation. ${e}`);
        }
    }

    kebabToggle(servicename: string): void {
        if (this.state.showServiceKebab == servicename) {
            this.setState({ showServiceKebab: 'none' });
        } else {
            this.setState({ showServiceKebab: servicename });
        }
    }

    deleteService(serviceName: string): void {
        this.context.deleteServiceOption(serviceName);
        this.setState({ showServiceKebab: 'none' });
    }

    showServiceOption(option: string): void {
        this.setState({ showServiceOption: option });
    }

    closeServiceOption(): void {
        this.setState({ showServiceOption: '' });
    }

    handleServiceOptionChange(serviceName: string, optionIdx: number): void {
        this.context.selectServiceOption(serviceName, optionIdx);
        this.setState({ showServiceOption: '' });
    }

    onPlanEditted(planYaml: string): void {
        this.setState({ planYaml });
    }

    saveEdittedPlan(): void {
        try {
            this.context.setNewPlan(this.state.planYaml);
        } catch (e) {
            alert(`Failed to parse the plan yaml. ${e}`);
        }
    }

    componentDidMount(): void {
        this.refresh();
    }

    render(): JSX.Element {
        const { planYaml, waitingForPlan } = this.state;
        const { aName, aStatus, isGuidedFlow } = this.context;

        return (
            <PageSection style={{ height: '80vh', display: 'grid', gridTemplateRows: '4em 1fr' }}>
                <Toolbar>
                    <ToolbarContent>
                        {isGuidedFlow && (
                            <ToolbarItem>
                                <Button variant="primary" onClick={this.props.gotoNextStep}>
                                    Next Step
                                </Button>
                            </ToolbarItem>
                        )}
                        {!isGuidedFlow && (
                            <ToolbarItem>
                                <Button variant="primary" onClick={() => this.generatePlan(aName, aStatus)}>
                                    Generate Plan
                                </Button>
                            </ToolbarItem>
                        )}
                        <ToolbarItem>
                            <Button variant="primary" onClick={this.refresh}>
                                Refresh
                            </Button>
                        </ToolbarItem>
                        {this.context.aPlan.metadata.name && (
                            <ToolbarItem>
                                <Button onClick={this.saveEdittedPlan}>Save and close</Button>
                            </ToolbarItem>
                        )}
                    </ToolbarContent>
                </Toolbar>
                {waitingForPlan && (
                    <>
                        <h1>Generating the plan. Please wait, this could take a few minutes....</h1>
                        <Spinner />
                    </>
                )}
                {!waitingForPlan && <TextArea aria-label="Plan" onChange={this.onPlanEditted} value={planYaml} />}
            </PageSection>
        );
    }
}

export { PlanTab };
