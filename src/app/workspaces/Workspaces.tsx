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

import {
    Alert,
    Modal,
    Button,
    Toolbar,
    Bullseye,
    TextContent,
    ToolbarItem,
    PageSection,
    ModalVariant,
    ToolbarContent,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { sortByTimeStamp } from '@app/common/utils';
import { getWorkspaceStatus } from '@app/networking/api';
import React, { useContext, useEffect, useState } from 'react';
import { NewWorkspaceForm } from '@app/workspaces/NewWorkspaceForm';
import { ApplicationContext } from '@app/common/ApplicationContext';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';
import { ErrHTTP401, IWorkspace, WorkspacesRowT } from '@app/common/types';
import { Table, TableHeader, TableBody, IRow, IAction } from '@patternfly/react-table';

interface IWorkspacesToolbarProps {
    showDeleteButton: boolean;
    error: Error | null;
    refresh: () => void;
    deleteSelectedRows: () => void;
}

function WorkspacesToolbar(props: IWorkspacesToolbarProps): JSX.Element {
    const [isOpen, setOpen] = useState(false);
    return (
        <Toolbar>
            <ToolbarContent>
                <ToolbarItem>
                    <Button onClick={() => setOpen(true)}>New Workspace</Button>
                </ToolbarItem>
                <ToolbarItem>
                    <Button onClick={props.refresh}>Refresh</Button>
                </ToolbarItem>
                {props.showDeleteButton && (
                    <ToolbarItem>
                        <Button variant="danger" onClick={props.deleteSelectedRows}>
                            Delete Selected
                        </Button>
                    </ToolbarItem>
                )}
                {props.error && (
                    <ToolbarItem>
                        <Alert variant="danger" title={`${props.error}`} />
                    </ToolbarItem>
                )}
            </ToolbarContent>
            <Modal
                isOpen={isOpen}
                showClose={true}
                onClose={() => setOpen(false)}
                variant={ModalVariant.small}
                aria-describedby="create-workspace-modal"
                aria-labelledby="create-workspace-modal"
            >
                <NewWorkspaceForm refresh={props.refresh} />
            </Modal>
        </Toolbar>
    );
}

function getRowsFromWorkspaces(workspaces: Array<IWorkspace>): Array<WorkspacesRowT> {
    return sortByTimeStamp(workspaces).map((work) => ({
        cells: [
            {
                id: work.id,
                name: work.name || `id: <${work.id}>`,
                title: (
                    <Link key={work.id} to={'/workspaces/' + work.id}>
                        {work.name || `id: <${work.id}>`}
                    </Link>
                ),
            },
            new Date(work.timestamp).toString(),
            getWorkspaceStatus(work),
        ],
        selected: false,
    }));
}

function Workspaces(props: RouteComponentProps<{ workspaceId: string }>): JSX.Element {
    const { workspaces, listWorkspaces, deleteWorkspace, goToRoute } = useContext(ApplicationContext);
    const [toggle, setToggle] = useState(false);
    const [deleteTargets, setDeleteTargets] = useState<Array<{ id: string; name: string }>>([]);
    const [rows, setRows] = useState<Array<WorkspacesRowT>>([]);
    const [workErr, setWorkErr] = useState<Error | null>(null);
    const workspacesJSON = JSON.stringify(workspaces);

    console.log('inside Workspaces props.match', props.match);

    useEffect(() => {
        console.log('inside useEffect 1 of Workspaces');
        listWorkspaces()
            .then(() => setWorkErr(null))
            .catch((e) => {
                setWorkErr(e);
                if (e instanceof ErrHTTP401) goToRoute('/login');
            });
    }, [toggle, listWorkspaces, goToRoute]);
    useEffect(() => {
        console.log('inside useEffect 2 of Workspaces');
        setRows(getRowsFromWorkspaces(Object.values(workspaces)));
    }, [workspacesJSON]); // eslint-disable-line react-hooks/exhaustive-deps

    if (props.match.params.workspaceId) {
        return <Redirect to={`/workspaces/${props.match.params.workspaceId}/projects`} />;
    }

    const actions: Array<IAction> = [
        {
            title: 'Details',
            onClick: (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length === 0) return;
                goToRoute('/workspaces/' + (rowData as WorkspacesRowT).cells[0].id);
            },
        },
        {
            title: 'Delete',
            onClick: (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length === 0) return;
                const t1 = rowData as WorkspacesRowT;
                setDeleteTargets([{ id: t1.cells[0].id, name: t1.cells[0].name }]);
            },
        },
    ];
    const onRowSelect = (_: unknown, isSelected: boolean, rowId: number): void => {
        console.log('inside onRowSelect Workspaces', isSelected, rowId);
        if (rowId === -1) {
            const newRows = rows.map((r) => ({ ...r, selected: isSelected }));
            console.log('inside onRowSelect, inside if block, newRows', newRows);
            return setRows(newRows);
        }
        const newRows = rows.slice();
        newRows[rowId] = { ...newRows[rowId], selected: isSelected };
        console.log('inside onRowSelect, outside if block, newRows', newRows);
        return setRows(newRows);
    };
    return (
        <PageSection>
            <WorkspacesToolbar
                error={workErr}
                refresh={() => setToggle(!toggle)}
                showDeleteButton={rows.some((r) => r.selected)}
                deleteSelectedRows={() =>
                    setDeleteTargets(
                        rows.filter((r) => r.selected).map((r) => ({ id: r.cells[0].id, name: r.cells[0].name })),
                    )
                }
            />
            {rows.length === 0 && (
                <Bullseye className="flex-direction-column">
                    <CubesIcon size="xl" />
                    <TextContent>
                        Did not find any workspaces.
                        <br />
                        This could be because no workspaces exist, or because you do not have access to any workspaces.
                        <br />
                        Please contact an admin to create workspaces for you and/or to get access.
                    </TextContent>
                </Bullseye>
            )}
            {rows.length > 0 && (
                <Table
                    aria-label="Workspaces"
                    cells={['Name', 'Time of creation', 'Status']}
                    rows={rows}
                    onSelect={onRowSelect}
                    actionResolver={() => actions}
                >
                    <TableHeader />
                    <TableBody />
                </Table>
            )}
            <Modal
                aria-labelledby="delete-workspaces-modal"
                variant="small"
                showClose={true}
                isOpen={deleteTargets.length > 0}
                onClose={() => setDeleteTargets([])}
                actions={[
                    <Button
                        key="1"
                        variant="danger"
                        onClick={() => {
                            const pr = Promise.all(deleteTargets.map((d) => deleteWorkspace(d.id)));
                            pr.then(() => {
                                setDeleteTargets([]);
                            }).catch((e) => {
                                setWorkErr(new Error(`Some workspaces were not deleted. ${e}`));
                                setDeleteTargets([]);
                            });
                        }}
                    >
                        Confirm
                    </Button>,
                    <Button key="2" variant="plain" onClick={() => setDeleteTargets([])}>
                        Cancel
                    </Button>,
                ]}
            >
                The following workspaces will be deleted:
                <pre>{deleteTargets.map((d) => d.name).join('\n')}</pre>
                Proceed?
            </Modal>
        </PageSection>
    );
}

Workspaces.displayName = 'Workspaces';

export { Workspaces };
