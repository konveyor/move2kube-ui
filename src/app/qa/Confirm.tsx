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
import { Hints } from './Hints';
import { QAContext } from './QAContext';
import { IQAComponentProps } from './QAWizard';
import { Radio, TextContent } from '@patternfly/react-core';

function Confirm(props: IQAComponentProps): JSX.Element {
    const { problems, setResolvedProblem } = useContext(QAContext);
    const problem = problems[props.idx];
    const onChange = (checked: boolean, event: React.FormEvent<HTMLInputElement>): void => {
        if (!checked) return;
        setResolvedProblem(props.idx, { ...problem, answer: (event.target as HTMLInputElement).value === 'true' });
    };
    return (
        <div>
            <TextContent>{problem.description}</TextContent>
            <Radio
                isDisabled={props.idx !== problems.length - 1}
                aria-label="Yes"
                id={`${problem.id}-yes`}
                name={problem.id}
                label="Yes"
                value="true"
                onChange={onChange}
                isChecked={problem.answer as boolean}
            />
            <Radio
                isDisabled={props.idx !== problems.length - 1}
                aria-label="No"
                id={`${problem.id}-no`}
                name={problem.id}
                label="No"
                value="false"
                onChange={onChange}
                isChecked={!(problem.answer as boolean)}
            />
            {problem.hints?.length && <Hints hints={problem.hints} />}
        </div>
    );
}

export { Confirm };
