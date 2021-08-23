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

import React from 'react';
import { Redirect } from 'react-router-dom';
import { Support } from '@app/support/Support';
import { Projects } from '@app/projects/Projects';
import { NotFound } from '@app/not-found/NotFound';
import { useDocumentTitle } from '@app/common/utils';
import { Workspaces } from '@app/workspaces/Workspaces';
import { accessibleRouteChangeHandler } from '@app/common/utils';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { IApplicationContext, DEFAULT_WORKSPACE_ID } from '@app/common/types';
import { LastLocationProvider, useLastLocation } from 'react-router-last-location';

let routeFocusTimer: number;

interface IAppRoute {
    label?: string;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    Component: React.ComponentType<any>;
    exact?: boolean;
    path: string;
    navPath?: (appCtx: IApplicationContext) => string;
    title: string;
    isAsync?: boolean;
}

const routes: IAppRoute[] = [
    {
        Component: Workspaces,
        exact: true,
        label: 'Workspaces',
        path: '/workspaces/:workspaceId?',
        navPath: () => '/workspaces',
        title: 'Move2Kube | Workspaces',
    },
    {
        Component: Projects,
        exact: true,
        label: 'Projects',
        path: '/workspaces/:workspaceId/projects/:projectId?',
        navPath: (appCtx) => `/workspaces/${appCtx.currentWorkspace.id || DEFAULT_WORKSPACE_ID}/projects`,
        title: 'Move2Kube | Projects',
    },
    {
        Component: Support,
        exact: true,
        isAsync: true,
        label: 'Support',
        path: '/support',
        title: 'Move2Kube | Support',
    },
];

// a custom hook for sending focus to the primary content container
// after a view has loaded so that subsequent press of tab key
// sends focus directly to relevant content
const useA11yRouteChange = (isAsync: boolean) => {
    const lastNavigation = useLastLocation();
    React.useEffect(() => {
        if (!isAsync && lastNavigation !== null) {
            routeFocusTimer = accessibleRouteChangeHandler();
        }
        return () => window.clearTimeout(routeFocusTimer);
    }, [isAsync, lastNavigation]);
};

const RouteWithTitleUpdates = ({ Component: Component, path, exact, isAsync = false, title, ...rest }: IAppRoute) => {
    useA11yRouteChange(isAsync);
    useDocumentTitle(title);
    return (
        <Route
            path={path}
            exact={exact}
            render={(routeProps: RouteComponentProps) => <Component {...rest} {...routeProps} />}
        />
    );
};

const PageNotFound = () => {
    useDocumentTitle('404 Page Not Found');
    return <Route component={NotFound} />;
};

const AppRoutes = (): React.ReactElement => (
    <LastLocationProvider>
        <Switch>
            <Route path="/" exact={true}>
                <Redirect to="/workspaces" />
            </Route>
            {routes.map(({ path, exact, title, isAsync, Component }, idx) => (
                <RouteWithTitleUpdates
                    key={idx}
                    path={path}
                    exact={exact}
                    title={title}
                    isAsync={isAsync}
                    Component={Component}
                />
            ))}
            <PageNotFound />
        </Switch>
    </LastLocationProvider>
);

export { AppRoutes, routes };
