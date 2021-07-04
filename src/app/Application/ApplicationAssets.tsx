/*
Copyright IBM Corporation 2020

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
import {
    FileUpload,
    Form,
    FormGroup,
    PageSection,
    ToolbarItem,
    Button,
    Modal,
    ModalVariant,
    Gallery,
    Card,
    CardBody,
    CardActions,
    Text,
    TextContent,
    TextVariants,
    CardHeader,
    ToolbarContent,
    Toolbar,
} from '@patternfly/react-core';
import { ApplicationContext } from './ApplicationContext';
import { CloseIcon } from '@patternfly/react-icons';
import { Progress, ProgressMeasureLocation, ProgressVariant } from '@patternfly/react-core';

interface IApplicationAssetUploadProps {
    update?: () => void;
    onNext?: () => void;
}

interface IApplicationAssetUploadState {
    file: File | null;
    filename: string;
    isLoading: boolean;
    isRejected: boolean;
    uploadStatus: string;
    uploadPercent: number;
}

class ApplicationAssetUpload extends React.Component<IApplicationAssetUploadProps, IApplicationAssetUploadState> {
    declare context: React.ContextType<typeof ApplicationContext>;
    static contextType = ApplicationContext;
    updateTimerID = 0;

    constructor(props: IApplicationAssetUploadProps) {
        super(props);
        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleFileRejected = this.handleFileRejected.bind(this);
        this.uploadFile = this.uploadFile.bind(this);

        this.state = {
            file: null,
            filename: '',
            isLoading: false,
            isRejected: false,
            uploadStatus: '',
            uploadPercent: 0,
        };
    }

    handleFileChange(value: string | File, filename: string): void {
        if (typeof value === 'string') return alert('Invalid file type. Expected a binary file. Got a text file.');
        this.setState({ file: value, filename, isRejected: false });
    }

    handleFileRejected(fileRejections: Array<File>): void {
        return alert(`Some files failed to load. Rejected files: ${fileRejections.map((file) => file.name)}`);
    }

    uploadFile(aName: string): Promise<void> {
        if (!this.state.file) {
            const err = 'The file is null. Please upload a valid file.';
            console.error(err);
            throw new Error(err);
        }
        const file: File = this.state.file;
        const url = '/api/v1/applications/' + encodeURIComponent(aName) + '/assets';
        const formdata = new FormData();
        formdata.append('file', file);
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (event) => {
            console.log(`Uploaded ${event.loaded} bytes out of ${event.total}`);
            const uploadPercent = Math.round((event.loaded / event.total) * 100);
            this.setState({ uploadPercent, uploadStatus: '' });
        });
        return new Promise((resolve, reject) => {
            xhr.addEventListener('abort', () => {
                const err = `File upload aborted. Status: ${xhr.status}`;
                console.error(err);
                this.setState({ uploadPercent: 0, uploadStatus: err });
                alert(err);
                reject(err);
            });
            xhr.addEventListener('error', () => {
                const err = `Failed to upload the file. Status: ${xhr.status}`;
                console.error(err);
                this.setState({ uploadPercent: 0, uploadStatus: err });
                alert(
                    `Failed to upload the file ${file.name} for the app ${aName}. Supported file formats are .zip/.tar/.tar.gz/.tgz.
If the file size is huge, try removing large files, which are not needed.
If network is the problem, you can use the command line tool to accomplish the translation. Check out https://move2kube.konveyor.io/installation/cli/`,
                );
                reject(err);
            });
            xhr.addEventListener('load', () => {
                console.log(`File upload complete. Status: ${xhr.status}`);
                this.setState({ uploadPercent: 100, uploadStatus: 'File upload complete.' });
                if (this.props.update) setTimeout(this.props.update, 10);
                resolve();
            });
            xhr.open('POST', url);
            xhr.send(formdata);
        });
    }

    componentDidMount(): void {
        if (this.props.update) this.updateTimerID = window.setInterval(this.props.update, 30000);
    }

    componentDidUpdate(): void {
        if (this.updateTimerID) clearInterval(this.updateTimerID);
        if (this.props.update) this.updateTimerID = window.setInterval(this.props.update, 30000);
    }

    componentWillUnmount(): void {
        if (this.updateTimerID) clearInterval(this.updateTimerID);
    }

    render(): JSX.Element {
        const { file: value, filename, isLoading, isRejected, uploadPercent, uploadStatus } = this.state;
        const { aName } = this.context;

        return (
            <Form
                onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    await this.uploadFile(aName);
                    if (this.props.onNext) this.props.onNext();
                }}
            >
                <FormGroup
                    fieldId="zip-file-upload"
                    helperText="Upload a zip file"
                    helperTextInvalid="Must be a ZIP file"
                    validated={isRejected ? 'error' : 'default'}
                >
                    <FileUpload
                        id="zip-file-upload"
                        value={value || undefined}
                        filename={filename}
                        onChange={this.handleFileChange}
                        isLoading={isLoading}
                        dropzoneProps={{
                            accept: '.zip,.tar,.tar.gz,.tgz',
                            onDropRejected: this.handleFileRejected,
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
                <Button variant="secondary" type="submit">
                    Upload Asset
                </Button>
            </Form>
        );
    }
}

interface IAssetsTabState {
    isUploadAssetModalOpen: boolean;
    isCollectModalOpen: boolean;
    assets: Array<string>;
}

class AssetsTab extends React.Component<Readonly<unknown>, IAssetsTabState> {
    declare context: React.ContextType<typeof ApplicationContext>;
    static contextType = ApplicationContext;

    constructor(props: Readonly<unknown>) {
        super(props);
        this.update = this.update.bind(this);
        this.openAssetUploadModal = this.openAssetUploadModal.bind(this);
        this.closeAssetUploadModal = this.closeAssetUploadModal.bind(this);
        this.openCollectModal = this.openCollectModal.bind(this);
        this.closeCollectModal = this.closeCollectModal.bind(this);
        this.delete = this.delete.bind(this);

        this.state = {
            isUploadAssetModalOpen: false,
            isCollectModalOpen: false,
            assets: [],
        };
    }

    async update(): Promise<void> {
        try {
            const res = await fetch('/api/v1/applications/' + encodeURIComponent(this.context.aName) + '/assets', {
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error(`Failed to get the assets for ${this.context.aName}. Status: ${res.status}`);
            const assets = await res.json();
            this.setState({ assets }, this.context.updateApp);
        } catch (e) {
            console.error(e);
        }
    }

    openAssetUploadModal(): void {
        this.setState({ isUploadAssetModalOpen: true });
    }

    closeAssetUploadModal(): void {
        this.setState({ isUploadAssetModalOpen: false });
    }

    openCollectModal(): void {
        this.setState({ isCollectModalOpen: true });
    }

    closeCollectModal(): void {
        this.setState({ isCollectModalOpen: false });
    }

    async delete(asset: string): Promise<void> {
        try {
            const url =
                '/api/v1/applications/' +
                encodeURIComponent(this.context.aName) +
                '/assets/' +
                encodeURIComponent(asset);
            const res = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
            if (res.status > 300) {
                alert('Error while trying to delete asset.');
                throw new Error(`Failed to delete the asset ${asset} of ${this.context.aName}. Status: ${res.status}`);
            }
            this.update();
        } catch (e) {
            console.error(e);
        }
    }

    componentDidMount(): void {
        this.update();
    }

    render(): JSX.Element {
        const { isCollectModalOpen, isUploadAssetModalOpen, assets } = this.state;
        const { aName } = this.context;

        return (
            <>
                <PageSection>
                    <Toolbar>
                        <ToolbarContent>
                            <ToolbarItem>
                                <Button variant="primary" onClick={this.openAssetUploadModal}>
                                    Upload Asset
                                </Button>
                                <Modal
                                    isOpen={isUploadAssetModalOpen}
                                    variant={ModalVariant.small}
                                    showClose={true}
                                    onClose={this.closeAssetUploadModal}
                                    aria-describedby="wiz-modal-example-description"
                                    aria-labelledby="wiz-modal-example-title"
                                >
                                    <ApplicationAssetUpload update={this.update}></ApplicationAssetUpload>
                                </Modal>
                            </ToolbarItem>
                            <ToolbarItem>
                                <Button variant="primary" onClick={this.openCollectModal}>
                                    Collect Source/Target Artifacts
                                </Button>
                                <Modal
                                    isOpen={isCollectModalOpen}
                                    variant={ModalVariant.small}
                                    showClose={true}
                                    onClose={this.closeCollectModal}
                                    aria-describedby="wiz-modal-example-description"
                                    aria-labelledby="wiz-modal-example-title"
                                >
                                    <TextContent>
                                        <Text component={TextVariants.h1} style={{ textAlign: 'center' }}>
                                            For collecting data, download the{' '}
                                            <a
                                                href="https://move2kube.konveyor.io/installation/cli/"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                move2kube command line tool
                                            </a>{' '}
                                            and run &apos;move2kube collect&apos;, and zip the results and upload here.
                                        </Text>
                                    </TextContent>
                                </Modal>
                            </ToolbarItem>
                        </ToolbarContent>
                    </Toolbar>
                </PageSection>
                <Gallery hasGutter>
                    {assets.map((asset) => (
                        <PageSection key={asset}>
                            <Card isHoverable key={asset}>
                                <CardHeader>
                                    <CardActions>
                                        <CloseIcon onClick={() => this.delete(asset)} />
                                    </CardActions>
                                </CardHeader>
                                <CardBody>
                                    <TextContent>
                                        <Text component={TextVariants.h1} style={{ textAlign: 'center' }}>
                                            {asset}
                                        </Text>
                                        <a
                                            href={'/api/v1/applications/' + aName + '/assets/' + asset}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {' '}
                                            <Text component={TextVariants.h3} style={{ textAlign: 'center' }}>
                                                Download
                                            </Text>
                                        </a>
                                    </TextContent>
                                </CardBody>
                            </Card>
                        </PageSection>
                    ))}
                </Gallery>
            </>
        );
    }
}

export { AssetsTab, ApplicationAssetUpload };
