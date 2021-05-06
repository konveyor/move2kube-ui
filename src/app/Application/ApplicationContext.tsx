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
import { IPlan, newPlan } from '@app/Application/Types';

interface IApplicationContext {
    aName: string;
    aStatus: Array<string>;
    aPlan: IPlan;
    isGuidedFlow: boolean;
    updateApp: () => void;
    changeApp: (appName: string) => void;
    setNewPlan: (plan: string) => void;
    selectServiceOption: (serviceName: string, optionIdx: number) => void;
    deleteServiceOption: (serviceName: string) => void;
}

const ApplicationContext: React.Context<IApplicationContext> = React.createContext<IApplicationContext>({
    aName: 'App1',
    aStatus: ['New'],
    aPlan: newPlan(),
    isGuidedFlow: false,
    updateApp: () => {
        /*By default does nothing*/
    },
    changeApp: () => {
        /*By default does nothing*/
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNewPlan: (plan: string) => {
        /*By default does nothing*/
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectServiceOption: (serviceName: string, optionIdx: number) => {
        /*By default does nothing*/
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deleteServiceOption: (serviceName: string) => {
        /*By default does nothing*/
    },
});
ApplicationContext.displayName = 'ApplicationContext';

export { ApplicationContext, IApplicationContext };
