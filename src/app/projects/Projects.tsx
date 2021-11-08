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
    Dropdown,
    ToolbarItem,
    TextContent,
    PageSection,
    DropdownItem,
    ModalVariant,
    DropdownToggle,
    ToolbarContent,
} from '@patternfly/react-core';
import { Project } from '@app/projects/Project';
import { CubesIcon } from '@patternfly/react-icons';
import { sortByTimeStamp } from '@app/common/utils';
import { Workspace } from '@app/workspaces/Workspace';
import { getProjectStatus } from '@app/networking/api';
import { Link, RouteComponentProps } from 'react-router-dom';
import { NewProjectForm } from '@app/projects/NewProjectForm';
import React, { useContext, useEffect, useState } from 'react';
import { ApplicationContext } from '@app/common/ApplicationContext';
import { Table, TableHeader, TableBody, IRow, IAction } from '@patternfly/react-table';
import { IProject, ProjectsRowT, DEFAULT_WORKSPACE_ID, IWorkspace, ErrHTTP401 } from '@app/common/types';

interface IProjectsToolbarProps {
    workspaces: { [id: string]: IWorkspace };
    currentWorkspace: IWorkspace;
    showDeleteButton: boolean;
    error: Error | null;
    refresh: () => void;
    switchWorkspace: (id: string) => void;
    deleteSelectedRows: () => void;
}

function ProjectsToolbar(props: IProjectsToolbarProps): JSX.Element {
    const [isOpen, setOpen] = useState(false);
    const [isWorkDropOpen, setIsWorkDropOpen] = useState(false);
    return (
        <Toolbar>
            <ToolbarContent>
                <ToolbarItem>
                    Workspaces:
                    <Dropdown
                        isOpen={isWorkDropOpen}
                        toggle={
                            <DropdownToggle onToggle={setIsWorkDropOpen}>
                                {props.currentWorkspace.name || `id: <${props.currentWorkspace.id}>`}
                            </DropdownToggle>
                        }
                        dropdownItems={sortByTimeStamp(Object.values(props.workspaces)).map((work) => (
                            <DropdownItem key={work.id} onClick={() => props.switchWorkspace(work.id)}>
                                {work.name || `id: <${work.id}>`}
                            </DropdownItem>
                        ))}
                    />
                </ToolbarItem>
                <ToolbarItem variant="separator" />
                <ToolbarItem>
                    <Button onClick={() => setOpen(true)}>New Project</Button>
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
                aria-describedby="create-project-modal"
                aria-labelledby="create-project-modal"
            >
                <NewProjectForm refresh={props.refresh} />
            </Modal>
        </Toolbar>
    );
}

function getRowsFromProjects(workspaceId: string, projects: Array<IProject>): Array<ProjectsRowT> {
    return sortByTimeStamp(projects).map((proj) => ({
        cells: [
            {
                id: proj.id,
                name: proj.name || `id: <${proj.id}>`,
                title: (
                    <Link key={proj.id} to={`/workspaces/${workspaceId}/projects/${proj.id}`}>
                        {proj.name || `id: <${proj.id}>`}
                    </Link>
                ),
            },
            new Date(proj.timestamp).toString(),
            getProjectStatus(proj.status).join(','),
        ],
        selected: false,
    }));
}

