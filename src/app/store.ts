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

import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { supportApi } from '../features/support/supportApi';
import { workspacesApi } from '../features/workspaces/workspacesApi';
import { projectsApi } from '../features/projects/projectsApi';
import { projectInputsApi } from '../features/inputs/inputsApi';
import { projectOutputsApi } from '../features/outputs/outputsApi';
import { planApi } from '../features/plan/planApi';
import { loginApi } from '../features/login/loginApi';
import { setupListeners } from '@reduxjs/toolkit/query';
import inputsReducer from '../features/inputs/inputsSlice';
import outputsReducer from '../features/outputs/outputsSlice';

export const store = configureStore({
  reducer: {
    [supportApi.reducerPath]: supportApi.reducer,
    [workspacesApi.reducerPath]: workspacesApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [projectInputsApi.reducerPath]: projectInputsApi.reducer,
    [projectOutputsApi.reducerPath]: projectOutputsApi.reducer,
    [planApi.reducerPath]: planApi.reducer,
    [loginApi.reducerPath]: loginApi.reducer,
    inputs: inputsReducer,
    outputs: outputsReducer,
  },
  middleware: (getDef) =>
    getDef()
      .concat(supportApi.middleware)
      .concat(workspacesApi.middleware)
      .concat(projectsApi.middleware)
      .concat(projectInputsApi.middleware)
      .concat(projectOutputsApi.middleware)
      .concat(planApi.middleware)
      .concat(loginApi.middleware),
});

setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
