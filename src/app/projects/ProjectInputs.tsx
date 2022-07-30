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
    IProjectInput,
    FileUploadStatus,
    ProjectInputType,
    SUPPORTED_ARCHIVE_FORMATS,
} from '../common/types';
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
import { ApplicationContext } from '../common/ApplicationContext';
import {
    createProjectInputReference,
    deleteProjectInput,
    readProjectInputURL,
    readWorkspaceInputURL,
} from '../networking/api';
import { CubesIcon } from '@patternfly/react-icons';
import { Table, TableHeader, TableBody, IAction, IRow } from '@patternfly/react-table';

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
    const [selectedWorkspaceInput, setSelectedWorkspaceInput] = useState('');
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
                const err = `The file '${newFilename}' seems to be an archive (zip, tar, etc.). To upload archives, please select one of 'sources' or 'customizaions' from the dropdown and try again.`;
                console.error(err);
                return setUploadStatus(err);
            }
        } else if (newFilename.endsWith('.yaml') || newFilename.endsWith('.yml')) {
            if (inputType !== ProjectInputType.Configs) {
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
        if (Object.values(ctx.currentWorkspace.inputs || {}).some((x) => x.name === newFilename)) {
            const err = `You have already uploaded a workspace input with the filename '${newFilename}'. Please pick a different one.`;
            console.error(err);
            return setUploadStatus(err);
        }
        setUploadStatus('');
        console.log('inside handleFileChange. filename:', newFilename);
        setIsRejected(false);
        const projInput: IProjectInput = { id: '', timestamp: '', name: newFilename, type: inputType };
        await ctx.uploadFile(ctx.currentWorkspace.id, ctx.currentProject.id, projInput, newFile, props.refresh);
    };

    const handleWorkspaceInputSelect = async (workInputId: string): Promise<void> => {
        if (Object.values(ctx.currentProject.inputs || {}).some((x) => x.id === workInputId)) {
            const err = `You have already referred this input. Please pick a different one.`;
            console.error(err);
            return setUploadStatus(err);
        }
        const workInput: IProjectInput = { id: workInputId, timestamp: '', type: inputType };
        await createProjectInputReference(ctx.currentWorkspace.id, ctx.currentProject.id, workInput);
        console.log('inside handleWorkspaceInputSelect. workInputId:', workInputId);
        props.refresh();
    };

    const handleFileRejected = (fileRejections: Array<File>): void => {
        setIsRejected(true);
        console.error(`Some files failed to load. Rejected files: ${fileRejections.map((file) => file.name)}`);
        // setUploadStatus(`Some files failed to load. Rejected files: ${fileRejections.map((file) => file.name)}`);
    };

    const rows: Array<ProjectInputsRowT> = Object.values(ctx.currentProject.inputs || {}).map((input) => {
        let downloadURL = readProjectInputURL(ctx.currentWorkspace.id, ctx.currentProject.id, input.id);
        let inputName = input.name || `id: <${input.id}>`;
        let inputType: string = input.type;
        if (input.type === ProjectInputType.Reference) {
            downloadURL = readWorkspaceInputURL(ctx.currentWorkspace.id, input.id);
            const actualInput = ctx.currentWorkspace.inputs?.[input.id] as IProjectInput;
            inputName = actualInput.name || `id: <${actualInput.id}>`;
            inputType = `${inputType} - ${actualInput.type}`;
        }
        return {
            cells: [
                {
                    id: input.id,
                    name: inputName,
                    title: (
                        <a download href={downloadURL}>
                            {inputName}
                        </a>
                    ),
                },
                inputType,
            ],
        };
    });
    const inProgressInputs: Array<ProjectInputsRowT> = Object.entries(ctx.files[ctx.currentProject.id] || {})
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
    rows.push(...inProgressInputs);
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
            <CardTitle>Project inputs</CardTitle>
            <CardBody className="project-page-inputs-section">
                {rows.length === 0 ? (
                    <Bullseye className="flex-direction-column">
                        <CubesIcon size="xl" />
                        <TextContent>Did not find any inputs for this project. Try creating some.</TextContent>
                    </Bullseye>
                ) : (
                    <Table
                        aria-label="Project inputs"
                        cells={['Filename', 'Type']}
                        rows={rows}
                        actionResolver={(rowData) =>
                            (rowData as ProjectInputsRowT).cells[1] === 'uploading'
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
                    <br />
                    Reference: Refer an input at the workspace level. Workspace level inputs are shared between all the
                    projects in that workspace.
                </TextContent>
                <Form isHorizontal>
                    <FormGroup isRequired label="Project input type" fieldId="project-input-type">
                        <FormSelect
                            value={inputType}
                            onChange={(s) => setInputType(s as ProjectInputType)}
                            id="project-input-type"
                            name="project-input-type"
                            aria-label="Project input type"
                        >
                            <FormSelectOption value={ProjectInputType.Sources} label="Source folder" />
                            <FormSelectOption value={ProjectInputType.Customizations} label="Customization folder" />
                            <FormSelectOption value={ProjectInputType.Configs} label="Config file" />
                            <FormSelectOption value={ProjectInputType.Reference} label="Reference a workspace input" />
                        </FormSelect>
                    </FormGroup>
                    {inputType !== ProjectInputType.Reference && (
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
                    )}
                    {inputType === ProjectInputType.Reference &&
                        (ctx.currentWorkspace.inputs ? (
                            <FormGroup isRequired label="Workspace input" fieldId="refer-workspace-input">
                                <FormSelect
                                    value={selectedWorkspaceInput}
                                    onChange={(inpId) => {
                                        setSelectedWorkspaceInput(inpId);
                                        if (inpId === '') return;
                                        handleWorkspaceInputSelect(inpId);
                                    }}
                                    id="refer-workspace-input"
                                    name="refer-workspace-input"
                                    aria-label="Workspace input"
                                >
                                    <FormSelectOption value="" label="" />
                                    {Object.values(ctx.currentWorkspace.inputs).map((inp) => (
                                        <FormSelectOption
                                            key={inp.id}
                                            value={inp.id}
                                            label={inp.name || `id: ${inp.id}`}
                                        />
                                    ))}
                                </FormSelect>
                            </FormGroup>
                        ) : (
                            <Alert variant="warning" title="There are no workspace level inputs" />
                        ))}
                </Form>
            </CardBody>
            <Modal
                aria-labelledby="delete-project-input-modal"
                variant="small"
                showClose={true}
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                actions={[
                    <Button
                        key="1"
                        variant="danger"
                        onClick={() => {
                            deleteProjectInput(ctx.currentWorkspace.id, ctx.currentProject.id, deleteTarget?.id || '')
                                .then(() => {
                                    setDeleteTarget(null);
                                    props.refresh();
                                })
                                .catch((e) => {
                                    setUploadStatus(`failed to delete project input. ${e}`);
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

ProjectInputs.displayName = 'ProjectInputs';

export { ProjectInputs, ProjectInputsRowT };
