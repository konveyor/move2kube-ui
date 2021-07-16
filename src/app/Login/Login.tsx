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
import brandImg from '@app/move2kube-logo.svg';
import backgroundImg from '@app/login-background.svg';
import { Alert, LoginPage, ListItem, ListVariant, Form, Button, Spinner } from '@patternfly/react-core';
import { Redirect, Link } from 'react-router-dom';

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

interface ISimpleLoginPageState {
    showHelperText: boolean;
    alreadyFetched: boolean;
    loginOptions: Array<{ idp_type: string; idp_id: string; idp_name: string }>;
}

class SimpleLoginPage extends React.Component<Readonly<unknown>, ISimpleLoginPageState> {
    constructor(props: Readonly<unknown>) {
        super(props);
        this.refreshLoginOptions = this.refreshLoginOptions.bind(this);
        this.state = {
            showHelperText: false,
            alreadyFetched: false,
            loginOptions: [],
        };
    }
    async componentDidMount(): Promise<void> {
        try {
            await this.refreshLoginOptions();
        } catch (e) {
            console.error(e);
        }
    }
    async refreshLoginOptions(): Promise<void> {
        const res = await fetch('/auth/login-options', { headers: { Accept: 'application/json' } });
        if (!res.ok) {
            this.setState({ loginOptions: [], alreadyFetched: true });
            if (res.status === 404)
                return console.log('cannot get the login options because authentication is disabled');
            throw new Error(`failed to get the login options: ${res.status}`);
        }
        const loginOptions = await res.json();
        this.setState({ loginOptions, alreadyFetched: true });
    }
    render(): JSX.Element {
        const listItems = (
            <ListItem>
                <Link to="/support">Support</Link>
            </ListItem>
        );
        const innerElem = this.state.alreadyFetched ? (
            this.state.loginOptions.length > 0 ? (
                this.state.loginOptions.map((loginOption, i) => (
                    <Button key={i} component="a" href={`/login/${loginOption.idp_type}/${loginOption.idp_id}`}>
                        Sign in with {loginOption.idp_name}
                    </Button>
                ))
            ) : (
                <Alert variant="warning" title="No login options configured! Please contact your administrator"></Alert>
            )
        ) : (
            <p>
                <Spinner isSVG />
                Loading login options
            </p>
        );
        return (
            <LoginContext.Consumer>
                {(user) =>
                    !user.useAuth || user.isLoggedIn ? (
                        <Redirect to="/" />
                    ) : (
                        <LoginPage
                            brandImgSrc={brandImg}
                            brandImgAlt="Move2Kube logo"
                            backgroundImgSrc={backgroundImg}
                            backgroundImgAlt="Login page background"
                            footerListVariants={ListVariant.inline}
                            footerListItems={listItems}
                            textContent="Move2Kube is a tool that helps you migrate your app to run on Kubernetes and Openshift. It supports migration from a variety of source platforms."
                            loginTitle="Log in to your account"
                            loginSubtitle="Please use one of the options below to login."
                        >
                            <Form>{innerElem}</Form>
                        </LoginPage>
                    )
                }
            </LoginContext.Consumer>
        );
    }
}

export { SimpleLoginPage, LoginContext, ILoginContext };
