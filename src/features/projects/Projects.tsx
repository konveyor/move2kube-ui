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

import { FunctionComponent, useState } from "react";
import {
    PageSection, Title, Alert, Spinner, Button,
    Modal, Form, FormGroup, TextInput, ActionGroup, Card, CardBody,
    Bullseye, TextContent, Tooltip, Split, SplitItem,
} from '@patternfly/react-core';
import { DataGrid, GridColumns, GridToolbar, GridRenderCellParams } from '@mui/x-data-grid';
import { IProject, useListProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectsMutation } from "./projectsApi";
import { useAppDispatch } from "../../app/hooks";
import { TrashIcon, SyncIcon, PlusIcon, CubesIcon, QuestionIcon } from '@patternfly/react-icons';
import { useParams, Link, useNavigate } from "react-router-dom";
import { useReadWorkspaceQuery } from "../workspaces/workspacesApi";
import { Inputs } from "../inputs/Inputs";
import { extractErrMsg } from "../common/utils";

const columns: GridColumns = [
    {
        field: 'name',
        flex: 1,
        editable: true,
        renderCell: (params: GridRenderCellParams<string>) => (
            <Link to={params.row.id}>{params.value}</Link>
        ),
    },
    {
        field: 'description',
        flex: 1,
        editable: true,
    },
    {
        field: 'timestamp',
        headerName: 'created at',
        type: 'dateTime',
        valueGetter: ({ value }) => value && new Date(value),
        flex: 1,
    },
    {
        field: 'inputs',
        headerName: 'no. of inputs',
        type: 'number',
        valueGetter: ({ value }) => value ? Object.keys(value).length : 0,
    },
    {
        field: 'outputs',
        headerName: 'no. of outputs',
        type: 'number',
        valueGetter: ({ value }) => value ? Object.keys(value).length : 0,
    },
    {
        field: 'status',
        type: 'string',
        valueGetter: ({ value }) => value ? Object.keys(value).join(', ') : '',
    },
];

const HelpText: FunctionComponent = () => (
    <div>
        You can click the project name to see the details of that project.<br />
        You can also double click a cell to edit it!<br />
        Press &apos;Enter&apos; once you are done editting to commit the changes.
    </div>
);

