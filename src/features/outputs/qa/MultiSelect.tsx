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

import React, { FunctionComponent } from 'react';
import { Hints } from './Hints';
import { IQASubComponentProps } from './types';
import { Checkbox, TextContent } from '@patternfly/react-core';

export const MultiSelect: FunctionComponent<IQASubComponentProps> = ({ isDisabled, question, setAnswer }) => {
    isDisabled = isDisabled || false;
    const onChange = (checked: boolean, event: React.FormEvent<HTMLInputElement>): void => {
        const target = event.target as HTMLInputElement;
        const option = target.name;
        let answer = [...(question.answer as Array<string> || [])];
        if (checked) {
            if (!answer.includes(option)) answer.push(option);
        } else {
            answer = answer.filter((x: string) => x !== option);
        }
        setAnswer(answer);
    };
    return (
        <div>
            <TextContent>{question.description}</TextContent>
            {question.options?.map((option: string, idx: number) => (
                <Checkbox
                    isDisabled={isDisabled}
                    aria-label={option}
                    id={`${question.id}-${option}-${idx}`}
                    key={`${question.id}-${option}-${idx}`}
                    name={option}
                    label={option}
                    onChange={onChange}
                    isChecked={(question.answer as Array<string> | undefined)?.includes(option)}
                />
            ))}
            {question.hints?.length && <Hints hints={question.hints} />}
        </div>
    );
};
