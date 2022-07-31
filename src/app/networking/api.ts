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

import {
    IProject,
    ProblemT,
    IMetadata,
    IWorkspace,
    XHRListener,
    ISupportInfo,
    IProjectInput,
    PlanProgressT,
    ProjectInputType,
} from '../common/types';
import { checkCommonErrors } from '../common/utils';

const API_BASE = '/api/v1';
const ACCEPT_HEADER = 'Accept';
const CONTENT_TYPE_HEADER = 'Content-Type';
const CONTENT_TYPE_JSON = 'application/json';

async function wait(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function getProjectStatus(status: IProject['status']): Array<string> {
    if (!status) return [];
    return Object.entries(status)
        .filter(([_, v]) => v)
        .map(([k, _]) => k);
}

function getWorkspaceStatus(workspace: IWorkspace): string {
    return `${workspace.project_ids?.length || 0} projects`;
}

async function getSupportInfo(): Promise<ISupportInfo> {
    const url = `${API_BASE}/support`;
    const res = await fetch(url, { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`Failed to get the support information. Status: ${res.status}`);
    }
    return await res.json();
}

async function listWorkspaces(): Promise<Array<IWorkspace>> {
    const url = `${API_BASE}/workspaces`;
    const res = await fetch(url, { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`Failed to list the workspaces. Status: ${res.status}`);
    }
    return await res.json();
}

function createWorkspaceInputURL(workspaceId: string): string {
    return `${API_BASE}/workspaces/${workspaceId}/inputs`;
}

async function createWorkspace(workspace: IWorkspace): Promise<IMetadata> {
    const url = `${API_BASE}/workspaces`;
    const body = JSON.stringify(workspace);
    const res = await fetch(url, { method: 'POST', headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPE_JSON }, body });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to create a new workspace ${body}. Status: ${res.status}`);
    }
    return await res.json();
}

async function readWorkspace(workspaceId: string): Promise<IWorkspace> {
    const url = `${API_BASE}/workspaces/${workspaceId}`;
    const res = await fetch(url, { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to get the workspace ${workspaceId}. Status: ${res.status}`);
    }
    return await res.json();
}

async function updateWorkspace(workspace: IWorkspace): Promise<void> {
    const url = `${API_BASE}/workspaces/${workspace.id}`;
    const body = JSON.stringify(workspace);
    const res = await fetch(url, { method: 'PUT', headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPE_JSON }, body });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to update the workspace ${body}. Status: ${res.status}`);
    }
}

async function deleteWorkspace(workspaceId: string): Promise<void> {
    const url = `${API_BASE}/workspaces/${workspaceId}`;
    const res = await fetch(url, { method: 'DELETE', headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to delete the workspace ${workspaceId}. Status: ${res.status}`);
    }
}

async function listProjects(workspaceId: string): Promise<Array<IProject>> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects`;
    const res = await fetch(url, { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`Failed to list the projects in the workspace ${workspaceId}. Status: ${res.status}`);
    }
    return await res.json();
}

async function createProject(workspaceId: string, project: IProject): Promise<IMetadata> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects`;
    const body = JSON.stringify(project);
    const res = await fetch(url, { method: 'POST', headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPE_JSON }, body });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`Failed to create a new project ${body}. Status: ${res.status}`);
    }
    return await res.json();
}

async function readProject(workspaceId: string, projectId: string): Promise<IProject> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}`;
    const res = await fetch(url, { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to get the project ${projectId}. Status: ${res.status}`);
    }
    return await res.json();
}

async function updateProject(workspaceId: string, project: IProject): Promise<void> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${project.id}`;
    const body = JSON.stringify(project);
    const res = await fetch(url, { method: 'PUT', headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPE_JSON }, body });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`Failed to update the project ${body}. Status: ${res.status}`);
    }
}

async function deleteProject(workspaceId: string, projectId: string): Promise<void> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}`;
    const res = await fetch(url, { method: 'DELETE', headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(
            `failed to delete the project ${projectId} in the workspace ${workspaceId}. Status: ${res.status}`,
        );
    }
}

function readWorkspaceInputURL(workspaceId: string, projInputId: string): string {
    return `${API_BASE}/workspaces/${workspaceId}/inputs/${projInputId}`;
}

