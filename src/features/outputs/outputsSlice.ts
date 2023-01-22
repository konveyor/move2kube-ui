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
import { IQAStep, IQuestion } from './qa/types';

export interface TransformationStatus {
    outputId: string;
    projectId: string;
    workspaceId: string;
    steps: Array<IQAStep>;
    error?: string;
}

export interface OutputsState {
    transformationStatuses: { [k: string]: TransformationStatus },
    currentStatusId: string;
}

const initialState: OutputsState = {
    transformationStatuses: {},
    currentStatusId: '',
};

export const outputsSlice = createSlice({
    name: 'outputs',
    initialState,
    reducers: {
        setCurrentStatusId: (state, action: PayloadAction<string>) => {
            state.currentStatusId = action.payload;
        },
        createStatus: (state, action: PayloadAction<{ workspaceId: string, projectId: string, outputId: string }>) => {
            if (!(action.payload.outputId in state.transformationStatuses)) {
                state.transformationStatuses[action.payload.outputId] = { ...action.payload, steps: [] };
            }
            state.currentStatusId = action.payload.outputId;
        },
        addQAStep: (state, action: PayloadAction<{ id: string, step: IQAStep }>) => {
            if (action.payload.id in state.transformationStatuses) {
                const status = state.transformationStatuses[action.payload.id];
                status.steps.push(action.payload.step);
            }
        },
        updateQAStep: (state, action: PayloadAction<{ id: string, stepIdx: number, question: IQuestion }>) => {
            const { id, stepIdx, question } = action.payload;
            if (id in state.transformationStatuses) {
                const status = state.transformationStatuses[id];
                if (stepIdx >= 0 && stepIdx < status.steps.length) {
                    status.steps[stepIdx].question = question;
                }
            }
        },
        setError: (state, action: PayloadAction<{ id: string, error: string }>) => {
            if (action.payload.id in state.transformationStatuses) state.transformationStatuses[action.payload.id].error = action.payload.error;
        },
        deleteStatus: (state, action: PayloadAction<string>) => {
            delete state.transformationStatuses[action.payload];
        },
        deleteStatusesWithErrors: (state) => {
            const noErrorKeys = Object.keys(state.transformationStatuses).filter(k => !state.transformationStatuses[k].error);
            state.transformationStatuses = Object.fromEntries(noErrorKeys.map(k => [k, state.transformationStatuses[k]]));
        },
    }
});

export const { setCurrentStatusId, createStatus, addQAStep, updateQAStep, setError, deleteStatus, deleteStatusesWithErrors } = outputsSlice.actions;
export const selectTransformationStatus = (id: string) => (state: RootState): (TransformationStatus | undefined) => state.outputs.transformationStatuses[id];
export const selectTransformationStatuses = (state: RootState): ({ [k: string]: TransformationStatus }) => state.outputs.transformationStatuses;
export const selectCurrentStatusId = (state: RootState): string => state.outputs.currentStatusId;
export const selectCurrentStatus = (state: RootState): (TransformationStatus | undefined) => state.outputs.transformationStatuses[state.outputs.currentStatusId];

export default outputsSlice.reducer;
