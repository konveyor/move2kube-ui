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

interface IUserInfo {
    email: string;
    preferred_username?: string;
    picture?: string;
}

export const loginApi = createApi({
    reducerPath: 'loginApi',
    baseQuery: fetchBaseQuery({
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            return headers;
        }
    }),
    tagTypes: ['user'],
    endpoints: (builder) => ({
        getUserProfile: builder.query<IUserInfo, void>({
            queryFn: async () => {
                try {
                    const res = await fetch('/auth/user-profile');
                    if (!res.ok) {
                        return { error: { status: res.status, data: 'got an error status code' } as FetchBaseQueryError };
                    }
                    const data = await res.json();
                    return { data };
                } catch (e) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'failed to get the user profile.' } as FetchBaseQueryError };
                }
            },
            providesTags: ['user'],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['user'],
        }),
    })
});

export const { useGetUserProfileQuery, useLogoutMutation } = loginApi;
