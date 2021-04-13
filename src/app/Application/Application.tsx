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
import {
    ContextSelector,
    ContextSelectorItem,
    Tabs,
    Tab,
    TabTitleText,
    PageSection,
    TextContent,
    Text,
    TextVariants,
} from '@patternfly/react-core';
import { Redirect } from 'react-router-dom';
import { ApplicationContext } from './ApplicationContext';
import { PlanTab } from './ApplicationPlan';
import { AssetsTab } from './ApplicationAssets';
import { ArtifactsTab } from './ApplicationArtifacts';
import Yaml from 'js-yaml';
import { IPlan, newPlan } from '@app/Application/Types';
import { copy } from '@app/utils/utils';

interface IApplicationContextSelectorProps {
    selected: string;
}

interface IApplicationContextSelectorState {
    isOpen: boolean;
    selected: React.ReactNode;
    searchValue: string;
    filteredItems: Array<string>;
}

class ApplicationContextSelector extends React.Component<
    IApplicationContextSelectorProps,
    IApplicationContextSelectorState
> {
    declare context: React.ContextType<typeof ApplicationContext>;
    static contextType = ApplicationContext;
    items: Array<string>;

    constructor(props: IApplicationContextSelectorProps) {
        super(props);
        this.onToggle = this.onToggle.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.onSearchInputChange = this.onSearchInputChange.bind(this);
        this.onSearchButtonClick = this.onSearchButtonClick.bind(this);

        this.items = [];
        this.state = {
            isOpen: false,
            selected: this.items[0],
            searchValue: '',
            filteredItems: this.items,
        };
    }

    onToggle(isOpen: boolean) {
        this.setState({ isOpen });
    }

    onSelect(value: React.ReactNode, changeApp: (x: string) => void) {
        changeApp(value as string);
        this.setState({ selected: value, isOpen: !this.state.isOpen });
    }

    onSearchInputChange(searchValue: string): void {
        this.setState({ searchValue }, this.onSearchButtonClick);
    }

    onSearchButtonClick(): void {
        const search = this.state.searchValue.toLowerCase();
        const filtered = search === '' ? this.items : this.items.filter((app) => app.toLowerCase().includes(search));
        this.setState({ filteredItems: filtered || [] });
    }

    async componentDidMount(): Promise<void> {
        try {
            const res = await fetch('/api/v1/applications', { headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error(`Failed to get the applications. Status: ${res.status}`);
            const data = await res.json();
            const apps: Array<string> = data.applications.map((app: { name: string }) => app.name);
            this.items = apps;
            this.setState({ filteredItems: apps });
        } catch (e) {
            console.error(e);
        }
    }

    render(): JSX.Element {
        const { isOpen, searchValue, filteredItems } = this.state;
        const { aName, changeApp } = this.context;
        return (
            <ContextSelector
                toggleText={aName}
                onSearchInputChange={this.onSearchInputChange}
                isOpen={isOpen}
                searchInputValue={searchValue}
                onToggle={(_: unknown, value: boolean) => this.onToggle(value)}
                onSelect={(_, value) => this.onSelect(value, changeApp)}
                onSearchButtonClick={this.onSearchButtonClick}
                screenReaderLabel="Selected Application:"
            >
                {filteredItems.map((item, index) => (
                    <ContextSelectorItem key={index}>{item}</ContextSelectorItem>
                ))}
            </ContextSelector>
        );
    }
}

interface IApplicationTabsState {
    activeTabKey: string | number;
}

class ApplicationTabs extends React.Component<Readonly<unknown>, IApplicationTabsState> {
    constructor(props: Readonly<unknown>) {
        super(props);
        this.state = { activeTabKey: 0 };
        this.handleTabClick = this.handleTabClick.bind(this);
    }

    // Toggle currently active tab
    handleTabClick(tabIndex: string | number) {
        this.setState({ activeTabKey: tabIndex });
    }

    render() {
        const { activeTabKey } = this.state;
        return (
            <div>
                <Tabs
                    activeKey={activeTabKey}
                    onSelect={(_: unknown, tabIndex: string | number) => this.handleTabClick(tabIndex)}
                >
                    <Tab eventKey={0} title={<TabTitleText>Assets</TabTitleText>}>
                        <AssetsTab></AssetsTab>
                    </Tab>
                    <Tab eventKey={1} title={<TabTitleText>Plan</TabTitleText>}>
                        <PlanTab></PlanTab>
                    </Tab>
                    <Tab eventKey={2} title={<TabTitleText>Target Artifacts</TabTitleText>}>
                        <ArtifactsTab />
                    </Tab>
                </Tabs>
            </div>
        );
    }
}

interface IApplicationProps {
    computedMatch: { params?: { name: string } };
}

interface IApplicationState {
    aName: string;
    aStatus: Array<string>;
    aPlan: IPlan;
    redirect: boolean;
    changeApp: (x: string) => void;
    updateApp: () => void;
    setNewPlan: (plan: string) => void;
    selectServiceOption: (serviceName: string, optionIdx: number) => void;
    deleteServiceOption: (serviceName: string) => void;
}

class Application extends React.Component<IApplicationProps, IApplicationState> {
    aPlan: IPlan = newPlan();

    constructor(props: IApplicationProps) {
        super(props);
        this.updateApp = this.updateApp.bind(this);
        this.changeApp = this.changeApp.bind(this);
        this.setNewPlan = this.setNewPlan.bind(this);
        this.uploadPlan = this.uploadPlan.bind(this);
        this.validatePlan = this.validatePlan.bind(this);
        this.selectServiceOption = this.selectServiceOption.bind(this);
        this.deleteServiceOption = this.deleteServiceOption.bind(this);

        // State also contains the updater function so it will
        // be passed down into the context provider
        this.state = {
            aName: '',
            aStatus: [],
            aPlan: newPlan(),
            redirect: false,
            changeApp: this.changeApp,
            updateApp: this.updateApp,
            setNewPlan: this.setNewPlan,
            selectServiceOption: this.selectServiceOption,
            deleteServiceOption: this.deleteServiceOption,
        };
    }

    async updateApp(): Promise<void> {
        if (this.state.aName === '') {
            return console.log('No app to update.');
        }
        try {
            const res = await fetch('/api/v1/applications/' + encodeURIComponent(this.state.aName), {
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error(`Failed to get the application ${this.state.aName}. Status: ${res.status}`);
            const data = await res.json();
            this.setState(() => ({ aName: data.name, aStatus: data.status, redirect: false }));
            try {
                const res = await fetch('/api/v1/applications/' + encodeURIComponent(this.state.aName) + '/plan', {
                    headers: { 'Content-Type': 'application/text' },
                });
                if (!res.ok)
                    throw new Error(`Failed to get the plan for the app ${this.state.aName}. Status: ${res.status}`);
                const data = await res.text();
                const planjson = Yaml.load(data) as IPlan;
                planjson.metadata.name = this.state.aName;
                this.setState({ aPlan: planjson });
                this.aPlan = planjson;
            } catch (e) {
                this.setState({ aPlan: newPlan() });
                console.error(e);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async changeApp(appName: string): Promise<void> {
        if (appName === ':name') {
            try {
                const res = await fetch('/api/v1/applications', { headers: { 'Content-Type': 'application/json' } });
                if (!res.ok) throw new Error(`Failed to get the applications. Status: ${res.status}`);
                const data = await res.json();
                const applications = data.applications;
                if (applications.length > 0) {
                    return this.changeApp(applications[0]['name']);
                }
                return console.log('No applications found.');
            } catch (e) {
                return console.error(e);
            }
        }
        if (this.state.aName !== appName) {
            return this.setState(() => ({ aName: appName, redirect: true }), this.updateApp);
        }
        this.updateApp();
    }

    async uploadPlan(): Promise<void> {
        const url = '/api/v1/applications/' + encodeURIComponent(this.state.aName) + '/plan';
        const formdata = new FormData();
        formdata.append('plan', Yaml.dump(this.state.aPlan));
        try {
            const res = await fetch(url, { method: 'PUT', body: formdata });
            if (!res.ok)
                throw new Error(`Failed to update the plan for the app ${this.state.aName}. Status: ${res.status}`);
            console.log('Uploaded the new plan');
            this.updateApp();
        } catch (e) {
            console.error(e);
        }
    }

    validatePlan(plan: IPlan): void {
        // TODO: better plan validation
        if (!('metadata' in plan)) throw new Error('The plan is missing metadata');
    }

    setNewPlan(plan: string): void {
        const aPlan = Yaml.load(plan) as IPlan;
        this.validatePlan(aPlan);
        this.setState({ aPlan }, this.uploadPlan);
    }

    selectServiceOption(serviceName: string, optionIdx: number): void {
        const aPlan = copy(this.state.aPlan);
        const oldoption = aPlan.spec.inputs.services[serviceName][0];
        aPlan.spec.inputs.services[serviceName][0] = aPlan.spec.inputs.services[serviceName][optionIdx];
        aPlan.spec.inputs.services[serviceName][optionIdx] = oldoption;
        this.setState({ aPlan }, this.uploadPlan);
    }

    deleteServiceOption(serviceName: string): void {
        const aPlan = copy(this.state.aPlan);
        delete aPlan.spec.inputs.services[serviceName];
        this.setState({ aPlan }, this.uploadPlan);
    }

    componentDidMount(): void {
        if (this.props.computedMatch.params) {
            this.changeApp(this.props.computedMatch.params.name);
        } else {
            this.changeApp(':name');
        }
    }

    render(): JSX.Element {
        const { aName, aStatus, redirect } = this.state;
        const value = new URLSearchParams(window.location.search);
        const debugSuffix = value.get('debug') ? `?debug=${value.get('debug')}` : '';
        const url = '/application/' + encodeURIComponent(aName) + debugSuffix;
        if (redirect) {
            return <Redirect to={url} />;
        }

        return (
            <ApplicationContext.Provider value={this.state}>
                <PageSection>
                    <TextContent>
                        <Text component={TextVariants.h1}>Application</Text>
                    </TextContent>
                    <ApplicationContextSelector selected={aName}></ApplicationContextSelector>
                    <PageSection>
                        <TextContent>
                            <Text component={TextVariants.h2}>Data Available : {JSON.stringify(aStatus)}</Text>
                        </TextContent>
                    </PageSection>
                    <PageSection>
                        <ApplicationTabs></ApplicationTabs>
                    </PageSection>
                </PageSection>
            </ApplicationContext.Provider>
        );
    }
}

export { Application, ArtifactsTab };
