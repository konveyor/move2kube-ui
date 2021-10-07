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
} from '@patternfly/react-core';
import React, { useContext, useState } from 'react';
import { ApplicationContext } from '@app/common/ApplicationContext';
import { deleteProjectInput, readProjectInputURL } from '@app/networking/api';
import { Table, TableHeader, TableBody, IAction, IRow } from '@patternfly/react-table';
import { FileUploadStatus, IProjectInput, SUPPORTED_ARCHIVE_FORMATS } from '@app/common/types';

type ProjectInputsRowT = {
    cells: [{ title: JSX.Element; id: string; name: string }, string];
    selected?: boolean;
};

interface IProjectInputsProps {
    refresh: () => void;
}

function ProjectInputs(props: IProjectInputsProps): JSX.Element {
    const ctx = useContext(ApplicationContext);
    const [isRejected, setIsRejected] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [inputType, setInputType] = useState('sources');
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
            if (inputType !== 'sources' && inputType !== 'customizations') {
                const err = `The file '${newFilename}' seems to be an archive (zip, tar, etc.). To upload archives, please select one of 'sources' or 'customizaions' from the dropdown and try again.`;
                console.error(err);
                return setUploadStatus(err);
            }
        } else if (newFilename.endsWith('.yaml') || newFilename.endsWith('.yml')) {
            if (inputType !== 'configs') {
                const err = `The file '${newFilename}' seems to be a yaml file. To upload config files, please select 'configs' from the dropdown and try again.`;
                console.error(err);
                return setUploadStatus(err);
            }
        }
        if (Object.values(ctx.currentProject.inputs || {}).some((x) => x.name === newFilename)) {
            const err = `You have already uploaded an input with the filename '${newFilename}'. Please pick a different one.`;
            console.error(err);
            return setUploadStatus(err);
        }
        setUploadStatus('');
        console.log('inside handleFileChange. filename:', newFilename);
        setIsRejected(false);
        const projInput: IProjectInput = { id: '', timestamp: '', name: newFilename, type: inputType };
        await ctx.uploadFile(ctx.currentWorkspace.id, ctx.currentProject.id, projInput, newFile, props.refresh);
    };

    const handleFileRejected = (fileRejections: Array<File>): void => {
        setIsRejected(true);
        console.error(`Some files failed to load. Rejected files: ${fileRejections.map((file) => file.name)}`);
        // setUploadStatus(`Some files failed to load. Rejected files: ${fileRejections.map((file) => file.name)}`);
    };

    const rows: Array<ProjectInputsRowT> = Object.values(ctx.currentProject.inputs || {}).map((input) => ({
        cells: [
            {
                id: input.id,
                name: input.name || `id: <${input.id}>`,
                title: (
                    <a download href={readProjectInputURL(ctx.currentWorkspace.id, ctx.currentProject.id, input.id)}>
                        {input.name || `id: <${input.id}>`}
                    </a>
                ),
            },
            input.type,
        ],
    }));
    const t1: Array<ProjectInputsRowT> = Object.entries(ctx.files[ctx.currentProject.id] || {})
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
                const t1 = rowData as ProjectInputsRowT;
                setDeleteTarget({ id: t1.cells[0].id, name: t1.cells[0].name });
            },
        },
    ];
    const actionsForUploading: Array<IAction> = [
        {
            title: 'Cancel',
            onClick: async (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length !== 2) return;
                ctx.cancelUpload(ctx.currentProject.id, (rowData as ProjectInputsRowT).cells[0].id);
                props.refresh();
            },
        },
    ];
    return (
        <Card>
            <CardTitle>Inputs</CardTitle>
            <CardBody className="project-page-inputs-section">
                <Table
                    aria-label="Project inputs"
                    cells={['Filename', 'Type']}
                    rows={rows}
                    actionResolver={(rowData) =>
                        (rowData as ProjectInputsRowT).cells[1] === 'uploading' ? actionsForUploading : actionsForDone
                    }
                >
                    <TableHeader />
                    <TableBody />
                </Table>
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
                    <FormGroup isRequired label="Project input type" fieldId="project-input-type">
                        <FormSelect
                            value={inputType}
                            onChange={setInputType}
                            id="project-input-type"
                            name="project-input-type"
                            aria-label="Project input type"
                        >
                            <FormSelectOption value="sources" label="Source folder" />
                            <FormSelectOption value="customizations" label="Customization folder" />
                            <FormSelectOption value="configs" label="Config file" />
                        </FormSelect>
                    </FormGroup>
                    <FormGroup isRequired label="Project input file" fieldId="file-upload">
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
                variant="small"
                showClose={true}
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                actions={[
                    <Button
                        key="1"
                        variant="danger"
                        onClick={() => {
                            deleteProjectInput(ctx.currentWorkspace.id, ctx.currentProject.id, deleteTarget?.id || '');
                            setDeleteTarget(null);
                            props.refresh();
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

export { ProjectInputs };
