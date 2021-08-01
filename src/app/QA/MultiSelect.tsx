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
import { Checkbox } from '@patternfly/react-core';
import { ProblemT } from './Types';
import { copy } from '@app/utils/utils';

interface IMultiSelectProps {
    problem: ProblemT;
    setResolvedProblem: (x: ProblemT) => void;
}

interface IMultiSelectState {
    problem: ProblemT;
}

class MultiSelect extends React.Component<IMultiSelectProps, IMultiSelectState> {
    constructor(props: IMultiSelectProps) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        const problem = copy(props.problem);
        problem.answer = problem.default || [];
        props.setResolvedProblem(problem);
        this.state = { problem };
    }

    handleChange(checked: boolean, event: React.FormEvent<HTMLInputElement>): void {
        const target = event.target as HTMLInputElement;
        const problem = copy(this.state.problem);
        const option = target.name;
        if (checked) {
            if (!(problem.answer as Array<string>).includes(option)) {
                (problem.answer as Array<string>).push(option);
            }
        } else {
            problem.answer = (problem.answer as Array<string>).filter((x: string) => x !== option);
        }
        this.props.setResolvedProblem(problem);
        this.setState({ problem });
    }

    render(): JSX.Element {
        const { problem } = this.state;

        return (
            <div>
                <span id={problem.id}>{problem.description}</span>
                {problem.options.map((option: string, idx: number) => (
                    <Checkbox
                        aria-label={option}
                        id={`${problem.id}-${option}-${idx}`}
                        key={`${problem.id}-${option}-${idx}`}
                        name={option}
                        label={option}
                        onChange={this.handleChange}
                        isChecked={(problem.answer as Array<string>).includes(option)}
                    />
                ))}
                {problem.hints && problem.hints.length > 0 && <i>[Hint: {problem.hints}]</i>}
            </div>
        );
    }
}

export { MultiSelect };
