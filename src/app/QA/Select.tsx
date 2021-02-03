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

class Select extends React.Component {
  constructor(props) {
    super(props);

    var problem = props.problem
    problem.solution.answer = problem.solution.default
    props.changeSolution(problem);

    this.state = {
      problem: props.problem
    };

    this.handleChange = (checked, event) => {
      const target = event.target;
      var problem = this.state.problem
      if (target.checked) {
        problem.solution.answer = [target.id];
      } 
      this.props.changeSolution(problem);
      this.setState({problem:problem})
    }

  }

  render() {
    const { problem } = this.state;

    return (
      <div>
        <span id={problem.id}>
          {problem.description}
        </span>
        <React.Fragment>
          {problem.solution.options.map((option, optionid) => (
            <Radio label={option} aria-label={option} name={option} key={problem.id+option+optionid} id={option} onChange={this.handleChange} isChecked={problem.solution.answer.indexOf(option) != -1} />
          ))}
        </React.Fragment>
        <text>[Hint: {problem.context}]</text>
      </div>
    );
  }
}

export { Select }