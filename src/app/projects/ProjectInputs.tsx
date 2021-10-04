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
import { Table, TableHeader, TableBody, IAction, IRow } from '@patternfly/react-table';
import { IProjectInput, SUPPORTED_ARCHIVE_FORMATS, XHRListener } from '@app/common/types';
import { createProjectInput, deleteProjectInput, readProjectInputURL } from '@app/networking/api';

type ProjectInputsRowT = {
    cells: [{ title: JSX.Element; id: string }, string];
    selected?: boolean;
};

interface IProjectInputsProps {
    refresh: () => void;
}

function ProjectInputs(props: IProjectInputsProps): JSX.Element {
    const ctx = useContext(ApplicationContext);
    const [isLoading, setIsLoading] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
    const [inputType, setInputType] = useState('sources');
    const [file, setFile] = useState<File | string>('');
    const [filename, setFilename] = useState('');

    const handleFileChange = async (newFile: string | File, newFilename: string): Promise<void> => {
        if (!newFile) return console.log('Invalid file type. Actual:', typeof newFile, newFile);
        if (typeof newFile === 'string') {
            // TODO: in what situations can this happen?
            console.log('string type newFile', newFile);
            if (inputType !== 'configs') {
                return setUploadStatus(
                    "To upload a config file, first change the input type to 'configs' in the dropdown and then select the file you want to upload.",
                );
            }
        }
        if (SUPPORTED_ARCHIVE_FORMATS.some((ext) => newFilename.endsWith(ext))) {
            if (inputType !== 'sources' && inputType !== 'customizations') {
                setUploadPercent(0);
                return setUploadStatus(
                    `The file '${newFilename}' seems to be an archive (zip, tar, etc.). To upload archives, please select one of 'sources' or 'customizaions' from the dropdown and try again.`,
                );
            }
        } else if (newFilename.endsWith('.yaml') || newFilename.endsWith('.yml')) {
            if (inputType !== 'configs') {
                setUploadPercent(0);
                return setUploadStatus(
                    `The file '${newFilename}' seems to be a yaml file. To upload config files, please select 'configs' from the dropdown and try again.`,
                );
            }
        } else {
            console.log('inside handleFileChange. filename:', newFilename);
        }
        setIsRejected(false);
        setIsLoading(true);
        setFile(newFile);
        setFilename(newFilename);

        const progressListener = (event: ProgressEvent<XMLHttpRequestEventTarget>) => {
            console.log(`Uploaded ${event.loaded} bytes out of ${event.total}`);
            const newUploadPercent = Math.round((event.loaded / event.total) * 100);
            setUploadPercent(newUploadPercent);
            setUploadStatus('');
        };

        const abortListener: XHRListener = (_, reject, xhr) => {
            const err = `File upload aborted. Status: ${xhr.status}`;
            setUploadPercent(0);
            setUploadStatus(err);
            console.error(err);
            reject(err);
        };

        const errorListener: XHRListener = (_, reject, xhr) => {
            const err = `Failed to upload the file ${newFilename} for the project ${ctx.currentProject.id}. Status: ${xhr.status}
Supported file formats are ${SUPPORTED_ARCHIVE_FORMATS} .
If the file size is huge, try removing large files, which are not needed.
If network is the problem, you can use the command line tool to accomplish the transformation. Check out https://move2kube.konveyor.io/installation/cli/`;
            setUploadPercent(0);
            setUploadStatus(err);
            console.error(err);
            reject(err);
        };

        const loadListener: XHRListener = (resolve, reject, xhr) => {
            setIsLoading(false);
            if (xhr.status < 200 || xhr.status > 299) {
                let reason = 'Please check the input type and try again.';
                if (xhr.response && typeof xhr.response === 'object') {
                    reason = 'Error: ' + xhr.response.error.description;
                }
                const err = `failed to upload the file. Status: ${xhr.status} . ${reason}`;
                setUploadPercent(0);
                setUploadStatus(err);
                console.error(err);
                return reject(err);
            }
            console.log(`File upload complete. Status: ${xhr.status}`);
            setUploadPercent(100);
            setUploadStatus('File upload complete.');
            props.refresh();
            resolve(xhr.response);
        };

        const projInput: IProjectInput = { id: '', timestamp: '', name: filename, type: inputType };
        await createProjectInput(
            ctx.currentWorkspace.id,
            ctx.currentProject.id,
            projInput,
            newFile,
            progressListener,
            abortListener,
            errorListener,
            loadListener,
        );
    };

    const handleFileRejected = (fileRejections: Array<File>): void => {
        setIsRejected(true);
        setUploadStatus(`Some files failed to load. Rejected files: ${fileRejections.map((file) => file.name)}`);
    };

    const rows: Array<ProjectInputsRowT> = Object.values(ctx.currentProject.inputs || {}).map((input) => ({
        cells: [
            {
                title: (
                    <a download href={readProjectInputURL(ctx.currentWorkspace.id, ctx.currentProject.id, input.id)}>
                        {input.name || `id: <${input.id}>`}
                    </a>
                ),
                id: input.id,
            },
            input.type,
        ],
    }));
    const actions: Array<IAction> = [
        {
            title: 'Delete',
            /*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
            onClick: async (_: React.MouseEvent, __: number, rowData: IRow) => {
                if (!rowData || !rowData.cells || rowData.cells.length === 0) return;
                await deleteProjectInput(
                    ctx.currentWorkspace.id,
                    ctx.currentProject.id,
                    (rowData as ProjectInputsRowT).cells[0].id,
                );
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
                    actionResolver={() => actions}
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
                            name="file-upload"
                            value={file}
                            filename={filename}
                            isLoading={isLoading}
                            onChange={handleFileChange}
                            dropzoneProps={{
                                accept: '.yaml,.yml,.zip,.tar,.tar.gz,.tgz',
                                onDropRejected: handleFileRejected,
                            }}
                            validated={isRejected ? 'error' : 'default'}
                        />
                        <Progress
                            aria-label="progress-bar"
                            value={uploadPercent}
                            title={uploadStatus}
                            variant={
                                uploadPercent === 100
                                    ? ProgressVariant.success
                                    : uploadStatus
                                    ? ProgressVariant.danger
                                    : undefined
                            }
                            measureLocation={ProgressMeasureLocation.outside}
                        />
                    </FormGroup>
                </Form>
            </CardBody>
        </Card>
    );
}

export { ProjectInputs };
