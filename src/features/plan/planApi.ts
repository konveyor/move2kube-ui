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

import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../common/constants';
import { sleep } from '../common/utils';

const PLAN_POLLING_INTERVAL_MS = 3000;

export const planApi = createApi({
    reducerPath: 'planApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            return headers;
        }
    }),
    tagTypes: ['plan'],
    endpoints: (builder) => ({
        startPlanning: builder.mutation<void, { wid: string, pid: string }>({
            query: ({ wid, pid }) => ({
                url: `/workspaces/${wid}/projects/${pid}/plan`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'plan', id: arg.pid }],
        }),
        readPlan: builder.query<{ plan: string }, { wid: string, pid: string }>({
            queryFn: async ({ wid, pid }, _, __, _fetchWithBQ) => {
                const url = `${API_BASE}/workspaces/${wid}/projects/${pid}/plan`;
                let finalStatus = 404;
                try {
                    let res = await fetch(url);
                    finalStatus = res.status;
                    if (!res.ok) {
                        throw new Error(`got an error status code: ${res.status} ${res.statusText}`);
                    }
                    while (res.status === 204) {
                        await sleep(PLAN_POLLING_INTERVAL_MS);
                        res = await fetch(url);
                        finalStatus = res.status;
                        if (!res.ok) {
                            throw new Error(`got an error status code: ${res.status} ${res.statusText}`);
                        }
                    }
                    const data: { plan: string } = await res.json();
                    return { data };
                } catch (e) {
                    console.error(e);
                    return { error: { status: finalStatus, data: `${e}` } as FetchBaseQueryError };
                }
            },
            providesTags: (result, error, arg) => [{ type: 'plan', id: arg.pid }],
        }),
        updatePlan: builder.mutation<void, { wid: string, pid: string, plan: string }>({
            query: ({ wid, pid, plan }) => ({
                url: `/workspaces/${wid}/projects/${pid}/plan`,
                method: 'PUT',
                body: { plan },
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'plan', id: arg.pid }],
        }),
    }),
});

export const { useReadPlanQuery, useStartPlanningMutation, useUpdatePlanMutation } = planApi;
