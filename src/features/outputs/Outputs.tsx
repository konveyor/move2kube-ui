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

import { DataGrid, GridActionsCellItem, GridColumns, GridRenderCellParams, GridRowParams } from "@mui/x-data-grid";
import { Alert, Button, Card, CardBody, Modal, Spinner, Split, SplitItem, Title, Tooltip } from "@patternfly/react-core";
import { FunctionComponent, useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { API_BASE } from "../common/constants";
import { IProjectOutput } from "../common/types";
import { useDeleteProjectOutputsMutation, useStartTransformingMutation } from "./outputsApi";
import { QAWizard } from "./qa/QAWizard";
import { createStatus } from './outputsSlice';
import { QuestionIcon, TrashIcon } from "@patternfly/react-icons";
import { extractErrMsg, normalizeFilename } from "../common/utils";
import { Graph } from "./graph/Graph";

export interface IOutputsProps {
    isDisabled?: boolean;
    workspaceId: string;
    projectId: string;
    outputs?: { [id: string]: IProjectOutput };
    refetch?: () => void;
}

export const Outputs: FunctionComponent<IOutputsProps> = (props) => {
    const dispatch = useAppDispatch();
    const [graphOutputId, setGraphOutputId] = useState<string>('');
    const columns: GridColumns = [
        {
            field: 'id',
            flex: 1,
            renderCell: (params: GridRenderCellParams<string>) => {
                return params.row.status === 'transforming' ? (
                    <Button variant="link" onClick={() => {
                        dispatch(createStatus({
                            workspaceId: props.workspaceId,
                            projectId: props.projectId,
                            outputId: params.value || '',
                        }));
                    }}>
                        {params.value}
                    </Button>
                ) : (
                    <a
                        download={normalizeFilename(`output-${params.value}`) + '.zip'}
                        href={`${API_BASE}/workspaces/${props.workspaceId}/projects/${props.projectId}/outputs/${params.value}`}>
                        {params.value}
                    </a>
                );
            },
        },
        {
            field: 'timestamp',
            headerName: 'started at',
            type: 'dateTime',
            valueGetter: ({ value }) => value && new Date(value),
            flex: 1,
        },
        {
            field: 'status',
            type: 'string',
        },
        {
            field: 'actions',
            type: 'actions',
            getActions: (params: GridRowParams) => params.row.status === 'done' ? [
                <GridActionsCellItem key="show-graph" showInMenu onClick={() => setGraphOutputId(params.row.id || '')} label="show graph" />,
            ] : [],
        },
    ];
    const isDisabled = props.isDisabled ?? false;
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [selectedRows, setSelectedRows] = useState<Array<string>>([]);
    const [startTransforming, { isLoading: isTransformStarting }] = useStartTransformingMutation();
    const [deleteProjectOutputs, { isLoading: isDeleting, error: deleteError }] = useDeleteProjectOutputsMutation();
    const rows: Array<IProjectOutput> = props.outputs ? Object.keys(props.outputs).sort().map(k => (props.outputs ?? {})[k]) : [];
    return (
        <Card>
            <CardBody>
                <Title headingLevel="h3">Outputs</Title>
                <br />
                <Split hasGutter>
                    <SplitItem>
                        <Button isDisabled={isDisabled || isTransformStarting} onClick={() => {
                            startTransforming({ wid: props.workspaceId, pid: props.projectId })
                                .unwrap()
                                .then(payload => {
                                    dispatch(createStatus({ workspaceId: props.workspaceId, projectId: props.projectId, outputId: payload.id }));
                                })
                                .catch(e => console.error('failed to start transformation.', e));
                        }}>
                            Start Transformation
                        </Button>
                    </SplitItem>
                    <SplitItem>
                        <Button isDisabled={selectedRows.length === 0} onClick={() => selectedRows.length > 0 && setIsDeleteOpen(true)} variant="danger"><TrashIcon /> delete</Button>
                    </SplitItem>
                    {isTransformStarting &&
                        <SplitItem>
                            <Spinner size="lg" />
                        </SplitItem>
                    }
                    <SplitItem className="margin-left-auto">
                        <Tooltip
                            removeFindDomNode
                            position="left"
                            entryDelay={0}
                            content="After a transformation is done, you can click the id to download the transformation output.">
                            <Button variant="tertiary"><QuestionIcon /> help</Button>
                        </Tooltip>
                    </SplitItem>
                </Split>
                <br />
                {!isDeleting && deleteError && <><Alert variant="danger" title={extractErrMsg(deleteError)} /><br /></>}
                {rows.length > 0 &&
                    <DataGrid
                        autoHeight
                        checkboxSelection
                        disableSelectionOnClick
                        selectionModel={selectedRows}
                        onSelectionModelChange={xs => setSelectedRows(xs as Array<string>)}
                        rows={rows}
                        columns={columns}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: 'timestamp', sort: 'desc' }],
                            },
                        }}
                    />
                }
                <QAWizard refetch={props.refetch} />
            </CardBody >
            <Modal
                variant="small"
                title="Delete the selected projects?"
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                actions={[
                    <Button key="confirm-button" variant="danger" onClick={() => {
                        setIsDeleteOpen(false);
                        deleteProjectOutputs({ wid: props.workspaceId, pid: props.projectId, outputIds: selectedRows }).then(
                            () => props.refetch && props.refetch()
                        ).catch(console.error);
                        setSelectedRows([]);
                    }}>Confirm</Button>,
                    <Button key="cancel-button" variant="plain" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                ]}>
                The following {selectedRows.length} outputs will be deleted.
                This action cannot be reversed.
                <pre>{'  ' + selectedRows.join('\n  ')}</pre>
            </Modal>
            <Modal
                className="project-output-graph-modal"
                aria-labelledby="show-project-output-graph-modal"
                variant="large"
                title="Transformation graph"
                isOpen={graphOutputId !== ''}
                onClose={() => setGraphOutputId('')}>
                <Graph
                    workspaceId={props.workspaceId}
                    projectId={props.projectId}
                    outputId={graphOutputId} />
            </Modal>
        </Card>
    );
};
