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

export interface UploadStatus {
    id: string;
    name: string;
    percent: number;
    error?: string;
}

export interface InputsState {
    uploadStatuses: { [k: string]: UploadStatus },
}

const initialState: InputsState = {
    uploadStatuses: {},
};

export const inputsSlice = createSlice({
    name: 'inputs',
    initialState,
    reducers: {
        createStatus: (state, action: PayloadAction<{ id: string, name: string }>) => {
            state.uploadStatuses[action.payload.id] = { ...action.payload, percent: 0 };
        },
        setProgress: (state, action: PayloadAction<{ id: string, percent: number }>) => {
            if (action.payload.id in state.uploadStatuses) state.uploadStatuses[action.payload.id].percent = action.payload.percent;
        },
        setError: (state, action: PayloadAction<{ id: string, error: string }>) => {
            if (action.payload.id in state.uploadStatuses) state.uploadStatuses[action.payload.id].error = action.payload.error;
        },
        deleteStatus: (state, action: PayloadAction<string>) => {
            delete state.uploadStatuses[action.payload];
        },
        deleteStatusesWithErrors: (state) => {
            const noErrorKeys = Object.keys(state.uploadStatuses).filter(k => !state.uploadStatuses[k].error);
            state.uploadStatuses = Object.fromEntries(noErrorKeys.map(k => [k, state.uploadStatuses[k]]));
        },
    }
});

export const { createStatus, setProgress, setError, deleteStatus, deleteStatusesWithErrors } = inputsSlice.actions;
export const setSuccess = (id: string) => setProgress({ id, percent: 100 });
export const selectUploadStatus = (id: string) => (state: RootState): (UploadStatus | undefined) => state.inputs.uploadStatuses[id];
export const selectUploadStatuses = (state: RootState): ({ [k: string]: UploadStatus }) => state.inputs.uploadStatuses;

export default inputsSlice.reducer;
