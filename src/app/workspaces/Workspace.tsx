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
import { Title } from '@patternfly/react-core';
import { IWorkspace } from '@app/common/types';
import { getWorkspaceStatus } from '@app/networking/api';
import { Table, TableBody } from '@patternfly/react-table';
import { WorkspaceInputs } from '@app/workspaces/WorkspaceInputs';

interface IWorkspaceProps {
    workspace: IWorkspace;
    refresh: () => void;
}

function Workspace(props: IWorkspaceProps): JSX.Element {
    const rows = props.workspace.id
        ? [
              {
                  cells: ['id', props.workspace.id],
              },
              {
                  cells: ['timestamp', new Date(props.workspace.timestamp).toString()],
              },
              {
                  cells: ['name', props.workspace.name || ''],
              },
              {
                  cells: ['description', props.workspace.description || ''],
              },
              {
                  cells: ['status', getWorkspaceStatus(props.workspace)],
              },
              {
                  cells: ['project ids', props.workspace.project_ids?.join(',') || []],
              },
          ]
        : [];
    return (
        <>
            <Table
                caption={
                    <Title headingLevel="h4" size="xl">
                        Workspace: {props.workspace.name || `id: <${props.workspace.id}>`}
                    </Title>
                }
                aria-label="Workspace details"
                cells={['Key', 'Value']}
                rows={rows}
            >
                <TableBody />
            </Table>
            <WorkspaceInputs refresh={props.refresh} />
        </>
    );
}

Workspace.displayName = 'Workspace';

export { Workspace };
