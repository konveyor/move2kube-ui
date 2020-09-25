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
import { Radio } from '@patternfly/react-core';

class Confirm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      problem: props.problem
    };
    this.handleChange = (_, event) => {
      const { value } = event.currentTarget;
      problem.solution.answer = [value];
      this.props.changeSolution(problem.solution.answer);
      this.setState({problem:problem})
    };
  }

  render() {
    const { problem } = this.state;

    return (
      <div>
      <span id={problem.id}>
        {problem.description}
      </span>
      <React.Fragment>
        <Radio
          isChecked={this.state.check1}
          name="true"
          onChange={this.handleChange}
          label="yes"
          id="yes"
          value="true"
        />
          <Radio
          isChecked={this.state.check1}
          name="false"
          onChange={this.handleChange}
          label="no"
          id="no"
          value="false"
        />
      </React.Fragment>
      </div>
    );
  }
}

export { Confirm }
