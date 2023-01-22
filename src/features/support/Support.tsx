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

import { FunctionComponent } from "react";
import { PageSection, Title, Alert, Spinner } from '@patternfly/react-core';
import { ReactComponent as Logo } from '../../assets/images/logo.svg';
import { useGetSupportInfoQuery } from "./supportApi";
import { extractErrMsg } from "../common/utils";

export const Support: FunctionComponent = () => {
    const { data, isLoading, error } = useGetSupportInfoQuery();
    return (
        <PageSection>
            <div className="flex-vertical center">
                <Logo width='10em' /><br />
                <Title headingLevel="h1">Support Information</Title>
                <p>Documentation and tutorials can be found at <a target="_blank" rel="noreferrer" href="https://move2kube.konveyor.io/">https://move2kube.konveyor.io/</a></p>
                <p>Please provide this info while creating issues at <a href="https://github.com/konveyor/move2kube/issues">https://github.com/konveyor/move2kube/issues</a></p>
            </div>
            <br />
            {
                error ? (
                    <Alert variant="danger" title={extractErrMsg(error)} />
                ) : isLoading ? (
                    <Spinner />
                ) : data ? (
                    <table className="flex-vertical center my-table">
                        <tbody>
                            <tr><td>CLI</td><td><pre>{data.cli_version}</pre></td></tr>
                            <tr><td>API</td><td><pre>{data.api_version}</pre></td></tr>
                            <tr><td>UI</td><td><pre>{data.ui_version}</pre></td></tr>
                            <tr><td>Docker</td><td><pre>{data.docker}</pre></td></tr>
                        </tbody>
                    </table>
                ) : null
            }
        </PageSection>
    );
};
