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
    PageSection,
    TextContent,
    Text,
    TextVariants,
    Modal,
    ModalVariant,
    Gallery,
    Card,
    Radio,
    CardBody,
    TextArea,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    Button,
    CardHeader,
    CardActions,
    Dropdown,
    CardTitle,
    KebabToggle,
    DropdownItem,
} from '@patternfly/react-core';
import { ApplicationContext } from './ApplicationContext';
import Yaml from 'js-yaml';
import { IService } from '@app/Application/Types';

interface IPlanTabState {
    showServiceOption: string;
    showServiceKebab: string;
    editPlanModal: boolean;
}

class PlanTab extends React.Component<Readonly<unknown>, IPlanTabState> {
    planYaml = '';
    refreshTimerID = 0;

    constructor(props: Readonly<unknown>) {
        super(props);
        this.refresh = this.refresh.bind(this);
        this.generatePlan = this.generatePlan.bind(this);
        this.openEditPlanModal = this.openEditPlanModal.bind(this);
        this.closeEditPlanModal = this.closeEditPlanModal.bind(this);
        this.kebabToggle = this.kebabToggle.bind(this);
        this.deleteService = this.deleteService.bind(this);
        this.updatePlan = this.updatePlan.bind(this);
        this.showServiceOption = this.showServiceOption.bind(this);
        this.closeServiceOption = this.closeServiceOption.bind(this);
        this.handleServiceOptionChange = this.handleServiceOptionChange.bind(this);

        this.state = {
            showServiceOption: 'none',
            showServiceKebab: 'none',
            editPlanModal: false,
        };
    }

    refresh(): void {
        this.context.updateApp();
    }

    async generatePlan(aName: string, aStatus: Array<string>): Promise<void> {
        if (aStatus.includes('assets')) {
            const value = new URLSearchParams(window.location.search);
            const debugSuffix = value.get('debug') ? `?debug=${value.get('debug')}` : '';
            const url = '/api/v1/applications/' + encodeURIComponent(aName) + '/plan' + debugSuffix;
            try {
                const res = await fetch(url, { method: 'POST' });
                if (res.status > 400) {
                    alert('Error while starting plan.');
                    throw new Error(`Failed to start plan generation for the app ${aName}. Status: ${res.status}`);
                }
                this.context.updateApp();
                alert(
                    'Plan generation started. Come back in 5 mins for smaller projects and in half an hour for large projects and hit refresh.',
                );
            } catch (e) {
                console.error(e);
            }
        } else {
            alert('Upload assets before starting plan generation.');
        }
    }

    openEditPlanModal(): void {
        this.planYaml = Yaml.dump(this.context.aPlan);
        this.setState({ editPlanModal: true });
    }

    closeEditPlanModal(): void {
        this.setState({ editPlanModal: false });
    }

    kebabToggle(servicename: string): void {
        if (this.state.showServiceKebab == servicename) {
            this.setState({ showServiceKebab: 'none' });
        } else {
            this.setState({ showServiceKebab: servicename });
        }
    }

    deleteService(serviceName: string): void {
        delete this.context.aPlan.spec.inputs.services[serviceName];
        this.setState({ showServiceKebab: 'none' });
        this.updatePlan();
    }

    async updatePlan(): Promise<void> {
        const url = '/api/v1/applications/' + encodeURIComponent(this.context.aName) + '/plan';
        const formdata = new FormData();
        const planYaml = Yaml.dump(this.context.aPlan);
        formdata.append('plan', planYaml);
        try {
            const res = await fetch(url, { method: 'PUT', body: formdata });
            if (!res.ok)
                throw new Error(`Failed to update the plan for the app ${this.context.aName}. Status: ${res.status}`);
            this.planYaml = planYaml;
            console.log('Uploaded file');
        } catch (e) {
            console.error(e);
        }
        this.context.updateApp();
    }

    showServiceOption(option: string): void {
        this.setState({ showServiceOption: option });
    }

    closeServiceOption(): void {
        this.setState({ showServiceOption: '' });
    }

    handleServiceOptionChange(serviceName: string, option: number): void {
        const oldoption = this.context.aPlan.spec.inputs.services[serviceName][0];
        this.context.aPlan.spec.inputs.services[serviceName][0] = this.context.aPlan.spec.inputs.services[serviceName][
            option
        ];
        this.context.aPlan.spec.inputs.services[serviceName][option] = oldoption;
        this.setState({ showServiceOption: '' });
        this.updatePlan();
    }

    componentDidMount(): void {
        this.refreshTimerID = window.setInterval(this.refresh, 30000);
    }

    componentDidUpdate(): void {
        clearInterval(this.refreshTimerID);
        this.refreshTimerID = window.setInterval(this.refresh, 30000);
    }

    componentWillUnmount(): void {
        clearInterval(this.refreshTimerID);
    }

