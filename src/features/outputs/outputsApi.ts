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

import { createApi, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { AppThunk } from "../../app/store";
import { API_BASE } from "../common/constants";
import { sleep } from "../common/utils";
import { addQAStep, selectCurrentStatus, setCurrentStatusId } from "./outputsSlice";
import { IQAStep, IQuestion } from "./qa/types";
import { Node, Edge } from 'reactflow';

const quesDefaults: { [id: string]: unknown } = {
    MultiSelect: [],
    Select: '',
    Input: '',
    Confirm: false,
    MultiLineInput: '',
    Password: '',
};

export const moveToNextQuestion = (): AppThunk<Promise<{ done: boolean }>> =>
    async (dispatch, getState) => {
        const state = getState();
        const currentStatus = selectCurrentStatus(state);
        if (!currentStatus) {
            return { done: true };
        }
        const wid = currentStatus.workspaceId;
        const pid = currentStatus.projectId;
        const outputId = currentStatus.outputId;
        if (currentStatus.steps.length > 0) {
            const prevQuestion: IQuestion = currentStatus.steps[currentStatus.steps.length - 1].question;
            const url = `${API_BASE}/workspaces/${wid}/projects/${pid}/outputs/${outputId}/problems/current/solution`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    solution: JSON.stringify(prevQuestion),
                }),
            });
            if (!res.ok) {
                throw new Error(`got an error status code while trying to post the solution: ${res.status} ${res.statusText}`);
            }
        }
        const url = `${API_BASE}/workspaces/${wid}/projects/${pid}/outputs/${outputId}/problems/current`;
        let res: Response | null = null;
        let attempt = 0;
        const max_attempts = 3;
        while (attempt < max_attempts && (!res || !res.ok)) {
            attempt++;
            res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            if (res.ok) {
                break;
            }
            console.error(`got an error status code: ${res.status} ${res.statusText} trying again after a few seconds...`);
            await sleep(3000);
        }
        if (!res) {
            throw new Error('did not even try to fetch');
        }
        if (!res.ok) {
            throw new Error(`got an error status code: ${res.status} ${res.statusText}`);
        }
        if (res.status === 204) {
            console.log('finished all the questions for this transformation');
            dispatch(setCurrentStatusId(''));
            return { done: true };
        }
        const data: { question: string } = await res.json();
        const question: IQuestion = JSON.parse(data.question);
        question.answer = 'default' in question ? question.default : quesDefaults[question.type];
        const step: IQAStep = { question };
        dispatch(addQAStep({ id: outputId, step }));
        return { done: false };
    };

// ------------------------------------------------------------

export interface IGraph {
    nodes: Array<Node>;
    edges: Array<Edge>;
}

export const projectOutputsApi = createApi({
    reducerPath: 'projectOutputsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['output-graph'],
    endpoints: (builder) => ({
        getProjectOutputGraph: builder.query<IGraph, { wid: string, pid: string, outputId: string }>({
            query: ({ wid, pid, outputId }) => `/workspaces/${wid}/projects/${pid}/outputs/${outputId}/graph`,
            providesTags: (res, err, arg) => [{ type: 'output-graph', id: arg.outputId }],
        }),
        startTransforming: builder.mutation<{ id: string }, { wid: string, pid: string }>({
            query: ({ wid, pid }) => ({
                url: `/workspaces/${wid}/projects/${pid}/outputs`,
                method: 'POST',
            }),
        }),
        deleteProjectOutput: builder.mutation<void, { wid: string, pid: string, outputId: string }>({
            query: ({ wid, pid, outputId }) => ({
                url: `/workspaces/${wid}/projects/${pid}/outputs/${outputId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (res, err, arg) => [{ type: 'output-graph', id: arg.outputId }],
        }),
        deleteProjectOutputs: builder.mutation<void, { wid: string, pid: string, outputIds: Array<string> }>({
            queryFn: async ({ wid, pid, outputIds }, _queryApi, _extraOptions, fetchWithBQ) => {
                const results = await Promise.all(outputIds.map(outputId => fetchWithBQ({
                    url: `/workspaces/${wid}/projects/${pid}/outputs/${outputId}`,
                    method: 'DELETE',
                })));
                const foundResult = results.find(result => result.error);
                if (foundResult) return { error: foundResult.error as FetchBaseQueryError };
                return { data: undefined };
            },
            invalidatesTags: (res, err, arg) => arg.outputIds.map(outputId => ({ type: 'output-graph' as const, id: outputId })),
        }),
    }),
});

export const {
    useGetProjectOutputGraphQuery, useStartTransformingMutation, useDeleteProjectOutputMutation, useDeleteProjectOutputsMutation,
} = projectOutputsApi;
