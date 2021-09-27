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

import * as React from 'react';
import { IMetadata, IPlan } from './types';

function newPlan(): IPlan {
    return {
        apiVersion: '',
        kind: '',
        metadata: { name: '' },
    };
}

function validatePlan(plan: IPlan): void {
    // TODO: better plan validation
    if (!('metadata' in plan)) throw new Error('the plan is missing metadata');
}

function accessibleRouteChangeHandler(): number {
    return window.setTimeout(() => {
        const mainContainer = document.getElementById('primary-app-container');
        if (mainContainer) mainContainer.focus();
    }, 50);
}

// copy returns a copy of the object.
// This will invoke all getters and setters configured on the object.
const copy = <T>(x: T): T => Object.assign({}, x);

// a custom hook for setting the page title
function useDocumentTitle(title: string): void {
    React.useEffect(() => {
        const originalTitle = document.title;
        document.title = title;
        return () => {
            document.title = originalTitle;
        };
    }, [title]);
}

function sortByTimeStamp<T extends IMetadata>(xs: Array<T>): Array<T> {
    return xs.slice().sort((a: IMetadata, b: IMetadata) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA > timeB ? -1 : 1;
    });
}

export { newPlan, validatePlan, accessibleRouteChangeHandler, copy, useDocumentTitle, sortByTimeStamp };
