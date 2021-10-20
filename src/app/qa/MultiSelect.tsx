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

import React, { useContext } from 'react';
import { copy } from '@app/common/utils';
import { QAContext } from '@app/qa/QAContext';
import { IQAComponentProps } from '@app/qa/QAWizard';
import { Checkbox, TextContent } from '@patternfly/react-core';

type IMultiSelectProps = IQAComponentProps;

function MultiSelect(props: IMultiSelectProps): JSX.Element {
    const { problems, setResolvedProblem } = useContext(QAContext);
    const problem = problems[props.idx];
    const onChange = (checked: boolean, event: React.FormEvent<HTMLInputElement>): void => {
        console.log('inside onChange MultiSelect problem before', problem);
        const target = event.target as HTMLInputElement;
        const newProblem = copy(problem);
        const option = target.name;
        if (!newProblem.answer) return console.log('inside MultiSelect, the answer is falsy. newProblem', newProblem);
        if (checked) {
            if (!(newProblem.answer as Array<string>).includes(option)) {
                (newProblem.answer as Array<string>).push(option);
            }
        } else {
            newProblem.answer = (newProblem.answer as Array<string>).filter((x: string) => x !== option);
        }
        setResolvedProblem(props.idx, newProblem);
        console.log('inside onChange MultiSelect newProblem after', newProblem);
    };
    return (
        <div>
            <TextContent>{problem.description}</TextContent>
            {problem.options?.map((option: string, idx: number) => (
                <Checkbox
                    aria-label={option}
                    id={`${problem.id}-${option}-${idx}`}
                    key={`${problem.id}-${option}-${idx}`}
                    name={option}
                    label={option}
                    onChange={onChange}
                    isChecked={(problem.answer as Array<string> | undefined)?.includes(option)}
                />
            ))}
            {problem.hints?.length && <i>[Hint: {problem.hints}]</i>}
        </div>
    );
}

export { MultiSelect };
