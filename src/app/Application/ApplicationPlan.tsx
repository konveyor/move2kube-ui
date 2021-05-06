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
    Spinner,
} from '@patternfly/react-core';
import { ApplicationContext } from './ApplicationContext';
import Yaml from 'js-yaml';
import { IService } from '@app/Application/Types';
import { generatePlan, waitForPlan } from '@app/Networking/api';

interface IPlanProps {
    gotoNextStep?: () => void;
}

interface IPlanTabState {
    showServiceOption: string;
    showServiceKebab: string;
    planModalIsOpen: boolean;
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
        this.openEditPlanModal = this.openEditPlanModal.bind(this);
        this.closeEditPlanModal = this.closeEditPlanModal.bind(this);
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
            planModalIsOpen: false,
            planYaml: '',
            waitingForPlan: false,
        };
    }

    refresh(): void {
        this.context.updateApp();
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

    openEditPlanModal(): void {
        const planYaml = Yaml.dump(this.context.aPlan);
        this.setState({ planModalIsOpen: true, planYaml });
    }

    closeEditPlanModal(): void {
        this.setState({ planModalIsOpen: false });
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
            this.setState({ planModalIsOpen: false });
        } catch (e) {
            alert(`Failed to parse the plan yaml. ${e}`);
        }
    }

    componentDidMount(): void {
        this.refresh();
    }

    render(): JSX.Element {
        const { showServiceOption, showServiceKebab, planModalIsOpen, planYaml, waitingForPlan } = this.state;
        const { aName, aPlan, aStatus, isGuidedFlow } = this.context;

        return (
            <PageSection>
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
                                <Button variant="primary" onClick={this.openEditPlanModal}>
                                    View and edit the plan
                                </Button>
                                <Modal
                                    isOpen={planModalIsOpen}
                                    variant={ModalVariant.small}
                                    showClose={true}
                                    onClose={this.closeEditPlanModal}
                                    aria-describedby="wiz-modal-example-description"
                                    aria-labelledby="wiz-modal-example-title"
                                >
                                    <TextContent>
                                        <Button onClick={this.saveEdittedPlan}>Save and close</Button>
                                        <div style={{ height: '1em' }}></div>
                                        <TextArea
                                            aria-label="Plan"
                                            onChange={this.onPlanEditted}
                                            value={planYaml}
                                            rows={100}
                                        />
                                    </TextContent>
                                </Modal>
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
                                                isOpen={Object.keys(aPlan.spec.inputs.services)[id] == showServiceKebab}
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
                                            {Object.values(service).map((serviceoption: IService, optionid: number) => (
                                                <PageSection key={serviceoption.serviceName + '_' + optionid}>
                                                    <Card isHoverable key={serviceoption.serviceName + '_' + optionid}>
                                                        <Modal
                                                            isOpen={
                                                                serviceoption.serviceName + '_' + optionid ==
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
                                                                id={serviceoption.serviceName + '_' + optionid}
                                                                value={serviceoption.serviceName + '_' + optionid}
                                                                aria-label={serviceoption.serviceName}
                                                            />
                                                            <TextContent>
                                                                <Text
                                                                    component={TextVariants.h3}
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
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <Button
                                                                        onClick={() =>
                                                                            this.showServiceOption(
                                                                                serviceoption.serviceName +
                                                                                    '_' +
                                                                                    optionid,
                                                                            )
                                                                        }
                                                                    >
                                                                        Details
                                                                    </Button>
                                                                </div>
                                                            </TextContent>
                                                        </CardBody>
                                                    </Card>
                                                </PageSection>
                                            ))}
                                        </Gallery>
                                    </PageSection>
                                </Card>
                            ),
                        )}
                    </PageSection>
                )}
            </PageSection>
        );
    }
}

export { PlanTab };
