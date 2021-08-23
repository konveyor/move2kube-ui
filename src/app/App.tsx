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

import '@app/assets/app.css';
import '@app/assets/fonts.css';
import '@patternfly/react-core/dist/styles/base.css';

import React from 'react';
import { AppLayout } from '@app/layout/AppLayout';
import { getUserProfile, logout } from '@app/networking/login';
import { SimpleLoginPage, LoginContext, ILoginContext } from '@app/login/Login';
import { ErrHTTP401, ErrHTTP403, ErrHTTP404, IUserInfo } from '@app/common/types';
import { BrowserRouter as Router, Route, Switch, RouteComponentProps } from 'react-router-dom';

type ILoginContextProviderProps = RouteComponentProps;

class LoginContextProvider extends React.Component<ILoginContextProviderProps, ILoginContext> {
    constructor(props: ILoginContextProviderProps) {
        super(props);
        this.logOut = this.logOut.bind(this);
        this.refreshUserProfile = this.refreshUserProfile.bind(this);
        this.state = {
            useAuth: false,
            isLoggedIn: false,
            userName: '',
            userImage: '',
            refreshUserProfile: this.refreshUserProfile,
            logOut: this.logOut,
        };
    }
    async componentDidMount(): Promise<void> {
        try {
            await this.refreshUserProfile();
        } catch (e) {
            console.error(e);
        }
    }
    async refreshUserProfile(): Promise<void> {
        try {
            const user: IUserInfo = await getUserProfile();
            console.log('user', user);
            this.setState({
                useAuth: true,
                isLoggedIn: true,
                userName: user.preferred_username || user.email,
                userImage: user.picture || '',
            });
        } catch (e) {
            this.setState({ useAuth: !(e instanceof ErrHTTP404), isLoggedIn: false });
            if (e instanceof ErrHTTP403)
                return console.log("cannot get the user profile because the user hasn't logged in yet");
            if (e instanceof ErrHTTP404)
                return console.log('cannot get the user profile because authentication is disabled');
            throw new Error(`failed to refresh the user profile. ${e}`);
        }
    }
    async logOut(): Promise<void> {
        try {
            await logout();
            console.log('logged out successfully');
            return this.setState({ isLoggedIn: false }, () => this.props.history.push('/login'));
        } catch (e) {
            if (e instanceof ErrHTTP401) {
                console.log('have to log in before we can log out');
                return this.setState({ isLoggedIn: false }, () => this.props.history.push('/login'));
            }
            const err = `failed to logout. ${e}`;
            console.error(err);
            this.setState({ isLoggedIn: false });
            alert(err);
        }
    }
    render(): JSX.Element {
        return (
            <LoginContext.Provider value={this.state}>
                <Switch>
                    <Route path="/login" exact>
                        <SimpleLoginPage />
                    </Route>
                    <Route component={AppLayout} />
                </Switch>
            </LoginContext.Provider>
        );
    }
}

function App(): JSX.Element {
    return (
        <Router>
            <Route component={LoginContextProvider} />
        </Router>
    );
}

export { App };
