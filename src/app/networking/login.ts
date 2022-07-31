/*
Copyright IBM Corporation 2021

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

import { IUserInfo } from '../common/types';
import { checkCommonErrors } from '../common/utils';

async function getUserProfile(): Promise<IUserInfo> {
    const res = await fetch('/auth/user-profile', { headers: { Accept: 'application/json' } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to get the user profile. Status: ${res.status}`);
    }
    return await res.json();
}

async function logout(): Promise<void> {
    const res = await fetch('/auth/logout', { method: 'POST' });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to logout. Status: ${res.status}`);
    }
}

export { getUserProfile, logout };
