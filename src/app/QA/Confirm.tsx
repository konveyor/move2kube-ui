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
import { ProblemT } from './Types';
import { copy } from '@app/utils/utils';

interface IConfirmProps {
    problem: ProblemT;
    setResolvedProblem: (x: ProblemT) => void;
}

interface IConfirmState {
    problem: ProblemT;
}

class Confirm extends React.Component<IConfirmProps, IConfirmState> {
    constructor(props: IConfirmProps) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        const problem = copy(props.problem);
        problem.solution.answer = problem.solution.default;
        props.setResolvedProblem(problem);
        this.state = { problem };
    }

    handleChange(checked: boolean): void {
        const problem = copy(this.state.problem);
        problem.solution.answer = [checked ? 'true' : 'false'];
        this.props.setResolvedProblem(problem);
        this.setState({ problem });
    }

    render(): JSX.Element {
        const { problem } = this.state;

        return (
            <div>
                <span id={problem.id}>{problem.description}</span>
                <Radio
                    aria-label={'Yes'}
                    id={`${problem.id}-yes`}
                    name={problem.id}
                    label="Yes"
                    value="true"
                    onChange={this.handleChange}
                    isChecked={this.state.problem.solution.answer[0] === 'true'}
                />
                <Radio
                    aria-label={'No'}
                    id={`${problem.id}-no`}
                    name={problem.id}
                    label="No"
                    value="false"
                    onChange={this.handleChange}
                    isChecked={this.state.problem.solution.answer[0] !== 'true'}
                />
                <i>[Hint: {problem.context}]</i>
            </div>
        );
    }
}

export { Confirm };
