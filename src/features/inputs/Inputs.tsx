/*
Copyright IBM Corporation 2023

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

import { DataGrid, GridColumns, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import {
    Form, FormGroup, FileUpload, Card, CardBody, Title, FormSelect,
    FormSelectOption, Alert, Split, SplitItem, Button, Modal, Bullseye,
    TextContent, Progress, ProgressVariant, ProgressMeasureLocation,
} from '@patternfly/react-core';
import { CubesIcon, SyncIcon, TrashIcon } from '@patternfly/react-icons';
import { FunctionComponent, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ProjectInputType } from '../common/types';
import { useReadProjectQuery } from '../projects/projectsApi';
import { useReadWorkspaceQuery } from '../workspaces/workspacesApi';
import { useCreateProjectInputMutation, useDeleteProjectInputsMutation } from './inputsApi';
import { deleteStatusesWithErrors, selectUploadStatuses } from "../inputs/inputsSlice";
import { API_BASE } from '../common/constants';
import { extractErrMsg } from '../common/utils';
import { createToast } from '../toasts/toastsSlice';

interface IInputsProps {
    isDisabled?: boolean;
    workspaceId: string;
    projectId?: string;
}

export const Inputs: FunctionComponent<IInputsProps> = ({ workspaceId, projectId }) => {
    const dispatch = useAppDispatch();
    const [inputType, setInputType] = useState<ProjectInputType>(ProjectInputType.Sources);
    const { data: currentWorkspace, isLoading: _isGettingWorkspace, error: _getWorkspaceErr, refetch: refetchWorkspace } = useReadWorkspaceQuery(workspaceId);
    const {
        data: currentProject, isLoading: _isGettingProject, error: _getProjectErr, refetch: refetchProject,
    } = useReadProjectQuery({ wid: workspaceId, pid: projectId ?? '' }, { skip: !projectId });
    const [createProjectInput, { isLoading: _isCreating, error: createError }] = useCreateProjectInputMutation();
    const [deleteProjectInputs, { isLoading: isDeleting, error: deleteError }] = useDeleteProjectInputsMutation();
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [selectedRows, setSelectedRows] = useState<Array<string>>([]);
    const [selectedWorkspaceInput, setSelectedWorkspaceInput] = useState<string>('');
    const uploadStatuses = useAppSelector(selectUploadStatuses);

    const workspaceInputs = currentWorkspace ? Object.keys(currentWorkspace.inputs ?? {}).sort().map(k => (currentWorkspace?.inputs ?? {})[k]) : [];
    const projectInputs = currentProject ? Object.keys(currentProject.inputs ?? {}).sort().map(k => (currentProject?.inputs ?? {})[k]) : [];
    const uploadStatusesArr = Object.keys(uploadStatuses).sort().map(k => uploadStatuses[k]);

    const handleFileUpload = (file?: File, workspaceInputId?: string) => {
        console.log('handleFileUpload start');
        if (workspaceInputId && currentProject?.inputs?.[workspaceInputId]) {
            return console.log(`The reference to workspace input ${workspaceInputId} already exists in this project.`);
        }
        console.log('handleFileUpload createProjectInput');
        createProjectInput({
            wid: workspaceId,
            pid: projectId,
            projectInput: { id: '', timestamp: '', type: inputType, name: file?.name },
            file,
            workspaceInputId,
        })
            .unwrap()
            .then((payload) => {
                if (projectId) refetchProject();
                else refetchWorkspace();
                dispatch(createToast({ id: 0, variant: 'success', message: `Created a new input with the id: ${payload.id}` }));
            })
            .catch((...args) => console.error('failed to create the input:', ...args));
    };

    const columns: GridColumns = [
        {
            field: 'name',
            flex: 1,
            renderCell: (params: GridRenderCellParams<string>) => (
                <a download href={`${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/inputs/${params.row.id}`}>{
                    params.row.type === ProjectInputType.Reference ? (
                        currentWorkspace?.inputs?.[params.row.id]?.name || params.row.id
                    ) : (
                        params.value
                    )
                }</a>
            ),
        },
        {
            field: 'type',
            flex: 1,
            valueGetter: (params) => params.value === ProjectInputType.Reference ? (
                params.value + ' - ' + currentWorkspace?.inputs?.[params.row.id]?.type || 'unknown'
            ) : (
                params.value
            ),
        },
        {
            field: 'timestamp',
            headerName: 'created at',
            type: 'dateTime',
            valueGetter: ({ value }) => value && new Date(value),
            flex: 1,
        },
    ];

    return (
        <Card>
            <CardBody>
                <Title headingLevel="h2">{projectId ? 'Inputs' : 'Workspace Inputs (shared between all projects in this workspace)'}</Title>
                <br />
                <Split hasGutter>
                    <SplitItem>
                        <Button onClick={() => {
                            if (projectId) refetchProject();
                            else refetchWorkspace();
                            dispatch(deleteStatusesWithErrors());
                        }}>
                            <SyncIcon /> refresh
                        </Button>
                    </SplitItem>
                    <SplitItem>
                        <Button
                            isDisabled={isDeleting || selectedRows.length === 0}
                            onClick={() => selectedRows.length > 0 && setIsDeleteOpen(true)}
                            variant="danger"><TrashIcon /> delete
                        </Button>
                    </SplitItem>
                </Split>
                <br />
                {((projectId && projectInputs.length > 0) || (!projectId && workspaceInputs.length > 0)) ? (
                    <DataGrid
                        autoHeight
                        columns={columns}
                        rows={projectId ? projectInputs : workspaceInputs}
                        components={{ Toolbar: GridToolbar }}
                        checkboxSelection
                        disableSelectionOnClick
                        selectionModel={selectedRows}
                        onSelectionModelChange={xs => setSelectedRows(xs as Array<string>)}
                    />
                ) : (
                    <Bullseye className="flex-vertical">
                        <CubesIcon size="xl" />
                        <TextContent>
                            Did not find any inputs for this {projectId ? 'project' : 'workspace'}. Try creating some.
                        </TextContent>
                    </Bullseye>
                )}
                {uploadStatusesArr.length > 0 && (
                    <Card>
                        <CardBody>
                            {
                                uploadStatusesArr.map((v) => (
                                    <Progress
                                        key={v.id}
                                        aria-label="progress-bar"
                                        value={v.percent}
                                        title={`${v.name} - ${v.error || 'UPLOADING'}`}
                                        variant={
                                            v.error ? (
                                                ProgressVariant.danger
                                            ) : v.percent === 100 ? (
                                                ProgressVariant.success
                                            ) : undefined
                                        }
                                        measureLocation={ProgressMeasureLocation.outside}
                                    />
                                ))
                            }
                        </CardBody>
                    </Card>
                )}
                <br />
                <Title headingLevel="h3">Types of inputs:</Title>
                <ul>
                    <li>Sources: An archive file (.zip, .tar, .tgz, etc.) containing a folder with source code files.</li>
                    <li>Customizations: An archive file containing a folder with customization files such as: custom transformers, parameterizers, files with information collected about the cluster, etc.</li>
                    <li>Configs: YAML files used to configure Move2Kube.</li>
                    {projectId && <li>Reference: Refer an input at the workspace level. Workspace level inputs are shared between all the projects in that workspace.</li>}
                </ul>
                {createError && (<Alert variant="danger" title={extractErrMsg(createError)} />)}
                <Form>
                    <FormGroup isRequired label="Project input type" fieldId="project-input-type">
                        <FormSelect
                            id="project-input-type"
                            name="project-input-type"
                            aria-label="Project input type"
                            value={inputType}
                            onChange={(s) => setInputType(s as ProjectInputType)}
                        >
                            <FormSelectOption value={ProjectInputType.Sources} label="Source folder" />
                            <FormSelectOption value={ProjectInputType.Customizations} label="Customization folder" />
                            <FormSelectOption value={ProjectInputType.Configs} label="Config file" />
                            {projectId && <FormSelectOption value={ProjectInputType.Reference} label="Reference a workspace input" />}
                        </FormSelect>
                    </FormGroup>
                    {inputType === ProjectInputType.Reference ? (
                        (currentWorkspace?.inputs ? (
                            <FormGroup isRequired label="Workspace input" fieldId="refer-workspace-input">
                                <FormSelect
                                    id="refer-workspace-input"
                                    name="refer-workspace-input"
                                    aria-label="Workspace input"
                                    value={selectedWorkspaceInput}
                                    onChange={id => {
                                        setSelectedWorkspaceInput(id)
                                        if (id === '') return;
                                        handleFileUpload(undefined, id);
                                    }}
                                >
                                    <FormSelectOption value="" label="" />
                                    {Object.values(currentWorkspace.inputs).map((inp) => (
                                        <FormSelectOption
                                            key={inp.id}
                                            value={inp.id}
                                            label={inp.name || `id: ${inp.id}`}
                                        />
                                    ))}
                                </FormSelect>
                            </FormGroup>
                        ) : (
                            <Alert variant="warning" title="There are no workspace level inputs" />
                        ))
                    ) : (
                        <FormGroup isRequired label="Project input file" fieldId="file-upload">
                            {
                                inputType === ProjectInputType.Configs ? (
                                    <FileUpload
                                        id="file-upload"
                                        name="file"
                                        type="text"
                                        onFileInputChange={(_, file) => handleFileUpload(file)}
                                        dropzoneProps={{
                                            accept: '.yaml,.yml',
                                        }}
                                    />
                                ) : (
                                    <FileUpload
                                        id="file-upload"
                                        name="file"
                                        onFileInputChange={(_, file) => handleFileUpload(file)}
                                        dropzoneProps={{
                                            accept: '.zip,.tar,.tar.gz,.tgz',
                                        }}
                                    />
                                )
                            }
                        </FormGroup>
                    )}
                </Form>
            </CardBody>
            <Modal
                variant="small"
                title="Delete the selected inputs?"
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                actions={[
                    <Button key="confirm-button" variant="danger" onClick={() => {
                        deleteProjectInputs({ wid: workspaceId, pid: projectId, inpIds: selectedRows })
                            .unwrap()
                            .then(() => {
                                setIsDeleteOpen(false);
                                setSelectedRows([]);
                                if (projectId) refetchProject();
                                else refetchWorkspace();
                                dispatch(createToast({ id: 0, variant: 'success', message: 'Deleted the selected inputs.' }));
                            })
                            .catch((...args) => console.error('failed to delete the inputs', ...args));
                    }}>Confirm</Button>,
                    <Button key="cancel-button" variant="plain" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                ]}>
                {!isDeleting && deleteError && (<Alert variant="danger" title={extractErrMsg(deleteError)} />)}
                The following {selectedRows.length} inputs will be deleted.
                This action cannot be reversed.
                <pre>{'  ' + selectedRows.map(id => projectInputs.find(r => r.id === id)?.name || '').join('\n  ')}</pre>
            </Modal>
        </Card>
    );
};
