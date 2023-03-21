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

import { createSlice } from '@reduxjs/toolkit';
import { PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export interface PlanProgressStatus {
    id: string;
    files: number;
    transformers: number;
}

export interface InputsState {
    planProgressStatuses: { [k: string]: PlanProgressStatus },
}

const initialState: InputsState = {
    planProgressStatuses: {},
};

export const getId = (workspaceId: string, projectId: string): string => `${workspaceId}-${projectId}`;

export const planSlice = createSlice({
    name: 'plan',
    initialState,
    reducers: {
        setPlanProgressStatus: (state, action: PayloadAction<{ workspaceId: string, projectId: string, files: number, transformers: number }>) => {
            const id = getId(action.payload.workspaceId, action.payload.projectId);
            state.planProgressStatuses[id] = {
                id,
                files: action.payload.files,
                transformers: action.payload.transformers,
            };
        },
        deletePlanProgressStatus: (state, action: PayloadAction<{ workspaceId: string, projectId: string }>) => {
            delete state.planProgressStatuses[getId(action.payload.workspaceId, action.payload.projectId)];
        },
    }
});

export const { setPlanProgressStatus, deletePlanProgressStatus } = planSlice.actions;
export const selectPlanProgressStatus = (wid: string, pid: string) => (state: RootState): (PlanProgressStatus | undefined) => state.plan.planProgressStatuses[getId(wid, pid)];

export default planSlice.reducer;
