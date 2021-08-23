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
import { Radio, TextContent } from '@patternfly/react-core';

type IConfirmProps = IQAComponentProps;

function Confirm(props: IConfirmProps): JSX.Element {
    const onChange = (checked: boolean, event: React.FormEvent<HTMLInputElement>): void => {
        if (!checked) return;
        const problem = copy(props.problem);
        problem.answer = (event.target as HTMLInputElement).value === 'true';
        props.setResolvedProblem(problem);
    };
    return (
        <div>
            <TextContent>{props.problem.description}</TextContent>
            <Radio
                aria-label="Yes"
                id={`${props.problem.id}-yes`}
                name={props.problem.id}
                label="Yes"
                value="true"
                onChange={onChange}
                isChecked={props.problem.answer as boolean}
            />
            <Radio
                aria-label="No"
                id={`${props.problem.id}-no`}
                name={props.problem.id}
                label="No"
                value="false"
                onChange={onChange}
                isChecked={!(props.problem.answer as boolean)}
            />
            {props.problem.hints?.length && <i>[Hint: {props.problem.hints}]</i>}
        </div>
    );
}

export { Confirm };
