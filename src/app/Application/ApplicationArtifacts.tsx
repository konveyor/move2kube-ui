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
  Card,
  Gallery,
  Modal,
  ModalVariant,
  CardBody,
  TextContent,
  Text,
  TextVariants,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  CardHeader,
  CardActions
} from '@patternfly/react-core';
import { ApplicationContext } from "./ApplicationContext"
import { QAWizard } from "../QA/Wizard"
import { CloseIcon } from '@patternfly/react-icons'

class ArtifactsTab extends React.Component {
    
    constructor(props) {
        super(props);
        this.generate = () => {
            if (this.context.aStatus.includes("plan")) {
                this.setState({qaartifacts: "new"})
            } else {
                alert("Generate plan before starting artifact generation.")
            }
        }
        this.close = () => {
            this.setState({qaartifacts: ""})
        }
        this.close = this.close.bind(this);
        this.state = {
            qaartifacts: "",
            artifacts: []
        };
        this.update = () => {
            fetch('/api/v1/applications/'+this.context.aName+"/targetartifacts", 
            {
                headers: {
                'Content-Type': 'application/json'
                }
            }
            )
            .then(res => res.json())
            .then((artifacts) => {
                this.setState({ artifacts: artifacts })
            })
            .catch(console.log)
            this.context.updateApp();
        }
        this.update = this.update.bind(this);
        this.delete = (artifact) => {
            fetch('/api/v1/applications/'+this.context.aName+"/targetartifacts/"+artifact, 
            {
                method: "DELETE",
                headers: {
                'Content-Type': 'application/json'
                }
            }
            )
            .then((res) => {
                if(res.status > 300) {
                    alert("Error while trying to delete artifact.");
                  } else {
                    this.update();
                  }
            })
            .catch(console.log);
        };
        this.get = (artifacts) => {
            fetch('/api/v1/applications/'+this.context.aName+"/targetartifacts/"+artifacts, 
            {
                method: "GET",
                headers: {
                'Content-Type': 'application/json'
                }
            }
            )
            .then((res) => {
                if(res.status >300 ) {
                    alert("There was an error during translation. Please regenerate.");
                  } else if (res.status == 204 ) {
                    this.setState({qaartifacts: artifacts})
                  } else {
                    const filename = res.headers.get('content-disposition')
                    .split(';')
                    .find(n => n.includes('filename='))
                    .replace('filename=', '')
                    .trim();
                    res.blob()
                    .then( blob => {
                        var a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.setAttribute("download", filename);
                        a.click();
                      });
                  }
            })
            .catch(console.log);
        };
    }

    componentDidMount() {
        this.update();
    }

    render() {
        const { artifacts, qaartifacts } = this.state;

        return (
            <ApplicationContext.Consumer>
            {({aName, aPlan, changeApp}) => ( 
                <>
                    <PageSection>
                        <Toolbar>
                            <ToolbarContent>
                                <ToolbarItem>
                                    <Button variant="primary" onClick={() => this.generate()}>Translate</Button>
                                </ToolbarItem>
                            </ToolbarContent>
                        </Toolbar>
                    </PageSection>
                    <Modal
                        isOpen={ qaartifacts != "" }
                        variant={ModalVariant.large}
                        showClose={true}
                        aria-describedby="QADialog"
                        aria-labelledby="QADialog"
                    >
                        <QAWizard aName={aName} aArtifactsName={qaartifacts} aPlan={aPlan} close={this.close} update={this.update} disabled={false}/>
                    </Modal>
                    <Gallery hasGutter>
                        {artifacts.map((artifact, artifactid) => (
                            <PageSection key={artifact}>
                            <React.Fragment>
                                <Card isHoverable key={artifact}>
                                    <CardHeader><CardActions><CloseIcon onClick={() => this.delete(artifact)}/></CardActions></CardHeader>
                                    <CardBody>
                                        <TextContent style={{textAlign: "center"}}>
                                            <Text component={TextVariants.h3} style={{textAlign: "center"}}>{artifact}</Text>
                                            <Button variant="secondary" onClick={() => this.get(artifact)}>Get</Button>
                                        </TextContent>
                                    </CardBody>
                                </Card>
                            </React.Fragment>
                            </PageSection>
                        ))}
                    </Gallery>
            </>
            )}
            </ApplicationContext.Consumer>
        );
    }
}
ArtifactsTab.contextType = ApplicationContext

export { ArtifactsTab }
  