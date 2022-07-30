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
import { IApplicationContext } from './types';

const ApplicationContext: React.Context<IApplicationContext> = React.createContext<IApplicationContext>({
    isGuidedFlow: false,
    setGuidedFlow: async () => {
        /*By default does nothing*/
    },

    currentWorkspace: { id: '', timestamp: '' },
    switchWorkspace: async () => {
        /*By default does nothing*/
    },

    workspaces: {},
    listWorkspaces: async () => [],
    createWorkspace: async () => ({ id: '', timestamp: '' }),
    readWorkspace: async () => ({ id: '', timestamp: '' }),
    updateWorkspace: async () => {
        /*By default does nothing*/
    },
    deleteWorkspace: async () => {
        /*By default does nothing*/
    },

    currentProject: { id: '', timestamp: '' },
    switchProject: async () => {
        /*By default does nothing*/
    },

    projects: {},
    listProjects: async () => [],
    createProject: async () => ({ id: '', timestamp: '' }),
    readProject: async () => ({ id: '', timestamp: '' }),
    updateProject: async () => {
        /*By default does nothing*/
    },
    deleteProject: async () => {
        /*By default does nothing*/
    },

    goToRoute: () => {
        /*By default does nothing*/
    },

    files: {},
    uploadFile: () => {
        /*By default does nothing*/
    },
    cancelUpload: () => {
        /*By default does nothing*/
    },

    workspaceFiles: {},
    uploadWorkspaceFile: () => {
        /*By default does nothing*/
    },
    cancelWorkspaceUpload: () => {
        /*By default does nothing*/
    },
});

ApplicationContext.displayName = 'ApplicationContext';

export { ApplicationContext };
