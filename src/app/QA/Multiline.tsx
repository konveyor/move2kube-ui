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
import { TextArea } from '@patternfly/react-core';
import { ProblemT } from './Types';
import { copy } from '@app/utils/utils';

interface IMultilineProps {
    problem: ProblemT;
    setResolvedProblem: (x: ProblemT) => void;
}

interface IMultilineState {
    problem: ProblemT;
}

class Multiline extends React.Component<IMultilineProps, IMultilineState> {
    constructor(props: IMultilineProps) {
        super(props);
        this.handleTextAreaChange = this.handleTextAreaChange.bind(this);
        const problem = copy(props.problem);
        problem.solution.answer = [problem.solution.default ? problem.solution.default[0] : ''];
        props.setResolvedProblem(problem);
        this.state = { problem };
    }

    handleTextAreaChange(value: string): void {
        const problem = copy(this.state.problem);
        problem.solution.answer = [value];
        this.props.setResolvedProblem(problem);
        this.setState({ problem });
    }

    render(): JSX.Element {
        const { problem } = this.state;

        return (
            <div>
                <span id={problem.id}>{problem.description}</span>
                <TextArea
                    value={problem.solution.answer[0]}
                    onChange={this.handleTextAreaChange}
                    aria-label="textarea"
                />
                <i>
                    [Hint: {problem.context}] (Default: {problem.solution.default})
                </i>
            </div>
        );
    }
}

export { Multiline };
