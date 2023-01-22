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
import { API_BASE } from "../common/constants";
import { IProjectInput, ProjectInputType } from '../common/types';
import { getUUID } from "../common/utils";
import { createStatus, deleteStatus, deleteStatusesWithErrors, setError, setProgress } from "./inputsSlice";

export const projectInputsApi = createApi({
    reducerPath: 'projectInputsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            return headers;
        },
    }),
    endpoints: (builder) => ({
        createProjectInput: builder.mutation<
            { id: string },
            {
                wid: string,
                pid?: string,
                projectInput: IProjectInput,
                file?: File,
                workspaceInputId?: string,
            }
        >({
            queryFn: async ({ wid, pid, projectInput, file, workspaceInputId }, baseQueryApi, _extraOptions, _fetchWithBQ) => {
                if (projectInput.type === ProjectInputType.Reference) {
                    if (!workspaceInputId) return { error: { status: 'CUSTOM_ERROR', error: 'input type reference requires a id to be specified' } as FetchBaseQueryError };
                } else {
                    if (!file) return { error: { status: 'CUSTOM_ERROR', error: 'The file is empty. Please upload a valid file.' } as FetchBaseQueryError };
                }
                const url = pid ? `${API_BASE}/workspaces/${wid}/projects/${pid}/inputs` : `${API_BASE}/workspaces/${wid}/inputs`;
                const formdata = new FormData();
                if (file) formdata.set('file', file);
                else if (workspaceInputId) formdata.set('id', workspaceInputId);
                else return { error: { status: 'CUSTOM_ERROR', error: 'must specify either a file or a workspace input id' } };
                formdata.set('type', projectInput.type);
                if (projectInput.description) formdata.set('description', projectInput.description);
                const xhr = new XMLHttpRequest();
                xhr.responseType = 'json';
                const requestId = getUUID();
                xhr.upload.addEventListener('progress', event => {
                    console.log(`Uploaded ${event.loaded} bytes out of ${event.total}`);
                    const percent = Math.round((event.loaded / event.total) * 100);
                    baseQueryApi.dispatch(setProgress({ id: requestId, percent }));
                });
                const dataPromise = new Promise<{ id: string }>((resolve, reject) => {
                    xhr.addEventListener('abort', e => {
                        console.log('XHR aborted event:', e);
                        const err = 'the file upload was aborted';
                        baseQueryApi.dispatch(setError({ id: requestId, error: err }));
                        reject(err);
                    });
                    xhr.addEventListener('error', e => {
                        console.log('XHR error event:', e);
                        const err = 'the file upload failed with an error';
                        baseQueryApi.dispatch(setError({ id: requestId, error: err }));
                        reject(err);
                    });
                    xhr.addEventListener('load', () => {
                        if (xhr.status < 200 || xhr.status > 299) {
                            const reason = (xhr.response && typeof xhr.response === 'object') ? (
                                'Error: ' + xhr.response.error.description
                            ) : (
                                'Please check the input type and try again.'
                            );
                            const err = `failed to upload the file. Status: ${xhr.status} . ${reason}`;
                            console.error(err);
                            reject(err);
                            return;
                        }
                        console.log(`File upload complete. Status: ${xhr.status}`);
                        console.log('xhr.response', xhr.response);
                        baseQueryApi.dispatch(deleteStatus(requestId));
                        resolve(xhr.response);
                    });
                    xhr.open('POST', url);
                    xhr.setRequestHeader('Accept', 'application/json');
                    baseQueryApi.dispatch(deleteStatusesWithErrors());
                    baseQueryApi.dispatch(createStatus({ id: requestId, name: file?.name || '' }));
                    xhr.send(formdata);
                });
                try {
                    const data = await dataPromise;
                    return { data };
                } catch (e) {
                    baseQueryApi.dispatch(setError({ id: requestId, error: `${e}` }));
                    return { error: { status: 'FETCH_ERROR', error: `${e}` } as FetchBaseQueryError };
                }
            },
        }),
        deleteProjectInput: builder.mutation<void, { wid: string, pid?: string, inpId: string }>({
            query: ({ wid, pid, inpId }) => ({
                url: pid ? `/workspaces/${wid}/projects/${pid}/inputs/${inpId}` : `/workspaces/${wid}/inputs/${inpId}`,
                method: 'DELETE',
            }),
        }),
        deleteProjectInputs: builder.mutation<void, { wid: string, pid?: string, inpIds: Array<string> }>({
            queryFn: async ({ wid, pid, inpIds }, _queryApi, _extraOptions, fetchWithBQ) => {
                const results = await Promise.all(inpIds.map(inpId => fetchWithBQ({
                    url: pid ? `/workspaces/${wid}/projects/${pid}/inputs/${inpId}` : `/workspaces/${wid}/inputs/${inpId}`,
                    method: 'DELETE',
                })));
                const foundResult = results.find(result => result.error);
                if (foundResult) return { error: foundResult.error as FetchBaseQueryError };
                return { data: undefined };
            },
        }),
    }),
});

export const { useCreateProjectInputMutation, useDeleteProjectInputMutation, useDeleteProjectInputsMutation } = projectInputsApi;
