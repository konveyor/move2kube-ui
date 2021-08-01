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

import '@app/app.css';
import * as React from 'react';
import { ErrHTTP403 } from './Networking/types';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { SimpleLoginPage, LoginContext, ILoginContext } from '@app/Login/Login';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

class App extends React.Component<Readonly<unknown>, ILoginContext> {
    constructor(props: Readonly<unknown>) {
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
            if (e instanceof ErrHTTP403)
                return console.log("cannot get user profile becauser we haven't logged in yet");
            console.error(e);
        }
    }
    async refreshUserProfile(): Promise<void> {
        const res = await fetch('/auth/user-profile', { headers: { Accept: 'application/json' } });
        if (!res.ok) {
            this.setState({ useAuth: res.status !== 404, isLoggedIn: false });
            if (res.status === 404)
                return console.log('cannot get the user profile because authentication is disabled');
            if (res.status === 403) throw new ErrHTTP403();
            throw new Error(`failed to get the user profile: ${res.status}`);
        }
        const user = await res.json();
        this.setState({ useAuth: true, isLoggedIn: true, userName: user.name, userImage: user.image });
    }
    async logOut(): Promise<void> {
        try {
            const res = await fetch('/logout', { method: 'DELETE' });
            if (!res.ok) {
                if (res.status === 403) throw new ErrHTTP403();
                throw new Error(`failed to logout: ${res.status}`);
            }
        } catch (e) {
            if (e instanceof ErrHTTP403) return console.log('have to log in before we can log out');
            console.error(e);
        }
        this.setState({ isLoggedIn: false });
    }
    render(): JSX.Element {
        return (
            <LoginContext.Provider value={this.state}>
                <Router>
                    <Switch>
                        <Route path="/login" exact>
                            <SimpleLoginPage />
                        </Route>
                        <Route component={AppLayout} />
                    </Switch>
                </Router>
            </LoginContext.Provider>
        );
    }
}

export { App };
