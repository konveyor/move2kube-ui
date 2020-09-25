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
  PageSection,
  TextContent,
  Text,
  TextVariants,
  Modal,
  ModalVariant,
  Gallery,
  Card,
  Radio,
  CardBody,
  TextArea,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  CardHeader,
  CardActions,
  Dropdown,
  CardTitle,
  KebabToggle,
  DropdownItem
} from '@patternfly/react-core';
import { ApplicationContext } from "./ApplicationContext"
import Yaml from 'js-yaml'

class PlanTab extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        showServiceOption: "none",
        showServiceKebab: "none",
        editPlanModal: false
      };
      this.refresh = (aName) => {
        this.context.updateApp();
      }
      this.generatePlan = (aName,aStatus) => {
        if (aStatus.includes("assets")) {
          var url = '/api/v1/applications/'+aName+"/plan";
          fetch(url, {
            method: 'POST',
            }).then(res => {
              if (res.status>400) {
                alert("Error while starting plan.");
              } else {
                this.context.updateApp();
                alert("Plan generation started. Come back in 5 mins for smaller projects and in half an hour for large projects and hit refresh.")
              }
            })
            .catch(error => console.log(error));
        } else {
          alert("Upload assets before starting plan generation.")
        }
      }
      this.openEditPlanModal = () => {
        this.plan= Yaml.dump(this.context.aPlan);
        this.setState({editPlanModal:true})
      }
      this.closeEditPlanModal = () => {
        this.setState({editPlanModal:false})
      }
      this.kebabToggle = (servicename) => {
        if (this.state.showServiceKebab == servicename) {
          this.setState({showServiceKebab:"none"})
        } else {
          this.setState({showServiceKebab:servicename})
        }
      }
      this.deleteService = (serviceName) => {
        delete this.context.aPlan.spec.inputs.services[serviceName];
        this.setState({showServiceKebab:"none"});
        this.updatePlan();
      };
      this.plan={};
      this.updatePlan = () => {
        var url = '/api/v1/applications/'+this.context.aName+"/plan";
        var formdata = new FormData();
        formdata.append("plan",Yaml.dump(this.context.aPlan));
        fetch(url, {
          method: 'PUT',
          body: formdata 
          }).then(success => {
            this.plan= Yaml.dump(this.context.aPlan);
            console.log("Uploaded file")
          })
          .catch(error => console.log(error));
          this.context.updateApp();
      }
      this.showServiceOption = (option) => {
        this.setState({showServiceOption: option});
      };
      this.closeServiceOption = () => {
        this.setState({showServiceOption: ""});
      };
      this.handleServiceOptionChange = (serviceName, option) => {
        var oldoption = this.context.aPlan.spec.inputs.services[serviceName][0]
        this.context.aPlan.spec.inputs.services[serviceName][0] = this.context.aPlan.spec.inputs.services[serviceName][option]
        this.context.aPlan.spec.inputs.services[serviceName][option] = oldoption
        this.setState({showServiceOption: ""});
        this.updatePlan();
      };
    }

    componentDidMount() {
      setInterval(this.refresh, 30000);
    }
  
    render() {
      const { showServiceOption, showServiceKebab, editPlanModal } = this.state;

        return (
          <ApplicationContext.Consumer>
          {({aName, aPlan, aStatus, changeApp}) => ( 
              <PageSection>
                <Toolbar>
                  <ToolbarContent>
                    <ToolbarItem>
                      <Button variant="primary" onClick={() => this.generatePlan(aName,aStatus)}>Generate Plan</Button>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button variant="primary" onClick={() => this.refresh(aName)}>Refresh</Button>
                    </ToolbarItem>
                    {this.context.aPlan &&
                    <ToolbarItem>
                      <Button variant="primary" onClick={this.openEditPlanModal}>View Plan</Button>
                      <Modal
                        isOpen={editPlanModal}
                        variant={ModalVariant.small}
                        showClose={true}
                        onClose={this.closeEditPlanModal}
                        aria-describedby="wiz-modal-example-description"
                        aria-labelledby="wiz-modal-example-title"
                      >
                        <TextContent><TextArea value={Yaml.dump(aPlan)} rows={100}/></TextContent>
                      </Modal>
                    </ToolbarItem>
                    }
                  </ToolbarContent>
                </Toolbar>
                {this.context.aPlan && this.context.aPlan.spec && this.context.aPlan.spec.inputs &&
                 <PageSection>
                   <TextContent><Text component={TextVariants.h2}>Services</Text></TextContent>
                  {Object.values(aPlan.spec.inputs.services).map((service, id) => (
                   <Card key={Object.keys(aPlan.spec.inputs.services)[id]}>
                     <CardHeader>
                      <CardActions>
                        <Dropdown
                          toggle={<KebabToggle onToggle={() => {this.kebabToggle(Object.keys(aPlan.spec.inputs.services)[id])}} />}
                          isOpen={(Object.keys(aPlan.spec.inputs.services)[id])==showServiceKebab}
                          isPlain
                          dropdownItems={[<DropdownItem key="link" onClick={() => {this.deleteService(Object.keys(aPlan.spec.inputs.services)[id])}}>Delete</DropdownItem>]}
                          position={'right'}
                        />
                      </CardActions>
                    <CardTitle>{Object.keys(aPlan.spec.inputs.services)[id]}</CardTitle>
                    </CardHeader>
                  <PageSection key={Object.keys(aPlan.spec.inputs.services)[id]}>
                    <Gallery hasGutter>
                      {Object.values(service).map((serviceoption, optionid) => (
                        <PageSection key={serviceoption.serviceName+"_"+optionid}>
                        <React.Fragment>
                          <Card isHoverable key={serviceoption.serviceName+"_"+optionid} >
                            <Modal
                              isOpen={(serviceoption.serviceName+"_"+optionid)==showServiceOption}
                              variant={ModalVariant.small}
                              showClose={true}
                              onClose={this.closeServiceOption}
                              aria-describedby="wiz-modal-example-description"
                              aria-labelledby="wiz-modal-example-title"
                            >
                              <TextContent><TextArea value={Yaml.dump(serviceoption)} rows={17} /></TextContent>
                            </Modal>
                            <CardBody>
                            <Radio
                              isChecked={optionid==0}
                              name={serviceoption.serviceName}
                              onChange={() => this.handleServiceOptionChange(serviceoption.serviceName,optionid)}
                              id={serviceoption.serviceName+"_"+optionid}
                              value={serviceoption.serviceName+"_"+optionid}
                              aria-label={serviceoption.serviceName}
                            />
                            <TextContent>
                              <Text component={TextVariants.h3} onClick={() => this.showServiceOption(serviceoption.serviceName+"_"+optionid)} style={{textAlign: "center"}}>{serviceoption.translationType}</Text>
                            </TextContent>
                            <TextContent><Text component={TextVariants.p} style={{textAlign: "center"}}>{serviceoption.containerBuildType}</Text></TextContent>
                            </CardBody>
                          </Card>
                        </React.Fragment>
                        </PageSection>
                      ))}
                      </Gallery>
                    </PageSection>
                    </Card>
                  ))}
                </PageSection>
                }
              </PageSection>
          )}
          </ApplicationContext.Consumer>
        );
    }
  }
  PlanTab.contextType = ApplicationContext

  export { PlanTab };