async function deleteWorkspaceInput(workspaceId: string, projInputId: string): Promise<void> {
    const url = `${API_BASE}/workspaces/${workspaceId}/inputs/${projInputId}`;
    const res = await fetch(url, { method: 'DELETE', headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(
            `failed to delete the common workspace level input ${projInputId} of the workspace ${workspaceId}. Status: ${res.status}`,
        );
    }
}

function createProjectInputURL(workspaceId: string, projectId: string): string {
    return `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/inputs`;
}

async function createProjectInput(
    workspaceId: string,
    projectId: string,
    projInput: IProjectInput,
    file: File | string,
    progressListener: (e: ProgressEvent<XMLHttpRequestEventTarget>) => void,
    abortListener: XHRListener,
    errorListener: XHRListener,
    loadListener: XHRListener,
): Promise<IMetadata> {
    if (!file) throw new Error('The file is empty. Please upload a valid file.');
    const url = createProjectInputURL(workspaceId, projectId);
    const formdata = new FormData();
    formdata.set('file', file);
    formdata.set('type', projInput.type);
    if (projInput.description) formdata.set('description', projInput.description);
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.upload.addEventListener('progress', progressListener);
    return new Promise((resolve, reject) => {
        xhr.addEventListener('abort', () => abortListener(resolve, reject, xhr));
        xhr.addEventListener('error', () => errorListener(resolve, reject, xhr));
        xhr.addEventListener('load', () => loadListener(resolve, reject, xhr));
        xhr.open('POST', url);
        xhr.send(formdata);
    });
}

async function createProjectInputReference(
    workspaceId: string,
    projectId: string,
    projInput: IProjectInput,
): Promise<IMetadata> {
    if (projInput.type !== ProjectInputType.Reference) throw new Error('only meant for reference type project input');
    const url = createProjectInputURL(workspaceId, projectId);
    const body = new FormData();
    body.set('id', projInput.id);
    body.set('type', projInput.type);
    const res = await fetch(url, { method: 'POST', body });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`Failed to create a new reference type project input ${body}. Status: ${res.status}`);
    }
    return await res.json();
}

function readProjectInputURL(workspaceId: string, projectId: string, projInputId: string): string {
    return `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/inputs/${projInputId}`;
}

async function deleteProjectInput(workspaceId: string, projectId: string, projInputId: string): Promise<void> {
    const url = readProjectInputURL(workspaceId, projectId, projInputId);
    const res = await fetch(url, { method: 'DELETE', headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to delete the input ${projInputId} of the project ${projectId}. Status: ${res.status}`);
    }
}

async function startPlanning(workspaceId: string, projectId: string): Promise<void> {
    const value = new URLSearchParams(window.location.search);
    const debugSuffix = value.get('debug') ? `?debug=${value.get('debug')}` : '';
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/plan${debugSuffix}`;
    const res = await fetch(url, { method: 'POST', headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`Failed to start plan generation for the project ${projectId}. Status: ${res.status}`);
    }
}

async function readPlan(workspaceId: string, projectId: string): Promise<string> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/plan`;
    const res = await fetch(url, { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to get the plan for the project ${projectId}. Status: ${res.status}`);
    }
    return (await res.json()).plan;
}

async function waitForPlan(
    workspaceId: string,
    projectId: string,
    progressCallback?: (x: PlanProgressT) => void,
): Promise<string> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/plan`;
    const options = { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } };
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const res = await fetch(url, options);
        if (!res.ok) {
            await checkCommonErrors(res);
            throw new Error(
                `failed to get the plan for the project ${projectId} in the workspace ${workspaceId}. Status: ${res.status}`,
            );
        }
        if (res.status === 202) {
            const progress: PlanProgressT = await res.json();
            console.log(`Still waiting for plan generation to finish. Progress ${progress} . Status: ${res.status}`);
            if (progressCallback) progressCallback(progress);
            await wait(3);
            continue;
        }
        if (res.status === 204) {
            console.log(`Still waiting for plan generation to finish. Status: ${res.status}`);
            await wait(3);
            continue;
        }
        return (await res.json()).plan;
    }
}

async function updatePlan(workspaceId: string, projectId: string, plan: string): Promise<void> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/plan`;
    const body = JSON.stringify({ plan });
    const res = await fetch(url, { method: 'PUT', headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON }, body });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`Failed to update the plan for the project ${projectId}. Status: ${res.status}`);
    }
}

