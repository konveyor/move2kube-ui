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
  TextVariants
} from '@patternfly/react-core';
import  { Redirect } from 'react-router-dom'
import { ApplicationContext } from "./ApplicationContext"
import { PlanTab } from "./ApplicationPlan"
import { AssetsTab } from "./ApplicationAssets"
import { ArtifactsTab } from "./ApplicationArtifacts"
import Yaml from 'js-yaml'
import queryString from 'query-string'

class ApplicationContextSelector extends React.Component {

  componentDidMount() {
    fetch('/api/v1/applications', 
      {
        headers: {
        'Content-Type': 'application/json'
        }
      }
    )
    .then(res => res.json())
    .then((data) => {
      var applications = data.applications
      var apps = new Array(applications.length)
      for (var index = 0; index < applications.length; index++) { 
        apps[index] = applications[index]["name"]
      } 
      this.items = apps
    })
    .catch(console.log)
  }

  constructor(props) {
    super(props);
    this.items = [];

    this.state = {
      isOpen: false,
      selected: this.items[0],
      searchValue: '',
      filteredItems: this.items
    };

    this.onToggle = (event, isOpen) => {
      this.setState({
        isOpen
      });
    };

    this.onSelect = (event, value,changeApp) => {
      changeApp(value);
      this.setState({
        selected: value,
        isOpen: !this.state.isOpen
      });
    };

    this.onSearchInputChange = value => {
      this.setState({ searchValue: value });
    };

    this.onSearchButtonClick = event => {
      const filtered =
        this.state.searchValue === ''
          ? this.items
          : this.items.filter(str => str.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1);

      this.setState({ filteredItems: filtered || [] });
    };
  }

  render() {
    const { isOpen, selected, searchValue, filteredItems } = this.state;
    return (
      <ApplicationContext.Consumer>
      {({aName, changeApp}) => ( 
          <ContextSelector
            toggleText={aName}
            onSearchInputChange={this.onSearchInputChange}
            isOpen={isOpen}
            searchInputValue={searchValue}
            onToggle={this.onToggle}
            onSelect={(event, value) => (this.onSelect(event,value,changeApp))}
            onSearchButtonClick={this.onSearchButtonClick}
            screenReaderLabel="Selected Application:"
          >
            {filteredItems.map((item, index) => (
              <ContextSelectorItem key={index}>{item}</ContextSelectorItem>
            ))}
          </ContextSelector>
        )}
      </ApplicationContext.Consumer>
    );
  }
}

class ApplicationTabs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabKey: 0
    };
    // Toggle currently active tab
    this.handleTabClick = (event, tabIndex) => {
      this.setState({
        activeTabKey: tabIndex
      });
    };
  }

  render() {
    const {activeTabKey, isUploadAssetModalOpen} = this.state;
    return (
      <ApplicationContext.Consumer>
      {({aName, changeApp}) => ( 
        <div>
          <Tabs activeKey={activeTabKey} onSelect={this.handleTabClick}>
            <Tab eventKey={0} title={<TabTitleText>Assets</TabTitleText>}>
              <AssetsTab></AssetsTab>
            </Tab>
            <Tab eventKey={1} title={<TabTitleText>Plan</TabTitleText>}>
              <PlanTab></PlanTab>
            </Tab>
            <Tab eventKey={2} title={<TabTitleText>Target Artifacts</TabTitleText>}>
              <ArtifactsTab/>
            </Tab>
          </Tabs>
        </div>
      )}
      </ApplicationContext.Consumer>
    );
  }
}

class Application extends React.Component {

  constructor(props) {
    super(props);

    this.updateApp = () => {
        fetch('/api/v1/applications/'+this.state.aName, 
        {
          headers: {
          'Content-Type': 'application/json'
          }
        }
      )
      .then(res => res.json())
      .then((data) => {
        this.setState(state => ({ "aName": data.name, "aStatus": data.status, "redirect": false }));
          fetch('/api/v1/applications/'+this.state.aName+"/plan", 
            {
              headers: {
              'Content-Type': 'application/text'
              }
            }
          )
          .then(res => res.text())
          .then((data) => {
            var planjson = Yaml.load(data);
            planjson.metadata.name = this.state.aName
            this.setState({ "aPlan": planjson });
            this.aPlan = planjson;
          }).catch(() => {
            this.setState({ "aPlan": {} });
            console.log("Plan could not be found.");
        });
      })
      .catch(console.log)
    }
    this.updateApp.bind(this);

    this.changeApp = (appName) => {
      if (appName == ":name") {
        fetch('/api/v1/applications', 
          {
            headers: {
            'Content-Type': 'application/json'
            }
          }
        )
        .then(res => res.json())
        .then((data) => {
          var applications = data.applications
          if (applications.length>0) {
            this.changeApp(applications[0]["name"]);
          }
        })
        .catch(console.log)
        return
      }
      if (this.state.aName != appName) {
        this.setState(state => ({ "aName": appName, "redirect": true }), this.updateApp);
      } else {
        this.updateApp();
      }
    };

    // State also contains the updater function so it will
    // be passed down into the context provider
    this.state = {
      aName: "dummy",
      aStatus: [],
      aPlan: {},
      redirect: false,
      changeApp: this.changeApp,
      updateApp: this.updateApp
    };
  }

  componentDidMount() {
    if (this.props.computedMatch.params) {
      this.changeApp(this.props.computedMatch.params.name); 
    } else {
      this.changeApp(":name"); 
    }
  }

  render() {
    const { aName, aStatus, aPlan, redirect } = this.state;
    var url = '/application/'+aName;
    const value=queryString.parse(location.search);
    const flag=value.debug;
    if(typeof flag !== "undefined") {
        url += "?debug="+flag;
    }
    if (redirect) {
      return <Redirect to={url}/>
    }

    return (
      <ApplicationContext.Provider value={this.state}>
        <PageSection>
          <TextContent><Text component={TextVariants.h1}>Application</Text></TextContent>
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

Application.contextType = ApplicationContext;
export { Application };
