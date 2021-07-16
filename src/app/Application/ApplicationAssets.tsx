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
import { Tooltip } from '@patternfly/react-core';

interface IApplicationAssetUploadProps {
    isCustomization: boolean;
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
        const url =
            '/api/v1/applications/' +
            encodeURIComponent(aName) +
            (this.props.isCustomization ? '/customizations' : '/assets');
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
If network is the problem, you can use the command line tool to accomplish the transformation. Check out https://move2kube.konveyor.io/installation/cli/`,
                );
                if (xhr.status === 403) {
                    this.context.goToRoute('/login', 'unauthorized');
                }
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
        const { isCustomization } = this.props;
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
                    Upload {isCustomization ? 'Customization' : 'Asset'}
                </Button>
            </Form>
        );
    }
}

interface IAssetsTabState {
    isUploadAssetModalOpen: boolean;
    isUploadCustomizationModalOpen: boolean;
    assets: Array<string>;
    customizations: Array<string>;
}

class AssetsTab extends React.Component<Readonly<unknown>, IAssetsTabState> {
    declare context: React.ContextType<typeof ApplicationContext>;
    static contextType = ApplicationContext;

    constructor(props: Readonly<unknown>) {
        super(props);
        this.update = this.update.bind(this);
        this.toggleAssetUploadModal = this.toggleAssetUploadModal.bind(this);
        this.toggleCustomizationUploadModal = this.toggleCustomizationUploadModal.bind(this);
        this.delete = this.delete.bind(this);
        this.deleteCustomization = this.deleteCustomization.bind(this);

        this.state = {
            isUploadAssetModalOpen: false,
            isUploadCustomizationModalOpen: false,
            assets: [],
            customizations: [],
        };
    }

    async update(): Promise<void> {
        try {
            // assets
            const aName = this.context.aName;
            const res1 = await fetch('/api/v1/applications/' + encodeURIComponent(aName) + '/assets', {
                headers: { Accept: 'application/json' },
            });
            if (!res1.ok) throw new Error(`Failed to get the assets for ${aName}. Status: ${res1.status}`);
            const assets = await res1.json();
            this.setState({ assets }, this.context.updateApp);
            // customizations
            const res2 = await fetch('/api/v1/applications/' + encodeURIComponent(aName) + '/customizations', {
                headers: { Accept: 'application/json' },
            });
            if (!res2.ok) throw new Error(`Failed to get the customizations for ${aName}. Status: ${res2.status}`);
            const customizations = await res2.json();
            this.setState({ customizations }, this.context.updateApp);
        } catch (e) {
            console.error(e);
        }
    }

    toggleAssetUploadModal(open: boolean): void {
        this.setState({ isUploadAssetModalOpen: open });
    }

    toggleCustomizationUploadModal(open: boolean): void {
        this.setState({ isUploadCustomizationModalOpen: open });
    }

    async delete(asset: string): Promise<void> {
        try {
            const url =
                '/api/v1/applications/' +
                encodeURIComponent(this.context.aName) +
                '/assets/' +
                encodeURIComponent(asset);
            const res = await fetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } });
            if (!res.ok) {
                const err = `Failed to delete the asset ${asset} of ${this.context.aName}. Status: ${res.status}`;
                alert(err);
                throw new Error(err);
            }
            this.update();
        } catch (e) {
            console.error(e);
        }
    }

    async deleteCustomization(customization: string): Promise<void> {
        try {
            const url =
                '/api/v1/applications/' +
                encodeURIComponent(this.context.aName) +
                '/customizations/' +
                encodeURIComponent(customization);
            const res = await fetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } });
            if (!res.ok) {
                const err = `Failed to delete the customization ${customization} of ${this.context.aName}. Status: ${res.status}`;
                alert(err);
                throw new Error(err);
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
        const { isUploadAssetModalOpen, isUploadCustomizationModalOpen, assets, customizations } = this.state;
        const { aName } = this.context;

        return (
            <div className="assets-wrapper">
                <PageSection>
                    <Toolbar>
                        <ToolbarContent>
                            <ToolbarItem>
                                <Button variant="primary" onClick={() => this.toggleAssetUploadModal(true)}>
                                    Upload Asset
                                </Button>
                                <Modal
                                    isOpen={isUploadAssetModalOpen}
                                    variant={ModalVariant.small}
                                    showClose={true}
                                    onClose={() => this.toggleAssetUploadModal(false)}
                                    aria-describedby="wiz-modal-example-description"
                                    aria-labelledby="wiz-modal-example-title"
                                >
                                    <ApplicationAssetUpload
                                        isCustomization={false}
                                        update={this.update}
                                    ></ApplicationAssetUpload>
                                </Modal>
                            </ToolbarItem>
                        </ToolbarContent>
                    </Toolbar>
                    <Gallery hasGutter>
                        {assets.map((asset) => (
                            <PageSection key={asset}>
                                <Card isHoverable>
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
                                                href={
                                                    '/api/v1/applications/' +
                                                    encodeURIComponent(aName) +
                                                    '/assets/' +
                                                    encodeURIComponent(asset)
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
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
                </PageSection>
                <PageSection>
                    <Toolbar>
                        <ToolbarContent>
                            <ToolbarItem>
                                <Button variant="primary" onClick={() => this.toggleCustomizationUploadModal(true)}>
                                    Upload Customization
                                </Button>
                                <Modal
                                    isOpen={isUploadCustomizationModalOpen}
                                    variant={ModalVariant.small}
                                    showClose={true}
                                    onClose={() => this.toggleCustomizationUploadModal(false)}
                                    aria-describedby="wiz-modal-example-description"
                                    aria-labelledby="wiz-modal-example-title"
                                >
                                    <ApplicationAssetUpload
                                        isCustomization={true}
                                        update={this.update}
                                    ></ApplicationAssetUpload>
                                </Modal>
                            </ToolbarItem>
                            <ToolbarItem>
                                <Tooltip
                                    exitDelay={500}
                                    content={
                                        <div>
                                            For collecting data, download the
                                            <a
                                                href="https://move2kube.konveyor.io/installation/cli/"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                move2kube command line tool
                                            </a>
                                            and run &apos;move2kube collect&apos;, and zip the results and upload here.
                                        </div>
                                    }
                                >
                                    <span style={{ border: '1px dashed' }}>Collect Source/Target Artifacts</span>
                                </Tooltip>
                            </ToolbarItem>
                        </ToolbarContent>
                    </Toolbar>
                    <Gallery hasGutter>
                        {customizations.map((customization) => (
                            <PageSection key={customization}>
                                <Card isHoverable>
                                    <CardHeader>
                                        <CardActions>
                                            <CloseIcon onClick={() => this.deleteCustomization(customization)} />
                                        </CardActions>
                                    </CardHeader>
                                    <CardBody>
                                        <TextContent>
                                            <Text component={TextVariants.h1} style={{ textAlign: 'center' }}>
                                                {customization}
                                            </Text>
                                            <a
                                                href={
                                                    '/api/v1/applications/' +
                                                    encodeURIComponent(aName) +
                                                    '/customizations/' +
                                                    encodeURIComponent(customization)
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
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
                </PageSection>
            </div>
        );
    }
}

export { AssetsTab, ApplicationAssetUpload };
