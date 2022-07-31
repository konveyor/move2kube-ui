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

import * as React from 'react';
import { accessibleRouteChangeHandler } from '../common/utils';

interface IDynamicImportProps {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    load: () => Promise<any>;
    children: (component: any) => JSX.Element;
    focusContentAfterMount: boolean;
}

interface IDynamicImportState {
    component: any;
}

class DynamicImport extends React.Component<IDynamicImportProps, IDynamicImportState> {
    routeFocusTimer = 0;

    constructor(props: IDynamicImportProps) {
        super(props);
        this.state = { component: null };
    }

    async componentDidMount(): Promise<void> {
        const component = await this.props.load();
        if (component) {
            this.setState({ component: component.default ? component.default : component });
        }
        if (this.props.focusContentAfterMount) {
            this.routeFocusTimer = accessibleRouteChangeHandler();
        }
    }

    componentWillUnmount(): void {
        window.clearTimeout(this.routeFocusTimer);
    }

    render(): JSX.Element {
        return this.props.children(this.state.component);
    }
}

export { DynamicImport };
