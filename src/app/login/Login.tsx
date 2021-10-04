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

import brandImg from '@app/assets/move2kube-logo.svg';
import backgroundImg from '@app/assets/login-background.svg';

import { Redirect, Link } from 'react-router-dom';
import React, { useContext, useEffect } from 'react';
import { LoginPage, ListItem, ListVariant, Form } from '@patternfly/react-core';

interface ILoginContext {
    useAuth: boolean;
    isLoggedIn: boolean;
    userName: string;
    userImage?: string;
    logOut: () => void;
    refreshUserProfile: () => void;
}

const LoginContext = React.createContext<ILoginContext>({
    useAuth: false,
    isLoggedIn: false,
    userName: '',
    logOut: () => {
        /*By default does nothing*/
    },
    refreshUserProfile: () => {
        /*By default does nothing*/
    },
});
LoginContext.displayName = 'LoginContext';

function SimpleLoginPage(): JSX.Element {
    const { useAuth, isLoggedIn } = useContext(LoginContext);
    useEffect(() => {
        if (useAuth && !isLoggedIn) window.location.href = '/auth/login';
    }, [useAuth, isLoggedIn]);
    return !useAuth || isLoggedIn ? (
        <Redirect to="/" />
    ) : (
        <LoginPage
            brandImgSrc={brandImg}
            brandImgAlt="Move2Kube logo"
            backgroundImgSrc={backgroundImg}
            backgroundImgAlt="Login page background"
            footerListVariants={ListVariant.inline}
            footerListItems={
                <ListItem>
                    <Link to="/support">Support</Link>
                </ListItem>
            }
            textContent="Move2Kube is a tool that helps you migrate your app to run on Kubernetes and Openshift. It supports migration from a variety of source platforms."
            loginTitle="Log in to your account"
            loginSubtitle="Please use one of the options below to login."
        >
            <Form>
                <a href="/auth/login">Login</a>
            </Form>
        </LoginPage>
    );
}

export { SimpleLoginPage, LoginContext, ILoginContext };
