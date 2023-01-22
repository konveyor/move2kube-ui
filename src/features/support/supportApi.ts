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

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../common/constants';

export interface ISupportInfo {
    cli_version: string;
    api_version: string;
    ui_version: string;
    docker: string;
}

export const supportApi = createApi({
    reducerPath: 'supportApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            return headers;
        }
    }),
    tagTypes: ['support'],
    endpoints: (builder) => ({
        getSupportInfo: builder.query<ISupportInfo, void>({
            query: () => '/support',
            providesTags: ['support'],
        }),
    })

});

export const { useGetSupportInfoQuery } = supportApi;