function Projects(props: RouteComponentProps<{ workspaceId: string; projectId: string }>): JSX.Element {
    const {
        currentWorkspace,
        switchWorkspace,
        workspaces,
        currentProject,
        switchProject,
        projects,
        listProjects,
        deleteProject,
        goToRoute,
    } = useContext(ApplicationContext);
    const [toggle, setToggle] = useState(false);
    const [toggle2, setToggle2] = useState(false);
    const [deleteTargets, setDeleteTargets] = useState<Array<{ id: string; name: string }>>([]);
    const [rows, setRows] = useState<Array<ProjectsRowT>>([]);
    const [projErr, setProjErr] = useState<Error | null>(null);
    const projectsJSON = JSON.stringify(projects);

    console.log('inside Projects props.match', props.match);

    useEffect(() => {
        console.log('inside useEffect 1 of Projects');
        listProjects()
            .then(() => setProjErr(null))
            .catch((e) => {
                setProjErr(e);
                if (e instanceof ErrHTTP401) goToRoute('/login');
            });
    }, [toggle, listProjects, goToRoute]);
    useEffect(() => {
        console.log('inside useEffect 2 of Projects');
        setRows(getRowsFromProjects(currentWorkspace.id, Object.values(projects)));
    }, [currentWorkspace.id, projectsJSON]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        console.log('inside useEffect 3 of Projects');
        if (props.match.params.workspaceId) {
            switchWorkspace(props.match.params.workspaceId)
                .then(() => setProjErr(null))
                .catch((e) => {
                    setProjErr(e);
                    if (e instanceof ErrHTTP401) goToRoute('/login');
                });
        }
        if (props.match.params.projectId) {
            switchProject(props.match.params.projectId)
                .then(() => setProjErr(null))
                .catch((e) => {
                    setProjErr(e);
                    if (e instanceof ErrHTTP401) goToRoute('/login');
                });
        }
    }, [
        props.match.params.workspaceId,
        props.match.params.projectId,
        toggle,
        toggle2,
        switchWorkspace,
        switchProject,
        goToRoute,
    ]);

    if (props.match.params.workspaceId === DEFAULT_WORKSPACE_ID) {
        return (
            <PageSection>
                <Bullseye className="flex-direction-column">
                    <CubesIcon size="xl" />
                    <TextContent>
                        No workspace selected.
                        <br />
                        This could be because no workspaces exist, or because you do not have access to any workspaces.
                        <br />
                        Please contact an admin to create workspaces for you and/or to get access.
                    </TextContent>
                </Bullseye>
            </PageSection>
        );
    }

    if (props.match.params.projectId) {
        return (
            <Project
                refreshToggle={toggle2}
                show={currentProject.id === props.match.params.projectId}
                workspace={currentWorkspace}
                project={currentProject}
                error={projErr}
                refresh={() => setToggle2(!toggle2)}
            ></Project>
        );
    }

    const actions: Array<IAction> = [
        {
            title: 'Details',
            onClick: (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length === 0) return;
                goToRoute(`/workspaces/${currentWorkspace.id}/projects/${(rowData as ProjectsRowT).cells[0].id}`);
            },
        },
        {
            title: 'Delete',
            onClick: (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length === 0) return;
                const t1 = rowData as ProjectsRowT;
                setDeleteTargets([{ id: t1.cells[0].id, name: t1.cells[0].name }]);
            },
        },
    ];
    const onRowSelect = (_: unknown, isSelected: boolean, rowId: number): void => {
        console.log('inside onRowSelect Projects', isSelected, rowId);
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
        <PageSection className="project-page-section">
            {currentWorkspace.id === props.match.params.workspaceId && <Workspace workspace={currentWorkspace} />}
            <ProjectsToolbar
                error={projErr}
                workspaces={workspaces}
                currentWorkspace={currentWorkspace}
                switchWorkspace={(id) => goToRoute(`/workspaces/${id}/projects`)}
                refresh={() => setToggle(!toggle)}
                showDeleteButton={rows.some((r) => r.selected)}
                deleteSelectedRows={() =>
                    setDeleteTargets(
                        rows.filter((r) => r.selected).map((r) => ({ id: r.cells[0].id, name: r.cells[0].name })),
                    )
                }
            />
            {currentWorkspace.id === props.match.params.workspaceId &&
                (rows.length === 0 ? (
                    <Bullseye className="flex-direction-column">
                        <CubesIcon size="xl" />
                        <TextContent>Did not find any projects. Try creating a new one.</TextContent>
                    </Bullseye>
                ) : (
                    <Table
                        aria-label="Projects"
                        cells={['Name', 'Time of creation', 'Status']}
                        rows={rows}
                        onSelect={onRowSelect}
                        actionResolver={() => actions}
                    >
                        <TableHeader />
                        <TableBody />
                    </Table>
                ))}
            <Modal
                variant="small"
                showClose={true}
                isOpen={deleteTargets.length > 0}
                onClose={() => setDeleteTargets([])}
                actions={[
                    <Button
                        key="1"
                        variant="danger"
                        onClick={() => {
                            const pr = Promise.all(deleteTargets.map((d) => deleteProject(d.id)));
                            pr.then(() => {
                                setDeleteTargets([]);
                            }).catch((e) => {
                                setProjErr(new Error(`Some projects were not deleted. ${e}`));
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
                The following projects will be deleted:
                <pre>{deleteTargets.map((d) => d.name).join('\n')}</pre>
                Proceed?
            </Modal>
        </PageSection>
    );
}

export { Projects };
