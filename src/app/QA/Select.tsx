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

interface ISelectProps {
    problem: ProblemT;
    setResolvedProblem: (x: ProblemT) => void;
}

interface ISelectState {
    problem: ProblemT;
}

class Select extends React.Component<ISelectProps, ISelectState> {
    constructor(props: ISelectProps) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        const problem = copy(props.problem);
        problem.solution.answer = problem.solution.default;
        props.setResolvedProblem(problem);
        this.state = { problem };
    }

    handleChange(checked: boolean, event: React.FormEvent<HTMLInputElement>): void {
        if (!checked) return;
        const problem = copy(this.state.problem);
        problem.solution.answer = [(event.target as HTMLInputElement).value];
        this.props.setResolvedProblem(problem);
        this.setState({ problem });
    }

    render(): JSX.Element {
        const { problem } = this.state;

        return (
            <div>
                <span id={problem.id}>{problem.description}</span>
                {problem.solution.options.map((option: string, idx: number) => (
                    <Radio
                        aria-label={option}
                        id={`${problem.id}-${option}-${idx}`}
                        key={`${problem.id}-${option}-${idx}`}
                        name={problem.id}
                        label={option}
                        value={option}
                        onChange={this.handleChange}
                        isChecked={problem.solution.answer[0] === option}
                    />
                ))}
                <i>[Hint: {problem.context}]</i>
            </div>
        );
    }
}

export { Select };
