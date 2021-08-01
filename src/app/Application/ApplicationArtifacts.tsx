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
    PageSection,
    Card,
    Gallery,
    Modal,
    ModalVariant,
    CardBody,
    TextContent,
    Text,
    TextVariants,
    Button,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    CardHeader,
    CardActions,
} from '@patternfly/react-core';
import { ApplicationContext } from './ApplicationContext';
import { QAWizard } from '../QA/QAWizard';
import { CloseIcon } from '@patternfly/react-icons';

interface IArtifactsTabState {
    qaartifacts: string;
    artifacts: Array<string>;
}

class ArtifactsTab extends React.Component<Readonly<unknown>, IArtifactsTabState> {
    declare context: React.ContextType<typeof ApplicationContext>;
    static contextType = ApplicationContext;

    constructor(props: Readonly<unknown>) {
        super(props);
        this.generate = this.generate.bind(this);
        this.close = this.close.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.get = this.get.bind(this);

        this.state = {
            qaartifacts: '',
            artifacts: [],
        };
    }

    generate(): void {
        if (this.context.aStatus.includes('plan')) {
            return this.setState({ qaartifacts: 'new' });
        }
        alert('Generate plan before starting artifact generation.');
    }

    close(): void {
        this.setState({ qaartifacts: '' });
    }

    async update(): Promise<void> {
        try {
            const res = await fetch(
                '/api/v1/applications/' + encodeURIComponent(this.context.aName) + '/targetartifacts',
                { headers: { Accept: 'application/json' } },
            );
            if (!res.ok)
                throw new Error(
                    `Failed to get the target artifacts for the app ${this.context.aName}. Status: ${res.status}`,
                );
            const artifacts = await res.json();
            artifacts.sort((a: string, b: string) => (parseInt(a.split('_')[1]) > parseInt(b.split('_')[1]) ? -1 : 1));
            this.setState({ artifacts });
        } catch (e) {
            console.error(e);
        }
        this.context.updateApp();
    }

    async delete(artifact: string): Promise<void> {
        try {
            const res = await fetch(
                '/api/v1/applications/' +
                    encodeURIComponent(this.context.aName) +
                    '/targetartifacts/' +
                    encodeURIComponent(artifact),
                { method: 'DELETE', headers: { Accept: 'application/json' } },
            );
            if (!res.ok) {
                alert('Error while trying to delete the artifact.');
                throw new Error(
                    `Failed to delete the artifact ${artifact} of the app ${this.context.aName}. Status: ${res.status}`,
                );
            }
            this.update();
        } catch (e) {
            console.error(e);
        }
    }

    async get(qaartifacts: string): Promise<void> {
        try {
            const url =
                '/api/v1/applications/' +
                encodeURIComponent(this.context.aName) +
                '/targetartifacts/' +
                encodeURIComponent(qaartifacts);
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (res.status > 300) {
                alert('There was an error during transformation. Please regenerate.');
                throw new Error(
                    `Failed to get the target artifacts ${qaartifacts} for the app ${this.context.aName}. Status: ${res.status}`,
                );
            } else if (res.status == 204) {
                this.setState({ qaartifacts });
            } else {
                const filename = res.headers
                    .get('content-disposition')
                    ?.split(';')
                    ?.find((n) => n.includes('filename='))
                    ?.replace('filename=', '')
                    .trim();
                if (filename === undefined) {
                    throw new Error('The filename is empty.');
                }
                const blob = await res.blob();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.setAttribute('download', filename);
                a.click();
            }
        } catch (e) {
            console.error(e);
        }
    }

    componentDidMount(): void {
        this.update();
    }

    render(): JSX.Element {
        const { artifacts, qaartifacts } = this.state;
        const { aName, aPlan } = this.context;
        const artifactNameToDate = (artifact: string): string => {
            const unixSeconds = parseInt(artifact.split('-')[1]);
            return new Date(unixSeconds * 1000).toString(); // seconds to milliseconds
        };

        return (
            <>
                <PageSection>
                    <Toolbar>
                        <ToolbarContent>
                            <ToolbarItem>
                                <Button variant="primary" onClick={this.generate}>
                                    Transform
                                </Button>
                            </ToolbarItem>
                        </ToolbarContent>
                    </Toolbar>
                </PageSection>
                <Modal
                    isOpen={qaartifacts !== ''}
                    variant={ModalVariant.large}
                    showClose={true}
                    onClose={this.close}
                    aria-describedby="QADialog"
                    aria-labelledby="QADialog"
                >
                    <QAWizard
                        aName={aName}
                        aArtifactsName={qaartifacts}
                        aPlan={aPlan}
                        close={this.close}
                        update={this.update}
                        disabled={false}
                    />
                </Modal>
                <Gallery hasGutter>
                    {artifacts.map((artifact) => (
                        <PageSection key={artifact}>
                            <Card isHoverable key={artifact}>
                                <CardHeader>
                                    <CardActions>
                                        <CloseIcon onClick={() => this.delete(artifact)} />
                                    </CardActions>
                                </CardHeader>
                                <CardBody>
                                    <TextContent style={{ textAlign: 'center' }}>
                                        <Text
                                            component={TextVariants.h3}
                                            style={{ textAlign: 'center', wordWrap: 'break-word' }}
                                        >
                                            {artifactNameToDate(artifact)}
                                        </Text>
                                        <Button variant="secondary" onClick={() => this.get(artifact)}>
                                            Get
                                        </Button>
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

export { ArtifactsTab };
