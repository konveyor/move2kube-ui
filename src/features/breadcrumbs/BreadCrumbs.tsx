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

import { Card, CardBody, Split, SplitItem } from '@patternfly/react-core';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs as MUIBreadcrumbs } from '@mui/material';
import { ArrowRightIcon } from '@patternfly/react-icons';

const rx = /^\/login$/;
const r0 = /^\/support$/;
const r1 = /^\/workspaces/;
const r2 = /^\/workspaces\/([a-z0-9-]+)\/projects/;
const r3 = /^\/workspaces\/([a-z0-9-]+)\/projects\/([a-z0-9-]+)/;

export const BreadCrumbs: React.FunctionComponent = () => {
    const location = useLocation();
    const p = location.pathname;
    const r2Matches = p.match(r2);
    const r3Matches = p.match(r3);
    return (
        <Card>
            <CardBody>
                <Split hasGutter>
                    <SplitItem><ArrowRightIcon /></SplitItem>
                    <SplitItem>
                        <MUIBreadcrumbs>
                            {p === '/' && <Link to="/workspaces">workspaces</Link>}
                            {rx.test(p) && <Link to="/login">login</Link>}
                            {r0.test(p) && <Link to="/support">support</Link>}
                            {r1.test(p) && <Link to="/workspaces">workspaces</Link>}
                            {r2Matches && <Link to={`/workspaces/${r2Matches[1]}/projects`}>workspace {r2Matches[1].slice(0, 8)}...</Link>}
                            {r3Matches && <Link to={`/workspaces/${r3Matches[1]}/projects/${r3Matches[2]}`}>project {r3Matches[2].slice(0, 8)}...</Link>}
                        </MUIBreadcrumbs>
                    </SplitItem>
                </Split>
            </CardBody>
        </Card>
    );
};
