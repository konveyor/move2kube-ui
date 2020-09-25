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
  FileUpload, 
  Form, 
  FormGroup, 
  PageSection,
  ToolbarItem,
  Button,
  Modal,
  ModalVariant,
  Gallery,
  Card,
  CardBody,
  CardActions,
  Text,
  TextContent,
  TextVariants,
  CardHeader,
  ToolbarContent,
  Toolbar
} from '@patternfly/react-core';
import { ApplicationContext } from "./ApplicationContext"
import { CloseIcon } from '@patternfly/react-icons'



class ApplicationAssetUpload extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: null, filename: '' , isLoading: false, isRejected: false, update: props.update };
        this.handleFileChange = (value, filename, event) => {
        this.setState({ value, filename, isRejected: false });
        };
        this.handleFileReadStarted = fileHandle => this.setState({ isLoading: true });
        this.handleFileReadFinished = fileHandle => this.setState({ isLoading: false });

        this.update = props.update;

        this.uploadFile = (e, aName) => {
            var url = '/api/v1/applications/'+aName+"/assets";
            var formdata = new FormData();
            formdata.append("file",this.state.value);
            fetch(url, {
                method: 'POST',
                body: formdata 
            }).then(res => {
                if (res.status >= 200 && res.status <300) {
                    this.update();
                    console.log("Uploaded file")                
                } else if (res.status == 410) {
                    alert("Unable to upload/process file. Try using simpler compression systems.");
                    console.log(res);
                } else {
                    alert("If the file size is huge, try removing large files, which are not needed.\n If network is the problem, you can use the command line tool to accomplish the translation. Check out ibm.biz/move2kube-release");
                    console.log(res);
                }
            })
            .catch(error => {
                if (error) {
                    alert("Unable to upload/process file. Try using simpler compression systems.\n If the file size is huge, try removing large files, which are not needed.\n If network is the problem, you can use the command line tool to accomplish the translation. Check out ibm.biz/move2kube-release");
                    console.log(error);
                }
            });
            e.preventDefault();
        };
    }

    componentDidMount() {
        setInterval(this.update, 30000);
      }

    render() {
        const { value, filename, isLoading, isRejected } = this.state;
        return (
        <ApplicationContext.Consumer>
        {({aName}) => ( 
            <Form onSubmit={(e) => this.uploadFile(e,aName)}>
            <FormGroup
                fieldId="zip-file-upload"
                helperText="Upload a zip file"
                helperTextInvalid="Must be a ZIP file"
                validated={isRejected ? 'error' : 'default'}
            >
                <FileUpload
                id="zip-file-upload"
                value={value}
                filename={filename}
                onChange={this.handleFileChange}
                onReadStarted={this.handleFileReadStarted}
                onReadFinished={this.handleFileReadFinished}
                isLoading={isLoading}
                dropzoneProps={{
                    accept: '.zip,.tar,.tar.gz,.tgz',
                    onDropRejected: this.handleFileRejected
                }}
                validated={isRejected ? 'error' : 'default'}
                />
            </FormGroup>
            <Button variant="secondary" type="submit">Upload Asset</Button>
            </Form>
        )}
        </ApplicationContext.Consumer>
        );
    }
}

class AssetsTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isUploadAssetModalOpen: false,
            isCollectModalOpen: false,
            assets: []
        };
        this.update = () => {
            fetch('/api/v1/applications/'+this.context.aName+"/assets", 
            {
                headers: {
                'Content-Type': 'application/json'
                }
            }
            )
            .then(res => res.json())
            .then((assets) => {
                this.setState({ assets: assets },this.context.updateApp)
            })
            .catch(console.log)
        }
        this.update = this.update.bind(this);
        this.openAssetUploadModal = () => {
            this.setState({ isUploadAssetModalOpen : true });
        };
        this.closeAssetUploadModal = () => {
            this.setState({ isUploadAssetModalOpen : false });
        };
        this.openCollectModal = () => {
            this.setState({ isCollectModalOpen : true });
        };
        this.closeCollectModal = () => {
            this.setState({ isCollectModalOpen : false });
        };
        this.delete = (asset) => {
            fetch('/api/v1/applications/'+this.context.aName+"/assets/"+asset, 
            {
                method: "DELETE",
                headers: {
                'Content-Type': 'application/json'
                }
            }
            )
            .then((res) => {
                if(res.status > 300) {
                    alert("Error while trying to delete asset.");
                  } else {
                    this.update();
                  }
            })
            .catch(console.log);
        };
    }

    componentDidMount() {
        this.update();
    }

    render() {
        const { isCollectModalOpen, isUploadAssetModalOpen, assets } = this.state;

        return (
            <ApplicationContext.Consumer>
            {({aName}) => ( 
                <>
                    <PageSection>
                        <Toolbar>
                        <ToolbarContent>
                            <ToolbarItem>
                            <Button variant="primary" onClick={this.openAssetUploadModal}>Upload Asset</Button>
                                <Modal
                                isOpen={isUploadAssetModalOpen}
                                variant={ModalVariant.small}
                                showClose={true}
                                onClose={this.closeAssetUploadModal}
                                aria-describedby="wiz-modal-example-description"
                                aria-labelledby="wiz-modal-example-title"
                                >
                                <ApplicationAssetUpload update={this.update}></ApplicationAssetUpload>
                                </Modal>
                            </ToolbarItem>
                            <ToolbarItem>
                            <Button variant="primary" onClick={this.openCollectModal}>Collect Source/Target Artifacts</Button>
                                <Modal
                                isOpen={isCollectModalOpen}
                                variant={ModalVariant.small}
                                showClose={true}
                                onClose={this.closeCollectModal}
                                aria-describedby="wiz-modal-example-description"
                                aria-labelledby="wiz-modal-example-title"
                                >
                                    <TextContent>
                                        <Text component={TextVariants.h1} style={{textAlign: "center"}}>For collecting data, download the <a href="http://ibm.biz/move2kube-release" target="_blank">move2kube command line tool</a> and run 'move2kube collect', and zip the results and upload here.</Text>
                                    </TextContent>
                                </Modal>
                            </ToolbarItem>
                        </ToolbarContent>
                        </Toolbar>
                    </PageSection>
                    <Gallery hasGutter>
                        {assets.map((asset, assetid) => (
                            <PageSection key={asset}>
                            <React.Fragment>
                                <Card isHoverable key={asset}>
                                    <CardHeader><CardActions><CloseIcon onClick={() => this.delete(asset)}/></CardActions></CardHeader>
                                    <CardBody>
                                        <TextContent>
                                            <Text component={TextVariants.h1} style={{textAlign: "center"}}>{asset}</Text>
                                            <a href={'/api/v1/applications/'+aName+'/assets/'+asset} target="_blank"> <Text component={TextVariants.h3} style={{textAlign: "center"}}>Download</Text></a>
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
AssetsTab.contextType = ApplicationContext

export { AssetsTab };