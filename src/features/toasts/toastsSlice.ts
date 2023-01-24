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

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

export interface IToast {
    id: number;
    variant: ToastVariant;
    message: string;
}

export interface IToastsState {
    nextId: number;
    toasts: Array<IToast>;
}

const initialState: IToastsState = {
    nextId: 0,
    toasts: [],
};

export const toastsSlice = createSlice({
    name: 'toasts',
    initialState,
    reducers: {
        createToast: (state, action: PayloadAction<IToast>) => {
            state.toasts.push({ ...action.payload, id: state.nextId });
            state.nextId++;
        },
        deleteToast: (state, action: PayloadAction<number>) => {
            state.toasts = state.toasts.filter(t => t.id !== action.payload);
        },
        deleteAllToasts: (state) => {
            state.toasts = [];
        },
    },
});

export const selectToasts = (state: RootState): Array<IToast> => state.toasts.toasts;

export const { createToast, deleteToast, deleteAllToasts } = toastsSlice.actions;

export default toastsSlice.reducer;
