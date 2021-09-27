/*
Copyright IBM Corporation 2021

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
import { IQAComponentProps } from '@app/qa/QAWizard';
import { Radio, TextContent } from '@patternfly/react-core';

type ISelectProps = IQAComponentProps;

function Select(props: ISelectProps): JSX.Element {
    const onChange = (checked: boolean, event: React.FormEvent<HTMLInputElement>): void => {
        if (!checked) return;
        props.setResolvedProblem({ ...props.problem, answer: (event.target as HTMLInputElement).value });
    };
    return (
        <div>
            <TextContent>{props.problem.description}</TextContent>
            {props.problem.options?.map((option: string, idx: number) => (
                <Radio
                    aria-label={option}
                    id={`${props.problem.id}-${option}-${idx}`}
                    key={`${props.problem.id}-${option}-${idx}`}
                    name={props.problem.id}
                    label={option}
                    value={option}
                    onChange={onChange}
                    isChecked={props.problem.answer === option}
                />
            ))}
            {props.problem.hints?.length && <i>[Hint: {props.problem.hints}]</i>}
        </div>
    );
}

export { Select };
