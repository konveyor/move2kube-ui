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
    Card,
    Alert,
    Modal,
    Button,
    Toolbar,
    CardBody,
    CardTitle,
    CardHeader,
    ToolbarItem,
    TextContent,
    ToolbarContent,
} from '@patternfly/react-core';
import { QAWizard } from '@app/qa/QAWizard';
import { sortByTimeStamp } from '@app/common/utils';
import React, { useContext, useEffect, useState } from 'react';
import { ApplicationContext } from '@app/common/ApplicationContext';
import { ProjectOutputGraph, Graph } from '@app/projects/ProjectOutputGraph';
import { Table, TableHeader, TableBody, IAction, IRow } from '@patternfly/react-table';
import { ErrHTTP401, ProjectInputType, PROJECT_OUTPUT_STATUS_DONE } from '@app/common/types';
import {
    deleteProjectOutput,
    readProjectOutputURL,
    readProjectOutputGraphURL,
    startTransformation,
} from '@app/networking/api';

type ProjectOutputsRowT = {
    cells: [{ title: JSX.Element; id: string; name: string }, string, string];
    selected?: boolean;
};

interface IProjectOutputsProps {
    refresh: () => void;
}

function normalizeFilename(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function ProjectOutputs(props: IProjectOutputsProps): JSX.Element {
    const ctx = useContext(ApplicationContext);
    const [qaOutputId, setQAOutputId] = useState('');
    const [transformErr, setTransformErr] = useState<Error | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [showGraph, setShowGraph] = useState<string>('');
    const [graph, setGraph] = useState<Graph | undefined>();

    useEffect(() => {
        (async () => {
            if (!ctx.currentWorkspace.id || !ctx.currentProject.id || !showGraph) return;
            const graphURL = readProjectOutputGraphURL(ctx.currentWorkspace.id, ctx.currentProject.id, showGraph);
            const res = await fetch(graphURL);
            const graph: Graph = await res.json();
            console.log('got the graph', graph);
            setGraph(graph);
        })().catch((e) => console.error('failed to fetch the graph. Error:', e));
    }, [ctx.currentWorkspace.id, ctx.currentProject.id, showGraph]);

    const rows: Array<ProjectOutputsRowT> = sortByTimeStamp(Object.values(ctx.currentProject.outputs || {})).map(
        (output) => ({
            cells: [
                {
                    id: output.id,
                    name: output.id,
                    title:
                        output.status === PROJECT_OUTPUT_STATUS_DONE ? (
                            <a
                                download={
                                    normalizeFilename(
                                        `${ctx.currentWorkspace.name}-${ctx.currentProject.name}-output-${output.id}`,
                                    ) + '.zip'
                                }
                                href={readProjectOutputURL(ctx.currentWorkspace.id, ctx.currentProject.id, output.id)}
                            >
                                {output.id}
                            </a>
                        ) : (
                            <a onClick={() => setQAOutputId(output.id)}>{output.id}</a>
                        ),
                },
                new Date(output.timestamp).toString(),
                output.status,
            ],
        }),
    );
    const actions: Array<IAction> = [
        {
            title: 'Show graph',
            onClick: async (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length === 0) return;
                const t1 = rowData as ProjectOutputsRowT;
                const outputId = t1.cells[0].id;
                console.log('show the graph for the output', outputId);
                setShowGraph(outputId);
            },
        },
        {
            title: 'Delete',
            onClick: async (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length === 0) return;
                const t1 = rowData as ProjectOutputsRowT;
                setDeleteTarget({ id: t1.cells[0].id, name: t1.cells[0].name });
            },
        },
    ];
    let disableThisSection = !ctx.currentProject.status?.[ProjectInputType.Sources] || !ctx.currentProject.status?.plan;
    if (
        disableThisSection &&
        ctx.currentProject.status?.plan &&
        ctx.currentProject.status?.[ProjectInputType.Reference]
    ) {
        if (
            Object.values(ctx.currentProject.inputs || {})
                .filter((x) => x.type === ProjectInputType.Reference)
                .map((x) => ctx.currentWorkspace.inputs?.[x.id])
                .some((x) => x?.type === ProjectInputType.Sources)
        ) {
            disableThisSection = false;
        }
    }
    return (
        <Card>
            <CardTitle>Outputs</CardTitle>
            <CardHeader>
                <Toolbar>
                    <ToolbarContent>
                        <ToolbarItem>
                            <Button
                                isDisabled={disableThisSection}
                                onClick={() => {
                                    startTransformation(ctx.currentWorkspace.id, ctx.currentProject.id, false)
                                        .then((meta) => {
                                            setTransformErr(null);
                                            setQAOutputId(meta.id);
                                            props.refresh();
                                        })
                                        .catch((e) => {
                                            setTransformErr(e);
                                            if (e instanceof ErrHTTP401) props.refresh();
                                        });
                                }}
                            >
                                Start Transformation
                            </Button>
                        </ToolbarItem>
                        {transformErr && (
                            <ToolbarItem>
                                <Alert variant="danger" title={`${transformErr}`} />
                            </ToolbarItem>
                        )}
                    </ToolbarContent>
                </Toolbar>
            </CardHeader>
            <CardBody>
                <TextContent>
                    After transformation is done, click the id to download the transformation outputs.
                </TextContent>
                <Table
                    aria-label="Project outputs"
                    cells={['Id', 'Time of starting', 'Status']}
                    rows={rows}
                    actionResolver={() => actions}
                >
                    <TableHeader />
                    <TableBody />
                </Table>
                <QAWizard
                    isDisabled={qaOutputId === ''}
                    workspace={ctx.currentWorkspace}
                    project={ctx.currentProject}
                    projectOutputId={qaOutputId}
                    onClose={() => {
                        console.log('qa closed');
                        setQAOutputId('');
                        props.refresh();
                    }}
                    onCancel={() => {
                        console.log('qa cancelled');
                        setQAOutputId('');
                        props.refresh();
                    }}
                />
            </CardBody>
            <Modal
                aria-labelledby="delete-project-output-modal"
                variant="small"
                showClose={true}
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                actions={[
                    <Button
                        key="1"
                        variant="danger"
                        onClick={() => {
                            deleteProjectOutput(ctx.currentWorkspace.id, ctx.currentProject.id, deleteTarget?.id || '')
                                .then(() => {
                                    setDeleteTarget(null);
                                    props.refresh();
                                })
                                .catch((e) => {
                                    setTransformErr(e);
                                    if (e instanceof ErrHTTP401) props.refresh();
                                });
                        }}
                    >
                        Confirm
                    </Button>,
                    <Button key="2" variant="plain" onClick={() => setDeleteTarget(null)}>
                        Cancel
                    </Button>,
                ]}
            >
                The following output will be deleted:
                <pre>{deleteTarget?.name}</pre>
                Proceed?
            </Modal>
            <Modal
                className="project-output-graph-modal"
                aria-labelledby="show-project-output-graph-modal"
                variant="large"
                showClose={true}
                isOpen={showGraph !== ''}
                onClose={() => setShowGraph('')}
            >
                {!graph && <h1>Please wait while we fetch the graph</h1>}
                {graph && <ProjectOutputGraph graph={graph} />}
            </Modal>
        </Card>
    );
}

ProjectOutputs.displayName = 'ProjectOutputs';

export { ProjectOutputs };
