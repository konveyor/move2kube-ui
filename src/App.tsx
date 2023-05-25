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

import { Workspaces } from './features/workspaces/Workspaces';
import { Projects } from './features/projects/Projects';
import { Project } from './features/projects/Project';
import { Support } from './features/support/Support';
import { BreadCrumbs } from './features/breadcrumbs/BreadCrumbs';
import { NotFound } from './features/notfound/NotFound';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import {
  Page, PageSidebar, PageToggleButton, Masthead,
  MastheadToggle, MastheadMain, MastheadBrand, MastheadContent,
  Toolbar, ToolbarContent, ToolbarItem, Nav, NavList, NavItem, Alert,
  Spinner, Dropdown, DropdownItem, DropdownToggle, Button, AlertGroup, AlertActionCloseButton,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import { FunctionComponent, useState } from 'react';
import { Login } from './features/login/Login';
import { useGetUserProfileQuery, useLogoutMutation } from './features/login/loginApi';
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query';
import { extractErrMsg } from './features/common/utils';
import { deleteToast, selectToasts } from './features/toasts/toastsSlice';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { TOAST_TIMEOUT_MILLISECONDS } from './features/common/constants';

export const App: FunctionComponent = () => {
  const { data: userProfile, isLoading: isLoadingUserProfile, error: getUserProfileErr } = useGetUserProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const isAuthDisabled = (getUserProfileErr as FetchBaseQueryError)?.status === 404;
  const isLoggedOut = (getUserProfileErr as FetchBaseQueryError)?.status === 401;

  const header = (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton>
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand component={() => <Link to="/">Move2Kube</Link>}>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem className="margin-left-auto">
              {isAuthDisabled ? (
                null
              ) : isLoggedOut ? (
                <Link to="/login">Login</Link>
              ) : getUserProfileErr ? (
                <Alert variant="danger" title={extractErrMsg(getUserProfileErr)} />
              ) : isLoadingUserProfile ? (
                <Spinner />
              ) : userProfile ? (
                <Dropdown
                  isOpen={isLogoutOpen}
                  toggle={
                    <DropdownToggle id="drop-down-logout" onToggle={() => setIsLogoutOpen(!isLogoutOpen)}>
                      {userProfile.preferred_username || userProfile.email}
                    </DropdownToggle>
                  }
                  dropdownItems={[
                    <DropdownItem key="logout">
                      <Button isDisabled={isLoggingOut} onClick={() => { setIsLogoutOpen(false); logout(); }}>Logout</Button>
                    </DropdownItem>
                  ]} />
              ) : (
                <Link to="/login">Login</Link>
              )}
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );
  const navi = (
    <Nav>
      <NavList>
        <NavLink to="workspaces">{({ isActive }) => (<NavItem isActive={isActive}><span>Workspaces</span></NavItem>)}</NavLink>
        <NavLink to="support">{({ isActive }) => (<NavItem isActive={isActive}><span>Support</span></NavItem>)}</NavLink>
      </NavList>
    </Nav>
  );
  const sidebar = (<PageSidebar nav={navi} />);
  return (
    <Page header={header} sidebar={sidebar} isManagedSidebar>
      <BreadCrumbs />
      <Routes>
        <Route path="/" element={<Workspaces />} />
        <Route path="workspaces" element={<Workspaces />} />
        <Route path="workspaces/:workspaceId/projects" element={<Projects />} />
        <Route path="workspaces/:workspaceId/projects/:projectId" element={<Project />} />
        <Route path="workspaces/:workspaceId/projects/:projectId/outputs/:outputId" element={<Project />} />
        <Route path="support" element={<Support />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AlertGroup isToast isLiveRegion>
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            variant={toast.variant}
            title={toast.message}
            timeout={TOAST_TIMEOUT_MILLISECONDS}
            onTimeout={() => dispatch(deleteToast(toast.id))}
            actionClose={<AlertActionCloseButton onClose={() => dispatch(deleteToast(toast.id))} />}
          />
        ))}
      </AlertGroup>
    </Page>
  );
};
