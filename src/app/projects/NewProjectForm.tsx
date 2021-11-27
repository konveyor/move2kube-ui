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

import React, { useContext, useState } from 'react';
import { ApplicationContext } from '@app/common/ApplicationContext';
import { Button, Form, FormGroup, TextInput, ActionGroup, Alert } from '@patternfly/react-core';
import { ErrHTTP401 } from '@app/common/types';

interface INewProjectFormProps {
    refresh: () => void;
}

function NewProjectForm(props: INewProjectFormProps): JSX.Element {
    const ctx = useContext(ApplicationContext);
    const [createErr, setCreateErr] = useState<Error | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    return (
        <Form
            isHorizontal
            onSubmit={(e) => {
                e.preventDefault();
                const newName = name.trim();
                if (newName.length === 0) return setCreateErr(new Error('The name cannot be empty.'));
                setName(newName);
                ctx.createProject({ id: '', timestamp: '', name: newName, description })
                    .then((p) => ctx.goToRoute(`/workspaces/${ctx.currentWorkspace.id}/projects/${p.id}`))
                    .catch((e) => {
                        setCreateErr(e);
                        if (e instanceof ErrHTTP401) return props.refresh();
                    });
            }}
        >
            {createErr && <Alert variant="danger" title={`${createErr}`} />}
            <FormGroup
                isRequired
                label="Name"
                fieldId="new-project-name"
                helperText="Enter the name of the new project."
            >
                <TextInput
                    isRequired
                    autoFocus
                    type="text"
                    id="new-project-name"
                    name="name"
                    title="The name of the new project."
                    value={name}
                    onChange={setName}
                    aria-describedby="new-project-name"
                    aria-label="Name"
                />
            </FormGroup>
            <FormGroup
                label="Description"
                fieldId="new-project-description"
                helperText="Enter a description for the new project."
            >
                <TextInput
                    type="text"
                    id="new-project-description"
                    name="description"
                    title="A description for the new project."
                    value={description}
                    onChange={setDescription}
                    aria-describedby="new-project-description"
                    aria-label="Description"
                />
            </FormGroup>
            <ActionGroup>
                <Button variant="primary" type="submit">
                    Create Project
                </Button>
            </ActionGroup>
        </Form>
    );
}

NewProjectForm.displayName = 'NewProjectForm';

export { NewProjectForm };
