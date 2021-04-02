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
import { createApp } from '@app/Networking/api';

interface INewApplicationProps {
    update: (aName: string) => void;
}

interface INewApplicationState {
    isModalOpen: boolean;
}

class NewApplication extends React.Component<INewApplicationProps, INewApplicationState> {
    constructor(props: INewApplicationProps) {
        super(props);
        this.createNewApplication = this.createNewApplication.bind(this);
        this.openApplicationModal = this.openApplicationModal.bind(this);
        this.closeApplicationModal = this.closeApplicationModal.bind(this);

        this.state = { isModalOpen: false };
    }

    async createNewApplication(aName: string): Promise<void> {
        try {
            await createApp(aName);
            this.props.update(aName);
            this.closeApplicationModal();
        } catch (e) {
            alert(`Failed to create the app. ${e}`);
            console.error(e);
        }
    }

    openApplicationModal(): void {
        this.setState({ isModalOpen: true });
    }

    closeApplicationModal(): void {
        this.setState({ isModalOpen: false });
    }

    render(): JSX.Element {
        const { isModalOpen } = this.state;

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
                    <NewAppForm createNewApplication={this.createNewApplication} />
                </Modal>
            </>
        );
    }
}

interface INewAppFormProps {
    createNewApplication: (aName: string) => void;
}
interface INewAppFormState {
    aName: string;
}

class NewAppForm extends React.Component<INewAppFormProps, INewAppFormState> {
    constructor(props: INewAppFormProps) {
        super(props);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.state = { aName: '' };
    }

    handleNameChange(aName: string): void {
        this.setState({ aName: aName.replace(/[^a-z0-9]/gi, '').toLowerCase() });
    }

    render(): JSX.Element {
        const { createNewApplication } = this.props;
        const { aName } = this.state;

        return (
            <Form
                isHorizontal
                onSubmit={(e) => {
                    e.preventDefault();
                    createNewApplication(aName);
                }}
            >
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
                        name="aName"
                        aria-describedby="horizontal-form-name-helper"
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
        );
    }
}

export { NewApplication, NewAppForm };
