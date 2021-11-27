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
    ErrHTTP401,
    IWorkspaceInput,
    FileUploadStatus,
    ProjectInputType,
    SUPPORTED_ARCHIVE_FORMATS,
} from '@app/common/types';
import {
    Card,
    Form,
    Title,
    Alert,
    Modal,
    Button,
    CardBody,
    Progress,
    CardTitle,
    FormGroup,
    FormSelect,
    FileUpload,
    TextContent,
    ProgressVariant,
    FormSelectOption,
    ProgressMeasureLocation,
    Bullseye,
} from '@patternfly/react-core';
import React, { useContext, useState } from 'react';
import { ApplicationContext } from '@app/common/ApplicationContext';
import { deleteWorkspaceInput, readWorkspaceInputURL } from '@app/networking/api';
import { Table, TableHeader, TableBody, IAction, IRow } from '@patternfly/react-table';
import { CubesIcon } from '@patternfly/react-icons';

type WorkspaceInputsRowT = {
    cells: [{ title: JSX.Element; id: string; name: string }, string];
    selected?: boolean;
};

interface IWorkspaceInputsProps {
    refresh: () => void;
}

function WorkspaceInputs(props: IWorkspaceInputsProps): JSX.Element {
    const ctx = useContext(ApplicationContext);
    const [isRejected, setIsRejected] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [inputType, setInputType] = useState<ProjectInputType>(ProjectInputType.Sources);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const handleFileChange = async (newFile: string | File, newFilename: string): Promise<void> => {
        if (!newFile) return console.log('Invalid file type. Actual:', typeof newFile, newFile);
        if (typeof newFile === 'string') {
            // https://www.patternfly.org/v4/components/file-upload/#text-files
            // https://www.patternfly.org/v4/components/file-upload/#other-file-types
            const err = "string files aren't supported right now";
            console.error(err);
            return alert(err);
        }
        if (SUPPORTED_ARCHIVE_FORMATS.some((ext) => newFilename.endsWith(ext))) {
            if (inputType !== ProjectInputType.Sources && inputType !== ProjectInputType.Customizations) {
                const err = `The file '${newFilename}' seems to be an archive (zip, tar, etc.). To upload archives, please select one of '${ProjectInputType.Sources}'' or '${ProjectInputType.Customizations}' from the dropdown and try again.`;
                console.error(err);
                return setUploadStatus(err);
            }
        } else if (newFilename.endsWith('.yaml') || newFilename.endsWith('.yml')) {
            if (inputType !== ProjectInputType.Configs) {
                const err = `The file '${newFilename}' seems to be a yaml file. To upload config files, please select '${ProjectInputType.Configs}' from the dropdown and try again.`;
                console.error(err);
                return setUploadStatus(err);
            }
        }
        if (Object.values(ctx.currentWorkspace.inputs || {}).some((x) => x.name === newFilename)) {
            const err = `You have already uploaded an input with the filename '${newFilename}'. Please pick a different one.`;
            console.error(err);
            return setUploadStatus(err);
        }
        const found = Object.values(ctx.projects).find((proj) =>
            Object.values(proj.inputs || {}).some((x) => x.name === newFilename),
        );
        if (found) {
            const err = `You have already uploaded an input with the filename '${newFilename}' for the project '${
                found.name || `id: ${found.id}`
            }'. Please pick a different one.`;
            console.error(err);
            return setUploadStatus(err);
        }
        setUploadStatus('');
        console.log('inside handleFileChange. filename:', newFilename);
        setIsRejected(false);
        const workInput: IWorkspaceInput = { id: '', timestamp: '', name: newFilename, type: inputType };
        await ctx.uploadWorkspaceFile(ctx.currentWorkspace.id, workInput, newFile, props.refresh);
    };

    const handleFileRejected = (fileRejections: Array<File>): void => {
        setIsRejected(true);
        console.error(`Some files failed to load. Rejected files: ${fileRejections.map((file) => file.name)}`);
        // setUploadStatus(`Some files failed to load. Rejected files: ${fileRejections.map((file) => file.name)}`);
    };

    const rows: Array<WorkspaceInputsRowT> = Object.values(ctx.currentWorkspace.inputs || {}).map((input) => ({
        cells: [
            {
                id: input.id,
                name: input.name || `id: <${input.id}>`,
                title: (
                    <a download href={readWorkspaceInputURL(ctx.currentWorkspace.id, input.id)}>
                        {input.name || `id: <${input.id}>`}
                    </a>
                ),
            },
            input.type,
        ],
    }));
    const t1: Array<WorkspaceInputsRowT> = Object.entries(ctx.workspaceFiles[ctx.currentWorkspace.id] || {})
        .filter(([_, v]) => v.status !== FileUploadStatus.DoneSuccess)
        .map(([k, v]) => ({
            cells: [
                {
                    id: k,
                    name: v.filename,
                    title: (
                        <>
                            {v.filename}
                            <Progress
                                key={k}
                                aria-label="progress-bar"
                                value={v.percent}
                                title={v.status + ' ' + v.statusMsg}
                                variant={
                                    v.percent === 100
                                        ? ProgressVariant.success
                                        : v.status === FileUploadStatus.DoneError
                                        ? ProgressVariant.danger
                                        : undefined
                                }
                                measureLocation={ProgressMeasureLocation.outside}
                            />
                        </>
                    ),
                },
                'uploading',
            ],
        }));
    rows.push(...t1);
    const actionsForDone: Array<IAction> = [
        {
            title: 'Delete',
            onClick: async (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length !== 2) return;
                const t1 = rowData as WorkspaceInputsRowT;
                setDeleteTarget({ id: t1.cells[0].id, name: t1.cells[0].name });
            },
        },
    ];
    const actionsForUploading: Array<IAction> = [
        {
            title: 'Cancel',
            onClick: async (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length !== 2) return;
                ctx.cancelWorkspaceUpload(ctx.currentWorkspace.id, (rowData as WorkspaceInputsRowT).cells[0].id);
                props.refresh();
            },
        },
    ];
    return (
        <Card>
            <CardTitle>Workspace inputs (shared between all projects in this workspace)</CardTitle>
            <CardBody className="workspace-page-inputs-section">
                {rows.length === 0 ? (
                    <Bullseye className="flex-direction-column">
                        <CubesIcon size="xl" />
                        <TextContent>Did not find any inputs for this workspace. Try creating some.</TextContent>
                    </Bullseye>
                ) : (
                    <Table
                        aria-label="Workspace inputs"
                        cells={['Filename', 'Type']}
                        rows={rows}
                        actionResolver={(rowData) =>
                            (rowData as WorkspaceInputsRowT).cells[1] === 'uploading'
                                ? actionsForUploading
                                : actionsForDone
                        }
                    >
                        <TableHeader />
                        <TableBody />
                    </Table>
                )}
                <TextContent>
                    <Title headingLevel="h3">Types of inputs:</Title>
                    Sources: An archive file (.zip, .tar, .tgz, etc.) containing a folder with source code files.
                    <br />
                    Customizations: An archive file containing a folder with customization files such as: custom
                    transformers, parameterizers, files with information collected about the cluster, etc.
                    <br />
                    Configs: YAML files used to configure Move2Kube.
                </TextContent>
                <Form isHorizontal>
                    <FormGroup isRequired label="Input type" fieldId="workspace-input-type">
                        <FormSelect
                            value={inputType}
                            onChange={(s) => setInputType(s as ProjectInputType)}
                            id="workspace-input-type"
                            name="workspace-input-type"
                            aria-label="Input type"
                        >
                            <FormSelectOption value={ProjectInputType.Sources} label="Source folder" />
                            <FormSelectOption value={ProjectInputType.Customizations} label="Customization folder" />
                            <FormSelectOption value={ProjectInputType.Configs} label="Config file" />
                        </FormSelect>
                    </FormGroup>
                    <FormGroup isRequired label="Input file" fieldId="file-upload">
                        <FileUpload
                            id="file-upload"
                            name="file"
                            onChange={handleFileChange}
                            dropzoneProps={{
                                accept: '.yaml,.yml,.zip,.tar,.tar.gz,.tgz',
                                onDropRejected: handleFileRejected,
                            }}
                            validated={isRejected ? 'error' : 'default'}
                        />
                        {uploadStatus && <Alert variant="danger" title={uploadStatus} />}
                    </FormGroup>
                </Form>
            </CardBody>
            <Modal
                aria-labelledby="delete-workspace-input-modal"
                variant="small"
                showClose={true}
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                actions={[
                    <Button
                        key="1"
                        variant="danger"
                        onClick={() => {
                            deleteWorkspaceInput(ctx.currentWorkspace.id, deleteTarget?.id || '')
                                .then(() => {
                                    setDeleteTarget(null);
                                    props.refresh();
                                })
                                .catch((e) => {
                                    setUploadStatus(`failed to delete workspace input. ${e}`);
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
                The following input will be deleted:
                <pre>{deleteTarget?.name}</pre>
                Proceed?
            </Modal>
        </Card>
    );
}

WorkspaceInputs.displayName = 'WorkspaceInputs';

export { WorkspaceInputs };
