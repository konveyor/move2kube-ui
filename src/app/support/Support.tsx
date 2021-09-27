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

import { ISupportInfo } from '@app/common/types';
import React, { useEffect, useState } from 'react';
import { getSupportInfo } from '@app/networking/api';
import { Table, TableBody } from '@patternfly/react-table';
import { Alert, Spinner, PageSection } from '@patternfly/react-core';

function Support(): JSX.Element {
    const [info, setInfo] = useState<ISupportInfo | null>(null);
    const [infoErr, setInfoErr] = useState<Error | null>(null);
    useEffect(() => {
        getSupportInfo()
            .then((info) => {
                setInfo(info);
                setInfoErr(null);
            })
            .catch(setInfoErr);
    }, []);
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
              [
                  'ui',
                  <>
                      {info.ui_version.split('\n').map((x, id) => (
                          <div key={id}>{x}</div>
                      ))}
                  </>,
              ],
              ['docker', info.docker],
          ]
        : [];
    return (
        <PageSection>
            {infoErr !== null ? (
                <Alert variant="danger" title={`${infoErr}`} />
            ) : info === null ? (
                <Spinner />
            ) : (
                <Table aria-label="Simple Table" cells={['Key', 'Value']} rows={rows}>
                    <TableBody />
                </Table>
            )}
            <div style={{ textAlign: 'center', padding: '1em' }}>
                For more details checkout <a href="https://move2kube.konveyor.io/">Konveyor Move2Kube Website</a>
            </div>
        </PageSection>
    );
}

export { Support };
