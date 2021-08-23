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
import { copy } from '@app/common/utils';
import { IQAComponentProps } from '@app/qa/QAWizard';
import { Checkbox, TextContent } from '@patternfly/react-core';

type IMultiSelectProps = IQAComponentProps;

function MultiSelect(props: IMultiSelectProps): JSX.Element {
    const onChange = (checked: boolean, event: React.FormEvent<HTMLInputElement>): void => {
        console.log('inside onChange MultiSelect problem before', props.problem);
        const target = event.target as HTMLInputElement;
        const problem = copy(props.problem);
        const option = target.name;
        if (!problem.answer) return console.log('inside MultiSelect. problem', problem);
        if (checked) {
            if (!(problem.answer as Array<string>).includes(option)) {
                (problem.answer as Array<string>).push(option);
            }
        } else {
            problem.answer = (problem.answer as Array<string>).filter((x: string) => x !== option);
        }
        props.setResolvedProblem(problem);
        console.log('inside onChange MultiSelect problem after', problem);
    };
    return (
        <div>
            <TextContent>{props.problem.description}</TextContent>
            {props.problem.options?.map((option: string, idx: number) => (
                <Checkbox
                    aria-label={option}
                    id={`${props.problem.id}-${option}-${idx}`}
                    key={`${props.problem.id}-${option}-${idx}`}
                    name={option}
                    label={option}
                    onChange={onChange}
                    isChecked={(props.problem.answer as Array<string> | undefined)?.includes(option)}
                />
            ))}
            {props.problem.hints?.length && <i>[Hint: {props.problem.hints}]</i>}
        </div>
    );
}

export { MultiSelect };
