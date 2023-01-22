/*
Copyright IBM Corporation 2023

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

import { FunctionComponent } from "react";
import { Hints } from './Hints';
import { IQASubComponentProps } from './types';
import { TextContent, TextInput } from '@patternfly/react-core';

export const Input: FunctionComponent<IQASubComponentProps> = ({ isDisabled, question, setAnswer }) => {
    return (
        <div>
            <TextContent>{question.description}</TextContent>
            <TextInput
                isDisabled={isDisabled}
                type="text"
                aria-label="answer input"
                value={question.answer as string}
                onChange={value => setAnswer(value)}
            />
            {question.hints?.length && <Hints hints={question.hints} />}
        </div>
    );
};
