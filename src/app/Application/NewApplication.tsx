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
    Modal, 
    Button, 
    Form, 
    FormGroup,
    ModalVariant,
    TextInput,
    ActionGroup
} from '@patternfly/react-core';

class NewApplication extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isModalOpen: false,
      aName: "new",
    };
    this.openApplicationModal = () => {
      this.setState({ isModalOpen : true });
    };
    this.closeApplicationModal = () => {
      this.setState({ isModalOpen : false });
    };
    this.handleNameChange = aName => {
      name = aName.replace(/[^a-zA-Z0-9]/gi, "").toLowerCase();
      this.setState({ aName: name });
    };
    this.createNewApplication = (e) => {
      e.preventDefault();
      var formdata = new FormData();
      formdata.append("name", this.state.aName);
      fetch('/api/v1/applications', 
        {
          method: 'POST',
          body: formdata,
        }
      )
      .then((res) => {
        if(res.status == 400) {
          alert("Error while creating application.")
        } else {
          this.props.update()
          //window.location.reload(false);
        }
      })
      .catch(console.log);
      this.closeApplicationModal();
    };
  }

  render() {
    const { isModalOpen, aName } = this.state;

    return (
      <React.Fragment>
        <Button variant="primary" onClick={this.openApplicationModal}>
          New Application
        </Button>
        <Modal
          isOpen={isModalOpen}
          variant={ModalVariant.small}
          showClose={true}
          onClose={this.closeApplicationModal}
          aria-describedby="wiz-modal-example-description"
          aria-labelledby="wiz-modal-example-title"
        >
          <Form isHorizontal onSubmit={this.createNewApplication}>
            <FormGroup label="Name" isRequired fieldId="horizontal-form-name" helperText="Enter name of application (only lowecase, no spaces)">
            <TextInput
                value={aName}
                isRequired
                type="text"
                id="aName"
                aria-describedby="horizontal-form-name-helper"
                name="aName"
                onChange={this.handleNameChange}
                aria-label="Name"
            />
            </FormGroup>
            <ActionGroup>
              <Button variant="primary" type="submit">Create Application</Button>
            </ActionGroup>
          </Form>
        </Modal>
      </React.Fragment>
    );
  }
}

export { NewApplication };
