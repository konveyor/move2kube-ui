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
import { IMetadata, IProjectInput, IProjectOutput } from '../common/types';

export interface IProject extends IMetadata {
    inputs?: { [id: string]: IProjectInput };
    outputs?: { [id: string]: IProjectOutput };
    status?: { [status: string]: boolean };
}

export const projectsApi = createApi({
    reducerPath: 'projectsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            return headers;
        }
    }),
    tagTypes: ['projects'],
    endpoints: (builder) => ({
        listProjects: builder.query<Array<IProject>, string>({
            query: (id) => `/workspaces/${id}/projects`,
            providesTags: (result, _error, _arg) => (
                result
                    ? [...result.map(({ id }) => ({ type: 'projects' as const, id })), { type: 'projects', id: 'list' }]
                    : [{ type: 'projects', id: 'list' }]
            ),
        }),
        createProject: builder.mutation<{ id: string }, { wid: string, project: IProject }>({
            query: ({ wid, project }) => ({
                url: `/workspaces/${wid}/projects`,
                method: 'POST',
                body: project,
            }),
            invalidatesTags: [{ type: 'projects', id: 'list' }],
        }),
        readProject: builder.query<IProject, { wid: string, pid: string }>({
            query: ({ wid, pid }) => `/workspaces/${wid}/projects/${pid}`,
            providesTags: (result, error, arg) => [{ type: 'projects' as const, id: arg.pid }],
        }),
        updateProject: builder.mutation<void, { wid: string, project: IProject }>({
            query: ({ wid, project }) => ({
                url: `/workspaces/${wid}/projects/${project.id}`,
                method: 'PUT',
                body: project,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'projects' as const, id: 'list' }, { type: 'projects' as const, id: arg.project.id }],
        }),
        deleteProject: builder.mutation<void, { wid: string, pid: string }>({
            query: ({ wid, pid }) => ({
                url: `/workspaces/${wid}/projects/${pid}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'projects' as const, id: 'list' }, { type: 'projects' as const, id: arg.pid }],
        }),
        deleteProjects: builder.mutation<void, { wid: string, pids: Array<string> }>({
            queryFn: async ({ wid, pids }, _queryApi, _extraOptions, fetchWithBQ) => {
                const results = await Promise.all(pids.map(pid => fetchWithBQ({
                    url: `/workspaces/${wid}/projects/${pid}`,
                    method: 'DELETE',
                })));
                const foundResult = results.find(result => result.error);
                if (foundResult) return { error: foundResult.error as FetchBaseQueryError };
                return { data: undefined };
            },
            invalidatesTags: (result, error, arg) => [
                { type: 'projects' as const, id: 'list' },
                ...arg.pids.map(pid => ({ type: 'projects' as const, id: pid })),
            ],
        }),
    }),
});

export const { useListProjectsQuery, useCreateProjectMutation, useReadProjectQuery, useUpdateProjectMutation,
    useDeleteProjectMutation, useDeleteProjectsMutation } = projectsApi;
