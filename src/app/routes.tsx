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
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { Alert, PageSection } from '@patternfly/react-core';
import { DynamicImport } from '@app/DynamicImport';
import { accessibleRouteChangeHandler } from '@app/utils/utils';
import { Applications } from '@app/Applications/Applications';
import { NotFound } from '@app/NotFound/NotFound';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';
import { LastLocationProvider, useLastLocation } from 'react-router-last-location';

let routeFocusTimer: number;

const getGuidedFlowModuleAsync = () => import(/* webpackChunkName: 'guidedflow' */ '@app/Application/GuidedFlow');

const GuidedFlow = (routeProps: RouteComponentProps): React.ReactElement => {
    const lastNavigation = useLastLocation();
    return (
        /* eslint-disable @typescript-eslint/no-explicit-any */
        <DynamicImport load={getGuidedFlowModuleAsync} focusContentAfterMount={lastNavigation !== null}>
            {(Component: any) => {
                let loadedComponent = (
                    <PageSection aria-label="Loading Content Container">
                        <div className="pf-l-bullseye">
                            <Alert title="Loading" className="pf-l-bullseye__item" />
                        </div>
                    </PageSection>
                );
                if (Component !== null) {
                    loadedComponent = <Component.GuidedFlow {...routeProps} />;
                }
                return loadedComponent;
            }}
        </DynamicImport>
    );
};

const getSupportModuleAsync = () => import(/* webpackChunkName: 'support' */ '@app/Support/Support');

const Support = (routeProps: RouteComponentProps): React.ReactElement => {
    const lastNavigation = useLastLocation();
    return (
        /* eslint-disable @typescript-eslint/no-explicit-any */
        <DynamicImport load={getSupportModuleAsync} focusContentAfterMount={lastNavigation !== null}>
            {(Component: any) => {
                let loadedComponent = (
                    <PageSection aria-label="Loading Content Container">
                        <div className="pf-l-bullseye">
                            <Alert title="Loading" className="pf-l-bullseye__item" />
                        </div>
                    </PageSection>
                );
                if (Component !== null) {
                    loadedComponent = <Component.Support {...routeProps} />;
                }
                return loadedComponent;
            }}
        </DynamicImport>
    );
};

const getApplicationModuleAsync = () => import(/* webpackChunkName: 'application' */ '@app/Application/Application');

const Application = (routeProps: RouteComponentProps): React.ReactElement => {
    const lastNavigation = useLastLocation();
    return (
        /* eslint-disable @typescript-eslint/no-explicit-any */
        <DynamicImport load={getApplicationModuleAsync} focusContentAfterMount={lastNavigation !== null}>
            {(Component: any) => {
                let loadedComponent = (
                    <PageSection aria-label="Loading Content Container">
                        <div className="pf-l-bullseye">
                            <Alert title="Loading" className="pf-l-bullseye__item" />
                        </div>
                    </PageSection>
                );
                if (Component !== null) {
                    loadedComponent = <Component.Application {...routeProps} />;
                }
                return loadedComponent;
            }}
        </DynamicImport>
    );
};

export interface IAppRoute {
    label?: string;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    exact?: boolean;
    path: string;
    title: string;
    isAsync?: boolean;
}

const routes: IAppRoute[] = [
    {
        component: Applications,
        exact: true,
        label: 'Applications',
        path: '/',
        title: 'Move2Kube | Applications',
    },
    {
        component: Application,
        exact: true,
        isAsync: true,
        label: 'Application',
        path: '/application/:name',
        title: 'Move2Kube | Application',
    },
    {
        component: GuidedFlow,
        exact: true,
        isAsync: true,
        label: 'New Application',
        path: '/newapp',
        title: 'Move2Kube | New Application',
    },
    {
        component: Support,
        exact: true,
        isAsync: true,
        label: 'Support',
        path: '/support',
        title: 'Move2Kube | Contacts',
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
        return () => {
            window.clearTimeout(routeFocusTimer);
        };
    }, [isAsync, lastNavigation]);
};

const RouteWithTitleUpdates = ({ component: Component, isAsync = false, title, ...rest }: IAppRoute) => {
    useA11yRouteChange(isAsync);
    useDocumentTitle(title);

    function routeWithTitle(routeProps: RouteComponentProps) {
        return <Component {...rest} {...routeProps} />;
    }

    return <Route render={routeWithTitle} />;
};

const PageNotFound = ({ title }: { title: string }) => {
    useDocumentTitle(title);
    return <Route component={NotFound} />;
};

const AppRoutes = (): React.ReactElement => (
    <LastLocationProvider>
        <Switch>
            {routes.map(({ path, exact, component, title, isAsync }, idx) => (
                <RouteWithTitleUpdates
                    path={path}
                    exact={exact}
                    component={component}
                    key={idx}
                    title={title}
                    isAsync={isAsync}
                />
            ))}
            <PageNotFound title="404 Page Not Found" />
        </Switch>
    </LastLocationProvider>
);

export { AppRoutes, routes };
