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
import { TextInput } from '@patternfly/react-core';
import { ProblemT } from './Types';
import { copy } from '@app/utils/utils';

interface IInputProps {
    problem: ProblemT;
    setResolvedProblem: (x: ProblemT) => void;
}

interface IInputState {
    problem: ProblemT;
}

class Input extends React.Component<IInputProps, IInputState> {
    constructor(props: IInputProps) {
        super(props);
        this.handleTextInputChange = this.handleTextInputChange.bind(this);
        const problem = copy(props.problem);
        problem.answer = problem.default || '';
        props.setResolvedProblem(problem);
        this.state = { problem };
    }

    handleTextInputChange(value: string): void {
        const problem = copy(this.state.problem);
        problem.answer = value;
        this.props.setResolvedProblem(problem);
        this.setState({ problem });
    }

    render(): JSX.Element {
        const { problem } = this.state;

        return (
            <div>
                <span id={problem.id}>{problem.description}</span>
                <TextInput
                    value={problem.answer}
                    type="text"
                    onChange={this.handleTextInputChange}
                    aria-label="text input example"
                />
                {problem.hints && problem.hints.length > 0 && <i>[Hint: {problem.hints}]</i>}
            </div>
        );
    }
}

export { Input };
