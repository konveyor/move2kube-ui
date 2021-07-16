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

import * as React from 'react';
import { CubesIcon } from '@patternfly/react-icons';
import {
    PageSection,
    Title,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    EmptyStateBody,
} from '@patternfly/react-core';
import { Table, TableBody } from '@patternfly/react-table';
import { getSupportInfo } from '@app/Networking/api';
import { ISupportInfo } from '@app/Networking/types';

export interface ISupportProps {
    sampleProp?: string;
}

interface ISupportState {
    info: ISupportInfo | null;
}

class Support extends React.Component<unknown, ISupportState> {
    constructor(props: unknown) {
        super(props);
        this.state = { info: null };
    }

    async componentDidMount(): Promise<void> {
        const info = await getSupportInfo();
        this.setState({ info });
    }

    render(): JSX.Element {
        const { info } = this.state;
        const columns = ['key', 'value'];
        const rows = info
            ? [
                  [
                      'cli',
                      <>
                          {info.cli_version.split('\n').map((x, id) => (
                              <div key={id}>{x}</div>
                          ))}
                      </>,
                  ],
                  [
                      'api',
                      <>
                          {info.api_version.split('\n').map((x, id) => (
                              <div key={id}>{x}</div>
                          ))}
                      </>,
                  ],
                  ['api image hash', info.api_image],
                  ['ui image hash', info.ui_image],
                  ['platform', info.platform],
                  ['docker', info.docker],
              ]
            : [];
        return (
            <PageSection>
                {info === null ? (
                    <EmptyState variant={EmptyStateVariant.full}>
                        <EmptyStateIcon icon={CubesIcon} />
                        <Title headingLevel="h1" size="lg">
                            Website
                        </Title>
                        <EmptyStateBody>
                            For more details checkout{' '}
                            <a href="https://move2kube.konveyor.io/">Konveyor Move2Kube Website</a>
                        </EmptyStateBody>
                    </EmptyState>
                ) : (
                    <>
                        <Table aria-label="Simple Table" cells={columns} rows={rows}>
                            <TableBody />
                        </Table>
                        <div style={{ textAlign: 'center', padding: '1em' }}>
                            For more details checkout{' '}
                            <a href="https://move2kube.konveyor.io/">Konveyor Move2Kube Website</a>
                        </div>
                    </>
                )}
            </PageSection>
        );
    }
}

export { Support };