export const Projects: FunctionComponent = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { workspaceId } = useParams();
    const currentWorkspaceId: string = workspaceId ?? '';
    const { data: currentWorkspace, isLoading: isGettingWorkspace, error: getWorkspaceErr } = useReadWorkspaceQuery(currentWorkspaceId);
    const { data: workspaceProjects, isLoading: isListingProjects, error: listProjectsErr, refetch: refetchWorkspaceProjects } = useListProjectsQuery(currentWorkspaceId);
    const [createProject, { isLoading: isCreating, error: createError }] = useCreateProjectMutation();
    const [updateProject, { isLoading: isUpdating, error: updateError }] = useUpdateProjectMutation();
    const [deleteProjects, { isLoading: isDeleting, error: deleteError }] = useDeleteProjectsMutation();
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [selectedRows, setSelectedRows] = useState<Array<string>>([]);
    const rows = workspaceProjects ?? [];
    return (
        <PageSection>
            {getWorkspaceErr ? (
                <Alert variant="danger" title={extractErrMsg(listProjectsErr)} />
            ) : isGettingWorkspace ? (
                <Title headingLevel="h1">Workspace {currentWorkspaceId}</Title>
            ) : currentWorkspace ? (
                <>
                    <Title headingLevel="h1">Workspace {currentWorkspace?.name || currentWorkspace.id}</Title>
                    <br />
                    <table className="my-table">
                        <tbody>
                            <tr><td>ID</td><td>{currentWorkspace.id}</td></tr>
                            <tr><td>Name</td><td>{currentWorkspace.name}</td></tr>
                            <tr><td>Description</td><td>{currentWorkspace.description}</td></tr>
                            <tr><td>Created at</td><td>{`${new Date(currentWorkspace.timestamp)}`}</td></tr>
                        </tbody>
                    </table>
                </>
            ) : null}
            <br />
            {
                listProjectsErr ? (
                    <Alert variant="danger" title={extractErrMsg(listProjectsErr)} />
                ) : isListingProjects ? (
                    <Spinner />
                ) : workspaceProjects ? (
                    <>
                        <Card>
                            <CardBody>
                                <Title headingLevel="h2">Projects</Title>
                                <br />
                                <Split hasGutter>
                                    <SplitItem>
                                        <Button onClick={() => dispatch(refetchWorkspaceProjects)}><SyncIcon /> refresh</Button>
                                    </SplitItem>
                                    <SplitItem>
                                        <Button isDisabled={selectedRows.length === 0} onClick={() => selectedRows.length > 0 && setIsDeleteOpen(true)} variant="danger"><TrashIcon /> delete</Button>
                                    </SplitItem>
                                    <SplitItem>
                                        <Button onClick={() => setIsCreateOpen(true)} variant="secondary"><PlusIcon /> create</Button>
                                    </SplitItem>
                                    <SplitItem className="margin-left-auto">
                                        <Tooltip removeFindDomNode position="left" entryDelay={0} content={<HelpText />}>
                                            <Button variant="tertiary"><QuestionIcon /> help</Button>
                                        </Tooltip>
                                    </SplitItem>
                                </Split>
                                <br />
                                {!isCreating && createError && <Alert variant="danger" title={extractErrMsg(createError)} />}
                                {!isUpdating && updateError && <Alert variant="danger" title={extractErrMsg(updateError)} />}
                                {!isDeleting && deleteError && <Alert variant="danger" title={extractErrMsg(deleteError)} />}
                                {rows.length > 0 ? (
                                    <DataGrid
                                        autoHeight
                                        columns={columns}
                                        rows={rows}
                                        components={{ Toolbar: GridToolbar }}
                                        checkboxSelection
                                        disableSelectionOnClick
                                        selectionModel={selectedRows}
                                        onSelectionModelChange={xs => setSelectedRows(xs as Array<string>)}
                                        editMode='row'
                                        processRowUpdate={(p: IProject) => {
                                            console.log('updated project:', p);
                                            updateProject({ wid: currentWorkspaceId, project: p });
                                            return p;
                                        }}
                                        getRowClassName={({ indexRelativeToCurrentPage }) => indexRelativeToCurrentPage % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
                                        experimentalFeatures={{ newEditingApi: true }}
                                        initialState={{
                                            sorting: {
                                                sortModel: [{ field: 'timestamp', sort: 'desc' }],
                                            },
                                        }}
                                    />
                                ) : (
                                    <Bullseye className="flex-vertical">
                                        <CubesIcon size="xl" />
                                        <TextContent>
                                            Did not find any projects. Try creating a new one.
                                        </TextContent>
                                    </Bullseye>
                                )}
                            </CardBody>
                        </Card>
                        <br />
                        {
                            currentWorkspace && <Inputs
                                workspaceId={currentWorkspace.id}
                            />
                        }
                    </>
                ) : null
            }
            <Modal
                variant="small"
                title="Delete the selected projects?"
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                actions={[
                    <Button key="confirm-button" variant="danger" onClick={() => {
                        setIsDeleteOpen(false);
                        deleteProjects({ wid: currentWorkspaceId, pids: selectedRows });
                        setSelectedRows([]);
                    }}>Confirm</Button>,
                    <Button key="cancel-button" variant="plain" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                ]}>
                The following {selectedRows.length} projects will be deleted.
                This action cannot be reversed.
                <pre>{'  ' + selectedRows.map(id => rows.find(r => r.id === id)?.name || '').join('\n  ')}</pre>
            </Modal>
            <Modal
                variant="small"
                title="Create a new project"
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}>
                <Form noValidate={false} onSubmit={e => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = (formData.get('name') || '') as string;
                    const description = (formData.get('description') || '') as string;
                    const newProject: IProject = { id: '', name, description, timestamp: '' };
                    createProject({ wid: currentWorkspaceId, project: newProject })
                        .unwrap()
                        .then((payload) => {
                            setIsCreateOpen(false);
                            navigate(`/workspaces/${currentWorkspaceId}/projects/${payload.id}`);
                        })
                        .catch((...args) => console.error('failed to create a new project.', ...args));
                }}>
                    {!isCreating && createError && <Alert variant="danger" title={extractErrMsg(createError)} />}
                    <FormGroup label="Name" isRequired>
                        <TextInput autoFocus type="text" aria-label="name" name="name" isRequired />
                    </FormGroup>
                    <FormGroup label="Description">
                        <TextInput type="text" aria-label="description" name="description" />
                    </FormGroup>
                    <ActionGroup>
                        <Button type="submit">Create project</Button>
                    </ActionGroup>
                </Form>
            </Modal>
        </PageSection>);
};
