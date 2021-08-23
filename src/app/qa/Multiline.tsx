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
import { TextArea, TextContent } from '@patternfly/react-core';

type IMultilineProps = IQAComponentProps;

function Multiline(props: IMultilineProps): JSX.Element {
    const onChange = (value: string): void => {
        props.setResolvedProblem({ ...props.problem, answer: value });
    };
    return (
        <div>
            <TextContent>{props.problem.description}</TextContent>
            <TextArea value={props.problem.answer as string} onChange={onChange} aria-label="multiline input" />
            {props.problem.hints?.length && <i>[Hint: {props.problem.hints}]</i>}
        </div>
    );
}

export { Multiline };
