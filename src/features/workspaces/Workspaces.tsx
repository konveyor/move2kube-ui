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
import { IWorkspace, useCreateWorkspaceMutation, useDeleteWorkspacesMutation, useListWorkspacesQuery, useUpdateWorkspaceMutation } from "./workspacesApi";
import { useAppDispatch } from "../../app/hooks";
import { TrashIcon, SyncIcon, PlusIcon, CubesIcon, QuestionIcon } from '@patternfly/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import { extractErrMsg } from "../common/utils";
import { createToast } from "../toasts/toastsSlice";

const columns: GridColumns = [
    {
        field: 'name',
        flex: 1,
        editable: true,
        renderCell: (params: GridRenderCellParams<string>) => (
            <Link to={`/workspaces/${params.row.id}/projects`}>{params.value}</Link>
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
        field: 'project_ids',
        headerName: 'no. of projects',
        type: 'number',
        valueGetter: ({ value }) => value ? parseInt(value.length) : 0,
        width: 110,
    },
    {
        field: 'inputs',
        headerName: 'no. of inputs',
        type: 'number',
        valueGetter: ({ value }) => value ? Object.keys(value).length : 0,
    },
];

const HelpText: FunctionComponent = () => (
    <div>
        You can click the workspace name to see the projects in that workspace.<br />
        You can also double click a cell to edit it!<br />
        Press &apos;Enter&apos; once you are done editting to commit the changes.
    </div>
);

export const Workspaces: FunctionComponent = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [selectedRows, setSelectedRows] = useState<Array<string>>([]);
    const { data: workspaces, isLoading, error, refetch } = useListWorkspacesQuery();
    const [createWorkspace, { isLoading: isCreating, error: createError }] = useCreateWorkspaceMutation();
    const [updateWorkspace, { isLoading: isUpdating, error: updateError }] = useUpdateWorkspaceMutation();
    const [deleteWorkspaces, { isLoading: isDeleting, error: deleteError }] = useDeleteWorkspacesMutation();
    const rows = workspaces ?? [];
    return (
        <PageSection>
            <Title headingLevel="h1">Workspaces</Title>
            <br />
            {
                error ? (
                    <Alert variant="danger" title={extractErrMsg(error)} />
                ) : isLoading ? (
                    <Spinner />
                ) : workspaces ? (
                    <Card>
                        <CardBody>
                            <Split hasGutter>
                                <SplitItem>
                                    <Button onClick={() => dispatch(refetch)}><SyncIcon /> refresh</Button>
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
                            {!isUpdating && updateError && <Alert variant="danger" title={extractErrMsg(updateError)} />}
                            {rows.length > 0 ? (<DataGrid
                                autoHeight
                                columns={columns}
                                rows={rows}
                                components={{ Toolbar: GridToolbar }}
                                checkboxSelection
                                disableSelectionOnClick
                                selectionModel={selectedRows}
                                onSelectionModelChange={xs => setSelectedRows(xs as Array<string>)}
                                editMode='row'
                                processRowUpdate={(w: IWorkspace) => {
                                    updateWorkspace(w)
                                        .unwrap()
                                        .then(() => {
                                            dispatch(createToast({ id: 0, variant: 'success', message: `Updated the workspace with id: ${w.id}` }));
                                        })
                                        .catch((...args) => {
                                            console.error('failed to update the workspace:', ...args);
                                            dispatch(createToast({ id: 0, variant: 'danger', message: `Failed to update the workspace with id: ${w.id}` }));
                                        });
                                    return w;
                                }}
                                getRowClassName={({ indexRelativeToCurrentPage }) => indexRelativeToCurrentPage % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
                                experimentalFeatures={{ newEditingApi: true }}
                                initialState={{
                                    sorting: {
                                        sortModel: [{ field: 'timestamp', sort: 'desc' }],
                                    },
                                }}
                            />) : (
                                <Bullseye className="flex-vertical">
                                    <CubesIcon size="xl" />
                                    <TextContent>
                                        Did not find any workspaces.<br />
                                        This could be because no workspaces exist, or because you do not have access to any workspaces.<br />
                                        Please contact an admin to create workspaces for you and/or to get access.<br />
                                    </TextContent>
                                </Bullseye>
                            )}
                        </CardBody>
                    </Card>
                ) : null
            }
            <Modal
                variant="small"
                title="Delete the selected workspaces?"
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                actions={[
                    <Button key="confirm-button" variant="danger" onClick={() => {
                        deleteWorkspaces(selectedRows)
                            .unwrap()
                            .then(() => {
                                setIsDeleteOpen(false);
                                setSelectedRows([]);
                                dispatch(createToast({ id: 0, variant: 'success', message: 'Deleted the selected workspaces.' }));
                            })
                            .catch((...args) => console.error('failed to delete the selected workspaces.', ...args));
                    }}>Confirm</Button>,
                    <Button key="cancel-button" variant="plain" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                ]}>
                {!isDeleting && deleteError && <Alert variant="danger" title={extractErrMsg(deleteError)} />}
                The following {selectedRows.length} workspaces will be deleted.
                This action cannot be reversed.
                <pre>{'  ' + selectedRows.map(id => rows.find(r => r.id === id)?.name || '').join('\n  ')}</pre>
            </Modal>
            <Modal
                variant="small"
                title="Create a new workspace"
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}>
                <Form noValidate={false} onSubmit={e => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = (formData.get('name') || '') as string;
                    const description = (formData.get('description') || '') as string;
                    const newWorkspace: IWorkspace = { id: '', name, description, timestamp: '' };
                    createWorkspace(newWorkspace)
                        .unwrap()
                        .then((payload) => {
                            setIsCreateOpen(false);
                            navigate(`/workspaces/${payload.id}/projects`);
                            dispatch(createToast({ id: 0, variant: 'success', message: `Created a new workspace with the id: ${payload.id}` }));
                        })
                        .catch((...args) => console.error('failed to create a new workspace.', ...args));
                }}>
                    {!isCreating && createError && <Alert variant="danger" title={extractErrMsg(createError)} />}
                    <FormGroup label="Name" isRequired>
                        <TextInput autoFocus type="text" aria-label="name" name="name" isRequired />
                    </FormGroup>
                    <FormGroup label="Description">
                        <TextInput type="text" aria-label="description" name="description" />
                    </FormGroup>
                    <ActionGroup>
                        <Button type="submit">Create workspace</Button>
                    </ActionGroup>
                </Form>
            </Modal>
        </PageSection>);
};