async function startTransformation(workspaceId: string, projectId: string, debugMode: boolean): Promise<IMetadata> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/outputs${debugMode ? '?debug=true' : ''}`;
    const res = await fetch(url, { method: 'POST', headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to start transformation of the project ${projectId}. Status: ${res.status}`);
    }
    return await res.json();
}

async function startTransformationWithPlan(
    workspaceId: string,
    projectId: string,
    plan: string,
    debugMode: boolean,
): Promise<IMetadata> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/outputs${debugMode ? '?debug=true' : ''}`;
    const body = JSON.stringify({ plan: plan });
    const res = await fetch(url, { method: 'POST', headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON }, body });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to start transformation of the project ${projectId}. Status: ${res.status}`);
    }
    return await res.json();
}

function readProjectOutputURL(workspaceId: string, projectId: string, projOutputId: string): string {
    return `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/outputs/${projOutputId}`;
}

function readProjectOutputGraphURL(workspaceId: string, projectId: string, projOutputId: string): string {
    return `${readProjectOutputURL(workspaceId, projectId, projOutputId)}/graph`;
}

async function readProjectOutput(workspaceId: string, projectId: string, projOutputId: string): Promise<Blob> {
    const url = readProjectOutputURL(workspaceId, projectId, projOutputId);
    const res = await fetch(url, { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(`failed to get the output ${projOutputId} of the project ${projectId}. Status: ${res.status}`);
    }
    return await res.blob();
}

async function deleteProjectOutput(workspaceId: string, projectId: string, projOutputId: string): Promise<void> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/outputs/${projOutputId}`;
    const res = await fetch(url, { method: 'DELETE', headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(
            `failed to delete the output ${projOutputId} of the project ${projectId}. Status: ${res.status}`,
        );
    }
}

async function getQuestion(workspaceId: string, projectId: string, projOutputId: string): Promise<ProblemT | null> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/outputs/${projOutputId}/problems/current`;
    const res = await fetch(url, { headers: { [ACCEPT_HEADER]: CONTENT_TYPE_JSON } });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(
            `failed to get the next question for the output ${projOutputId} of the project ${projectId}. Status: ${res.status}`,
        );
    }
    if (res.status === 204) return null;
    const data: { question: string } = await res.json();
    console.log('getQuestion data', data);
    const question: ProblemT = JSON.parse(data.question);
    console.log('getQuestion question', question);
    return question;
}

async function postSolution(
    workspaceId: string,
    projectId: string,
    projOutputId: string,
    solution: ProblemT,
): Promise<void> {
    const url = `${API_BASE}/workspaces/${workspaceId}/projects/${projectId}/outputs/${projOutputId}/problems/current/solution`;
    const solutionStr = JSON.stringify(solution);
    const body = JSON.stringify({ solution: solutionStr });
    const res = await fetch(url, { method: 'POST', headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPE_JSON }, body });
    if (!res.ok) {
        await checkCommonErrors(res);
        throw new Error(
            `failed to post the solution for the current question of the output ${projOutputId} of the project ${projectId}. Status: ${res.status}`,
        );
    }
}

export {
    wait,
    getSupportInfo,
    listWorkspaces,
    createWorkspace,
    readWorkspace,
    updateWorkspace,
    deleteWorkspace,
    listProjects,
    createProject,
    readProject,
    updateProject,
    deleteProject,
    createWorkspaceInputURL,
    readWorkspaceInputURL,
    deleteWorkspaceInput,
    createProjectInputURL,
    createProjectInput,
    createProjectInputReference,
    readProjectInputURL,
    deleteProjectInput,
    startPlanning,
    readPlan,
    updatePlan,
    waitForPlan,
    startTransformation,
    startTransformationWithPlan,
    readProjectOutputURL,
    readProjectOutputGraphURL,
    readProjectOutput,
    deleteProjectOutput,
    getQuestion,
    postSolution,
    getProjectStatus,
    getWorkspaceStatus,
};
