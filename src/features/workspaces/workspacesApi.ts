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
import { IMetadata, IProjectInput } from '../common/types';

export interface IWorkspace extends IMetadata {
    project_ids?: Array<string>;
    inputs?: { [id: string]: IWorkspaceInput };
}

type IWorkspaceInput = IProjectInput;

export const workspacesApi = createApi({
    reducerPath: 'workspacesApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            return headers;
        }
    }),
    tagTypes: ['workspaces'],
    endpoints: (builder) => ({
        listWorkspaces: builder.query<Array<IWorkspace>, void>({
            query: () => '/workspaces',
            providesTags: (result, _error, _arg) => (
                result
                    ? [...result.map(({ id }) => ({ type: 'workspaces' as const, id })), { type: 'workspaces', id: 'list' }]
                    : [{ type: 'workspaces', id: 'list' }]
            ),
        }),
        createWorkspace: builder.mutation<{ id: string }, IWorkspace>({
            query: (w) => ({
                url: '/workspaces',
                method: 'POST',
                body: w,
            }),
            invalidatesTags: [{ type: 'workspaces', id: 'list' }],
        }),
        readWorkspace: builder.query<IWorkspace, string>({
            query: (id) => `/workspaces/${id}`,
            providesTags: (result, error, arg) => [{ type: 'workspaces', id: arg }],
        }),
        updateWorkspace: builder.mutation<void, IWorkspace>({
            query: (w) => ({
                url: `/workspaces/${w.id}`,
                method: 'PUT',
                body: w,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'workspaces', id: arg.id }],
        }),
        deleteWorkspace: builder.mutation<void, string>({
            query: (id: string) => ({
                url: `/workspaces/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'workspaces', id: 'list' }, { type: 'workspaces', id: arg }],
        }),
        deleteWorkspaces: builder.mutation<void, Array<string>>({
            queryFn: async (ids, _queryApi, _extraOptions, fetchWithBQ) => {
                const results = await Promise.all(ids.map(id => fetchWithBQ({
                    url: `/workspaces/${id}`,
                    method: 'DELETE',
                })));
                const foundResult = results.find(result => result.error);
                if (foundResult) return { error: foundResult.error as FetchBaseQueryError };
                return { data: undefined };
            },
            invalidatesTags: (result, error, arg) => [
                { type: 'workspaces', id: 'list' },
                ...arg.map(wid => ({ type: 'workspaces' as const, id: wid })),
            ],
        }),
    })

});

export const { useListWorkspacesQuery, useCreateWorkspaceMutation, useReadWorkspaceQuery, useUpdateWorkspaceMutation,
    useDeleteWorkspaceMutation, useDeleteWorkspacesMutation } = workspacesApi;
