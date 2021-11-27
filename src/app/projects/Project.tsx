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

import React from 'react';
import { getProjectStatus } from '@app/networking/api';
import { ProjectPlan } from '@app/projects/ProjectPlan';
import { IProject, IWorkspace } from '@app/common/types';
import { Table, TableBody } from '@patternfly/react-table';
import { ProjectInputs } from '@app/projects/ProjectInputs';
import { ProjectOutputs } from '@app/projects/ProjectOutputs';
import { Alert, Button, PageSection, Title, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';

interface IProjectProps {
    refreshToggle: boolean;
    show: boolean;
    workspace: IWorkspace;
    project: IProject;
    error: Error | null;
    refresh: () => void;
}

function Project(props: IProjectProps): JSX.Element {
    const rows = props.project.id
        ? [
              {
                  cells: ['id', props.project.id],
              },
              {
                  cells: ['timestamp', new Date(props.project.timestamp).toString()],
              },
              {
                  cells: ['name', props.project.name || ''],
              },
              {
                  cells: ['description', props.project.description || ''],
              },
              {
                  cells: ['status', getProjectStatus(props.project.status).join(',')],
              },
          ]
        : [];
    return (
        <PageSection className="project-page-section">
            <Toolbar>
                <ToolbarContent>
                    <ToolbarItem>
                        <Button onClick={props.refresh}>Refresh</Button>
                    </ToolbarItem>
                    {props.error && (
                        <ToolbarItem>
                            <Alert variant="danger" title={`${props.error}`} />
                        </ToolbarItem>
                    )}
                </ToolbarContent>
            </Toolbar>
            {props.show && (
                <>
                    <Table
                        caption={
                            <Title headingLevel="h4" size="xl">
                                Project: {props.project.name || `id: <${props.project.id}>`}
                            </Title>
                        }
                        aria-label="project details"
                        cells={['Key', 'Value']}
                        rows={rows}
                    >
                        <TableBody />
                    </Table>
                    <ProjectInputs refresh={props.refresh} />
                    <ProjectPlan
                        workspace={props.workspace}
                        project={props.project}
                        refreshToggle={props.refreshToggle}
                        refresh={props.refresh}
                    />
                    <ProjectOutputs refresh={props.refresh} />
                </>
            )}
        </PageSection>
    );
}

Project.displayName = 'Project';

export { Project };
