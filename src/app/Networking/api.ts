/*
Copyright IBM Corporation 2020

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

async function wait(seconds: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

async function createApp(aName: string): Promise<void> {
    const body = new FormData();
    body.append('name', aName);
    const res = await fetch('/api/v1/applications', { method: 'POST', body });
    if (!res.ok) throw new Error(`Failed to create a new app ${aName}. Status: ${res.status}`);
}

async function generatePlan(aName: string): Promise<void> {
    const value = new URLSearchParams(window.location.search);
    const debugSuffix = value.get('debug') ? `?debug=${value.get('debug')}` : '';
    const url = '/api/v1/applications/' + encodeURIComponent(aName) + '/plan' + debugSuffix;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to start plan generation for the app ${aName}. Status: ${res.status}`);
}

async function waitForPlan(aName: string): Promise<string> {
    const url = '/api/v1/applications/' + encodeURIComponent(aName) + '/plan';
    const options = { headers: { 'Content-Type': 'application/text' } };
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const res = await fetch(url, options);
        if (!res.ok) {
            console.log(`Still waiting for plan generation to finish. Status: ${res.status}`);
            await wait(3);
            continue;
        }
        return await res.text();
    }
}

async function updateStatus(aName: string): Promise<{ name: string; status: Array<string> }> {
    const url = '/api/v1/applications/' + encodeURIComponent(aName);
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`Failed to get the application ${aName}. Status: ${res.status}`);
    return await res.json();
}

interface ISupportInfo {
    version: string;
    gitCommit: string;
    gitTreeState: string;
    goVersion: string;
}

async function getSupportInfo(): Promise<ISupportInfo> {
    const url = '/api/v1/support';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to get the support information. Status: ${res.status}`);
    return await res.json();
}

export { createApp, generatePlan, waitForPlan, updateStatus, getSupportInfo, ISupportInfo };
