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
import { Modal, Button, Form, FormGroup, ModalVariant, TextInput, ActionGroup } from '@patternfly/react-core';

interface INewApplicationProps {
    update: () => void;
}

interface INewApplicationState {
    isModalOpen: boolean;
    aName: string;
}

class NewApplication extends React.Component<INewApplicationProps, INewApplicationState> {
    constructor(props: INewApplicationProps) {
        super(props);
        this.createNewApplication = this.createNewApplication.bind(this);
        this.openApplicationModal = this.openApplicationModal.bind(this);
        this.closeApplicationModal = this.closeApplicationModal.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);

        this.state = {
            isModalOpen: false,
            aName: 'new',
        };
    }

    async createNewApplication(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const formdata = new FormData();
        formdata.append('name', this.state.aName);
        try {
            const res = await fetch('/api/v1/applications', { method: 'POST', body: formdata });
            if (res.status == 400) {
                alert('Error while creating application.');
                throw new Error(`Failed to update create a new app ${this.state.aName}. Status: ${res.status}`);
            }
            this.props.update();
        } catch (e) {
            console.error(e);
        }
        this.closeApplicationModal();
    }

    openApplicationModal(): void {
        this.setState({ isModalOpen: true });
    }

    closeApplicationModal(): void {
        this.setState({ isModalOpen: false });
    }

    handleNameChange(aName: string): void {
        this.setState({ aName: aName.replace(/[^a-z0-9]/gi, '').toLowerCase() });
    }

    render(): JSX.Element {
        const { isModalOpen, aName } = this.state;

        return (
            <>
                <Button variant="primary" onClick={this.openApplicationModal}>
                    New Application
                </Button>
                <Modal
                    isOpen={isModalOpen}
                    variant={ModalVariant.small}
                    showClose={true}
                    onClose={this.closeApplicationModal}
                    aria-describedby="wiz-modal-example-description"
                    aria-labelledby="wiz-modal-example-title"
                >
                    <Form isHorizontal onSubmit={this.createNewApplication}>
                        <FormGroup
                            label="Name"
                            isRequired
                            fieldId="horizontal-form-name"
                            helperText="Enter name of application (only lowecase, no spaces)"
                        >
                            <TextInput
                                pattern="[a-zA-Z0-9]+"
                                title="App name must be alphanumeric without spaces or special characters."
                                value={aName}
                                isRequired
                                type="text"
                                id="aName"
                                aria-describedby="horizontal-form-name-helper"
                                name="aName"
                                onChange={this.handleNameChange}
                                aria-label="Name"
                            />
                        </FormGroup>
                        <ActionGroup>
                            <Button variant="primary" type="submit">
                                Create Application
                            </Button>
                        </ActionGroup>
                    </Form>
                </Modal>
            </>
        );
    }
}

export { NewApplication };
