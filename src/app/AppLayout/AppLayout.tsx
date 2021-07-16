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
import {
    Nav,
    Page,
    Avatar,
    Button,
    Popover,
    NavList,
    NavItem,
    PageHeader,
    PageSidebar,
    SkipToContent,
    PageHeaderTools,
} from '@patternfly/react-core';
import { AppRoutes, routes } from '@app/routes';
import { NavLink, Link, Redirect } from 'react-router-dom';
import { Location } from 'history';
import defaultProfileImage from '@app/user-picture.svg';
import { ILoginContext, LoginContext } from '@app/Login/Login';

interface IAppLayoutProps {
    location: Location;
}

const AppLayout: React.FunctionComponent<IAppLayoutProps> = (props: IAppLayoutProps) => {
    const logoProps = { href: '/', target: '_blank' };
    const [isNavOpen, setIsNavOpen] = React.useState(true);
    const [isMobileView, setIsMobileView] = React.useState(true);
    const [isNavOpenMobile, setIsNavOpenMobile] = React.useState(false);
    const onNavToggleMobile = () => setIsNavOpenMobile(!isNavOpenMobile);
    const onNavToggle = () => setIsNavOpen(!isNavOpen);
    const onPageResize = (x: { mobileView: boolean; windowSize: number }) => setIsMobileView(x.mobileView);
    const getHeaderTools = (user: ILoginContext) => (
        <PageHeaderTools>
            {user.isLoggedIn ? (
                <Popover
                    position="bottom"
                    bodyContent={
                        <>
                            <h1>{user.userName}</h1>
                            <Button onClick={user.logOut}>Logout</Button>
                        </>
                    }
                >
                    <Avatar src={user.userImage || defaultProfileImage} alt="user profile picture" />
                </Popover>
            ) : (
                <Link to="/login"></Link>
            )}
        </PageHeaderTools>
    );
    const Header = (
        <LoginContext.Consumer>
            {(user) => (
                <PageHeader
                    logo="Move2Kube"
                    headerTools={user.useAuth ? getHeaderTools(user) : null}
                    logoProps={logoProps}
                    showNavToggle
                    isNavOpen={isNavOpen}
                    onNavToggle={isMobileView ? onNavToggleMobile : onNavToggle}
                />
            )}
        </LoginContext.Consumer>
    );
    const Navigation = (
        <Nav id="nav-primary-simple" theme="dark">
            <NavList id="nav-list-simple">
                {routes.map(
                    (route, idx) =>
                        route.label && (
                            <NavItem key={`${route.label}-${idx}`} id={`${route.label}-${idx}`}>
                                <NavLink exact to={route.path} activeClassName="pf-m-current">
                                    {route.label}
                                </NavLink>
                            </NavItem>
                        ),
                )}
            </NavList>
        </Nav>
    );
    const Sidebar = (
        <PageSidebar theme="dark" nav={Navigation} isNavOpen={isMobileView ? isNavOpenMobile : isNavOpen} />
    );
    const PageSkipToContent = <SkipToContent href="#primary-app-container">Skip to Content</SkipToContent>;
    const appRoutes = (
        <Page
            mainContainerId="primary-app-container"
            header={Header}
            sidebar={Sidebar}
            onPageResize={onPageResize}
            skipToContent={PageSkipToContent}
        >
            <AppRoutes />
        </Page>
    );
    return (
        <LoginContext.Consumer>
            {(user) =>
                !user.useAuth || user.isLoggedIn || props.location.pathname === '/support' ? (
                    appRoutes
                ) : (
                    <Redirect to="/login" />
                )
            }
        </LoginContext.Consumer>
    );
};

export { AppLayout };