    render(): JSX.Element {
        const { showServiceOption, showServiceKebab, editPlanModal } = this.state;

        return (
            <ApplicationContext.Consumer>
                {({ aName, aPlan, aStatus }) => (
                    <PageSection>
                        <Toolbar>
                            <ToolbarContent>
                                <ToolbarItem>
                                    <Button variant="primary" onClick={() => this.generatePlan(aName, aStatus)}>
                                        Generate Plan
                                    </Button>
                                </ToolbarItem>
                                <ToolbarItem>
                                    <Button variant="primary" onClick={this.refresh}>
                                        Refresh
                                    </Button>
                                </ToolbarItem>
                                {this.context.aPlan && (
                                    <ToolbarItem>
                                        <Button variant="primary" onClick={this.openEditPlanModal}>
                                            View Plan
                                        </Button>
                                        <Modal
                                            isOpen={editPlanModal}
                                            variant={ModalVariant.small}
                                            showClose={true}
                                            onClose={this.closeEditPlanModal}
                                            aria-describedby="wiz-modal-example-description"
                                            aria-labelledby="wiz-modal-example-title"
                                        >
                                            <TextContent>
                                                <TextArea aria-label="Plan" value={Yaml.dump(aPlan)} rows={100} />
                                            </TextContent>
                                        </Modal>
                                    </ToolbarItem>
                                )}
                            </ToolbarContent>
                        </Toolbar>
                        {this.context.aPlan && this.context.aPlan.spec && this.context.aPlan.spec.inputs && (
                            <PageSection>
                                <TextContent>
                                    <Text component={TextVariants.h2}>Services</Text>
                                </TextContent>
                                {Object.entries(aPlan.spec.inputs.services).map(
                                    ([serviceName, service]: [string, Array<IService>], id: number) => (
                                        <Card key={serviceName}>
                                            <CardHeader>
                                                <CardActions>
                                                    <Dropdown
                                                        toggle={
                                                            <KebabToggle
                                                                onToggle={() => {
                                                                    this.kebabToggle(
                                                                        Object.keys(aPlan.spec.inputs.services)[id],
                                                                    );
                                                                }}
                                                            />
                                                        }
                                                        isOpen={
                                                            Object.keys(aPlan.spec.inputs.services)[id] ==
                                                            showServiceKebab
                                                        }
                                                        isPlain
                                                        dropdownItems={[
                                                            <DropdownItem
                                                                key="link"
                                                                onClick={() => {
                                                                    this.deleteService(
                                                                        Object.keys(aPlan.spec.inputs.services)[id],
                                                                    );
                                                                }}
                                                            >
                                                                Delete
                                                            </DropdownItem>,
                                                        ]}
                                                        position={'right'}
                                                    />
                                                </CardActions>
                                                <CardTitle>{Object.keys(aPlan.spec.inputs.services)[id]}</CardTitle>
                                            </CardHeader>
                                            <PageSection key={Object.keys(aPlan.spec.inputs.services)[id]}>
                                                <Gallery hasGutter>
                                                    {Object.values(service).map(
                                                        (serviceoption: IService, optionid: number) => (
                                                            <PageSection
                                                                key={serviceoption.serviceName + '_' + optionid}
                                                            >
                                                                <Card
                                                                    isHoverable
                                                                    key={serviceoption.serviceName + '_' + optionid}
                                                                >
                                                                    <Modal
                                                                        isOpen={
                                                                            serviceoption.serviceName +
                                                                                '_' +
                                                                                optionid ==
                                                                            showServiceOption
                                                                        }
                                                                        variant={ModalVariant.small}
                                                                        showClose={true}
                                                                        onClose={this.closeServiceOption}
                                                                        aria-describedby="wiz-modal-example-description"
                                                                        aria-labelledby="wiz-modal-example-title"
                                                                    >
                                                                        <TextContent>
                                                                            <TextArea
                                                                                aria-label="service option"
                                                                                value={Yaml.dump(serviceoption)}
                                                                                rows={17}
                                                                            />
                                                                        </TextContent>
                                                                    </Modal>
                                                                    <CardBody>
                                                                        <Radio
                                                                            isChecked={optionid == 0}
                                                                            name={serviceoption.serviceName}
                                                                            onChange={() =>
                                                                                this.handleServiceOptionChange(
                                                                                    serviceoption.serviceName,
                                                                                    optionid,
                                                                                )
                                                                            }
                                                                            id={
                                                                                serviceoption.serviceName +
                                                                                '_' +
                                                                                optionid
                                                                            }
                                                                            value={
                                                                                serviceoption.serviceName +
                                                                                '_' +
                                                                                optionid
                                                                            }
                                                                            aria-label={serviceoption.serviceName}
                                                                        />
                                                                        <TextContent>
                                                                            <Text
                                                                                component={TextVariants.h3}
                                                                                onClick={() =>
                                                                                    this.showServiceOption(
                                                                                        serviceoption.serviceName +
                                                                                            '_' +
                                                                                            optionid,
                                                                                    )
                                                                                }
                                                                                style={{ textAlign: 'center' }}
                                                                            >
                                                                                {serviceoption.translationType}
                                                                            </Text>
                                                                        </TextContent>
                                                                        <TextContent>
                                                                            <Text
                                                                                component={TextVariants.p}
                                                                                style={{ textAlign: 'center' }}
                                                                            >
                                                                                {serviceoption.containerBuildType}
                                                                            </Text>
                                                                        </TextContent>
                                                                    </CardBody>
                                                                </Card>
                                                            </PageSection>
                                                        ),
                                                    )}
                                                </Gallery>
                                            </PageSection>
                                        </Card>
                                    ),
                                )}
                            </PageSection>
                        )}
                    </PageSection>
                )}
            </ApplicationContext.Consumer>
        );
    }
}

PlanTab.contextType = ApplicationContext;

export { PlanTab };
