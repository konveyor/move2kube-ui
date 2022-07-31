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

import React from 'react';
import {
    wait,
    readProject,
    listProjects,
    createProject,
    updateProject,
    deleteProject,
    readWorkspace,
    listWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    createProjectInputURL,
    createWorkspaceInputURL,
} from '../networking/api';
import {
    IProject,
    IMetadata,
    IWorkspace,
    IProjectInput,
    FileUploadStatus,
    SUPPORTED_ARCHIVE_FORMATS,
    IWorkspaceInput,
    ErrHTTP404,
    IApplicationContext,
} from './types';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { ApplicationContext } from './ApplicationContext';

type IAppContextProviderProps = RouteComponentProps;

interface IAppContextProviderState extends IApplicationContext {
    isLoading: boolean;
}

class _AppContextProvider extends React.Component<IAppContextProviderProps, IAppContextProviderState> {
    constructor(props: IAppContextProviderProps) {
        super(props);

        this.checkLoading = this.checkLoading.bind(this);
        this.setGuidedFlow = this.setGuidedFlow.bind(this);
        this.switchWorkspace = this.switchWorkspace.bind(this);
        this.listWorkspaces = this.listWorkspaces.bind(this);
        this.createWorkspace = this.createWorkspace.bind(this);
        this.readWorkspace = this.readWorkspace.bind(this);
        this.updateWorkspace = this.updateWorkspace.bind(this);
        this.deleteWorkspace = this.deleteWorkspace.bind(this);
        this.switchProject = this.switchProject.bind(this);
        this.listProjects = this.listProjects.bind(this);
        this.createProject = this.createProject.bind(this);
        this.readProject = this.readProject.bind(this);
        this.updateProject = this.updateProject.bind(this);
        this.deleteProject = this.deleteProject.bind(this);
        this.goToRoute = this.goToRoute.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.cancelUpload = this.cancelUpload.bind(this);
        this.uploadWorkspaceFile = this.uploadWorkspaceFile.bind(this);
        this.cancelWorkspaceUpload = this.cancelWorkspaceUpload.bind(this);

        this.state = {
            isLoading: true,

            isGuidedFlow: false,
            setGuidedFlow: this.setGuidedFlow,

            currentWorkspace: { id: '', timestamp: '' },
            switchWorkspace: this.switchWorkspace,

            workspaces: {},
            listWorkspaces: this.listWorkspaces,
            createWorkspace: this.createWorkspace,
            readWorkspace: this.readWorkspace,
            updateWorkspace: this.updateWorkspace,
            deleteWorkspace: this.deleteWorkspace,

            currentProject: { id: '', timestamp: '' },
            switchProject: this.switchProject,

            projects: {},
            listProjects: this.listProjects,
            createProject: this.createProject,
            readProject: this.readProject,
            updateProject: this.updateProject,
            deleteProject: this.deleteProject,

            goToRoute: this.goToRoute,

            files: {},
            uploadFile: this.uploadFile,
            cancelUpload: this.cancelUpload,

            workspaceFiles: {},
            uploadWorkspaceFile: this.uploadWorkspaceFile,
            cancelWorkspaceUpload: this.cancelWorkspaceUpload,
        };
    }

    async componentDidMount(): Promise<void> {
        try {
            const workList = await listWorkspaces();
            const workspaces: { [id: string]: IWorkspace } = {};
            workList.forEach((w) => (workspaces[w.id] = w));
            const currentWorkspace = workList[0] || { id: '' };
            if (!currentWorkspace.id) {
                return this.setState({
                    workspaces,
                    currentWorkspace,
                    projects: {},
                    currentProject: { id: '', timestamp: '' },
                    isLoading: false,
                });
            }
            const projList = await listProjects(currentWorkspace.id);
            const projects: { [id: string]: IProject } = {};
            projList.forEach((p) => (projects[p.id] = p));
            const currentProject = projList[0] || { id: '' };
            this.setState({ workspaces, currentWorkspace, projects, currentProject, isLoading: false });
        } catch (e) {
            const err = `failed to fetch data from the server. ${e}`;
            console.error(err);
        }
    }

    async checkLoading(): Promise<void> {
        while (this.state.isLoading) {
            console.log('still fetching data from the server. waiting 2 more seconds...');
            await wait(2);
        }
    }

    async setGuidedFlow(isGuidedFlow: boolean): Promise<void> {
        await this.checkLoading();
        return new Promise<void>((resolve) => this.setState({ isGuidedFlow }, resolve));
    }

    async switchWorkspace(id: string): Promise<void> {
        await this.checkLoading();
        if (id in this.state.workspaces) {
            const currentWorkspace = await readWorkspace(id);
            if (
                (!currentWorkspace.project_ids && Object.values(this.state.projects).length === 0) ||
                currentWorkspace.project_ids?.every((id) => id in this.state.projects)
            ) {
                return new Promise<void>((resolve) => this.setState({ currentWorkspace }, resolve));
            }
            const projList = await listProjects(id);
            const projects: { [id: string]: IProject } = {};
            projList.forEach((p) => (projects[p.id] = p));
            const currentProject = projects[this.state.currentProject.id] || projList[0] || { id: '' };
            return new Promise<void>((resolve) =>
                this.setState({ currentWorkspace, projects, currentProject }, resolve),
            );
        } else {
            const workList = await listWorkspaces();
            if (workList.length === 0) {
                await new Promise<void>((resolve) =>
                    this.setState(
                        {
                            workspaces: {},
                            currentWorkspace: { id: '', timestamp: '' },
                            projects: {},
                            currentProject: { id: '', timestamp: '' },
                        },
                        resolve,
                    ),
                );
                throw new ErrHTTP404(`HTTP 404 Not Found. No workspaces found.`);
            }
            const workspaces: { [id: string]: IWorkspace } = {};
            workList.forEach((w) => (workspaces[w.id] = w));
            const currentWorkspace = workspaces[id] || workList[0];
            const projList = await listProjects(currentWorkspace.id);
            const projects: { [id: string]: IProject } = {};
            projList.forEach((p) => (projects[p.id] = p));
            const currentProject = projects[this.state.currentProject.id] || projList[0] || { id: '' };
            await new Promise<void>((resolve) =>
                this.setState({ workspaces, currentWorkspace, projects, currentProject }, resolve),
            );
            if (!(id in workspaces)) {
                throw new ErrHTTP404(`HTTP 404 Not Found. There is no workspace with id ${id}`);
            }
        }
    }

    async listWorkspaces(): Promise<Array<IWorkspace>> {
        await this.checkLoading();
        const workList = await listWorkspaces();
        if (workList.length === 0) {
            await new Promise<void>((resolve) =>
                this.setState(
                    {
                        workspaces: {},
                        currentWorkspace: { id: '', timestamp: '' },
                        projects: {},
                        currentProject: { id: '', timestamp: '' },
                    },
                    resolve,
                ),
            );
            return workList;
        }
        const workspaces: { [id: string]: IWorkspace } = {};
        workList.forEach((w) => (workspaces[w.id] = w));
        const currentWorkspace = workspaces[this.state.currentWorkspace.id] || workList[0];
        if (
            currentWorkspace.id === this.state.currentWorkspace.id &&
            ((!currentWorkspace.project_ids && Object.values(this.state.projects).length === 0) ||
                currentWorkspace.project_ids?.every((id) => id in this.state.projects))
        ) {
            await new Promise<void>((resolve) => this.setState({ workspaces, currentWorkspace }, resolve));
            return workList;
        }
        const projList = await listProjects(currentWorkspace.id);
        const projects: { [id: string]: IProject } = {};
        projList.forEach((p) => (projects[p.id] = p));
        const currentProject = projects[this.state.currentProject.id] || projList[0] || { id: '' };
        await new Promise<void>((resolve) =>
            this.setState({ workspaces, currentWorkspace, projects, currentProject }, resolve),
        );
        return workList;
    }

    async createWorkspace(work: IWorkspace): Promise<IMetadata> {
        await this.checkLoading();
        const meta = await createWorkspace(work);
        await this.listWorkspaces();
        return this.state.workspaces[meta.id] || meta;
    }

    async readWorkspace(id: string): Promise<IWorkspace> {
        await this.checkLoading();
        await this.listWorkspaces();
        const work = this.state.workspaces[id];
        if (!work) throw new Error(`there is no workspace with id ${id}`);
        return work;
    }

    async updateWorkspace(work: IWorkspace): Promise<void> {
        await this.checkLoading();
        await updateWorkspace(work);
        await this.listWorkspaces();
    }

    async deleteWorkspace(id: string): Promise<void> {
        await this.checkLoading();
        await deleteWorkspace(id);
        await this.listWorkspaces();
    }

    async switchProject(id: string): Promise<void> {
        await this.checkLoading();
        if (this.state.currentWorkspace.project_ids?.includes(id)) {
            const currentProject = await readProject(this.state.currentWorkspace.id, id);
            return new Promise<void>((resolve) => this.setState({ currentProject }, resolve));
        }
        const currentWorkspace = await readWorkspace(this.state.currentWorkspace.id);
        if (!currentWorkspace.project_ids) {
            await new Promise<void>((resolve) =>
                this.setState({ currentWorkspace, projects: {}, currentProject: { id: '', timestamp: '' } }, resolve),
            );
            throw new ErrHTTP404(
                `HTTP 404 Not Found. There are no projects in the workspace ${this.state.currentWorkspace.id}`,
            );
        }
        const projList = await listProjects(this.state.currentWorkspace.id);
        const projects: { [id: string]: IProject } = {};
        projList.forEach((p) => (projects[p.id] = p));
        if (currentWorkspace.project_ids.includes(id)) {
            if (id in projects) {
                const currentProject = projects[id];
                return new Promise<void>((resolve) =>
                    this.setState({ currentWorkspace, projects, currentProject }, resolve),
                );
            } else {
                console.log('projects', projects);
                throw new ErrHTTP404(
                    `HTTP 404 Not Found. The project with id ${id} is present in the workspace ${this.state.currentWorkspace.id} but is not returned when listing projects.`,
                );
            }
        } else {
            if (id in projects) {
                console.log('projects', projects);
                throw new ErrHTTP404(
                    `HTTP 404 Not Found. The project with id ${id} is not in the workspace ${this.state.currentWorkspace.id} but was found when listing projects.`,
                );
            } else {
                const currentProject = projList[0] || { id: '' };
                await new Promise<void>((resolve) =>
                    this.setState({ currentWorkspace, projects, currentProject }, resolve),
                );
                if (projList.length === 0) {
                    console.log('currentWorkspace', currentWorkspace);
                    throw new ErrHTTP404(
                        `HTTP 404 Not Found. There are projects in the workspace ${this.state.currentWorkspace.id} but no projects were returned when listing projects`,
                    );
                }
                throw new ErrHTTP404(
                    `HTTP 404 Not Found. There is no project with id ${id} in the workspace ${this.state.currentWorkspace.id}`,
                );
            }
        }
    }

    async listProjects(): Promise<Array<IProject>> {
        await this.checkLoading();
        const projList = await listProjects(this.state.currentWorkspace.id);
        const projects: { [id: string]: IProject } = {};
        projList.forEach((p) => (projects[p.id] = p));
        const currentProject = projects[this.state.currentProject.id] || projList[0] || { id: '' };
        if (
            (!this.state.currentWorkspace.project_ids && projList.length === 0) ||
            this.state.currentWorkspace.project_ids?.every((id) => id in projects)
        ) {
            await new Promise<void>((resolve) => this.setState({ projects, currentProject }, resolve));
            return projList;
        }
        const currentWorkspace = await readWorkspace(this.state.currentWorkspace.id);
        await new Promise<void>((resolve) => this.setState({ currentWorkspace, projects, currentProject }, resolve));
        return projList;
    }

    async createProject(proj: IProject): Promise<IMetadata> {
        await this.checkLoading();
        const meta = await createProject(this.state.currentWorkspace.id, proj);
        await this.listProjects();
        return this.state.projects[meta.id] || meta;
    }

    async readProject(id: string): Promise<IProject> {
        await this.checkLoading();
        await this.listProjects();
        const proj = this.state.projects[id];
        if (!proj) throw new Error(`there is no project with id ${id}`);
        return proj;
    }

    async updateProject(proj: IProject): Promise<void> {
        await this.checkLoading();
        await updateProject(this.state.currentWorkspace.id, proj);
        await this.listProjects();
    }

    async deleteProject(id: string): Promise<void> {
        await this.checkLoading();
        await deleteProject(this.state.currentWorkspace.id, id);
        await this.listProjects();
    }

    goToRoute(route: string, message?: string): void {
        this.props.history.push(route);
        if (message) alert(message);
    }

    async uploadFile(
        workspaceId: string,
        projectId: string,
        projInput: IProjectInput,
        file: File,
        callback: () => void,
    ) {
        const fileId = uuidv4();
        const url = createProjectInputURL(workspaceId, projectId);
        const formdata = new FormData();
        formdata.set('type', projInput.type);
        if (projInput.description) formdata.set('description', projInput.description);
        formdata.set('file', file);
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        const tf1 = (prev: IAppContextProviderState) => ({
            files: {
                ...prev.files,
                [projectId]: {
                    ...prev.files[projectId],
                    [fileId]: {
                        xhr,
                        file,
                        filename: projInput.name || 'filename unknown',
                        percent: 0,
                        status: FileUploadStatus.Uploading,
                        statusMsg: '',
                    },
                },
            },
        });
        await new Promise<void>((resolve) => this.setState(tf1, resolve));
        const progressListener = (event: ProgressEvent<XMLHttpRequestEventTarget>) => {
            console.log(`Uploaded ${event.loaded} bytes out of ${event.total}`);
            const newUploadPercent = Math.round((event.loaded / event.total) * 100);
            this.setState((prev) => ({
                files: {
                    ...prev.files,
                    [projectId]: {
                        ...prev.files[projectId],
                        [fileId]: { ...prev.files[projectId][fileId], percent: newUploadPercent },
                    },
                },
            }));
        };

        const abortListener = () => {
            const err = `File upload aborted. Status: ${xhr.status}`;
            this.setState((prev) => {
                const t1 = {
                    files: { ...prev.files, [projectId]: { ...prev.files[projectId] } },
                };
                delete t1.files[projectId][fileId];
                return t1;
            });
            console.error(err);
        };

        const errorListener = () => {
            const err = `Failed to upload the file for the project ${projectId}. Status: ${xhr.status}
Supported file formats are ${SUPPORTED_ARCHIVE_FORMATS} .
If the file size is huge, try removing large files, which are not needed.
If network is the problem, you can use the command line tool to accomplish the transformation. Check out https://move2kube.konveyor.io/installation/cli/`;
            this.setState((prev) => ({
                files: {
                    ...prev.files,
                    [projectId]: {
                        ...prev.files[projectId],
                        [fileId]: {
                            ...prev.files[projectId][fileId],
                            percent: 0,
                            status: FileUploadStatus.DoneError,
                            statusMsg: err,
                        },
                    },
                },
            }));
            console.error(err);
        };

        const loadListener = () => {
            if (xhr.status < 200 || xhr.status > 299) {
                let reason = 'Please check the input type and try again.';
                if (xhr.response && typeof xhr.response === 'object') {
                    reason = 'Error: ' + xhr.response.error.description;
                }
                const err = `failed to upload the file. Status: ${xhr.status} . ${reason}`;
                this.setState((prev) => ({
                    files: {
                        ...prev.files,
                        [projectId]: {
                            ...prev.files[projectId],
                            [fileId]: {
                                ...prev.files[projectId][fileId],
                                percent: 0,
                                status: FileUploadStatus.DoneError,
                                statusMsg: err,
                            },
                        },
                    },
                }));
                console.error(err);
                return callback();
            }
            console.log(`File upload complete. Status: ${xhr.status}`);
            this.setState((prev) => ({
                files: {
                    ...prev.files,
                    [projectId]: {
                        ...prev.files[projectId],
                        [fileId]: {
                            ...prev.files[projectId][fileId],
                            percent: 100,
                            status: FileUploadStatus.DoneSuccess,
                            statusMsg: 'File upload complete.',
                        },
                    },
                },
            }));
            console.log(`upload complete for file ${fileId} of project ${projectId}`);
            console.log('xhr.response', xhr.response);
            return callback();
        };
        xhr.upload.addEventListener('progress', progressListener);
        xhr.addEventListener('abort', abortListener);
        xhr.addEventListener('error', errorListener);
        xhr.addEventListener('load', loadListener);
        xhr.open('POST', url);
        xhr.send(formdata);
    }

    cancelUpload(projectId: string, fileId: string) {
        if (!this.state.files[projectId] || !this.state.files[projectId][fileId])
            throw new Error(`cannot cancel. there is no file with id ${fileId} for project ${projectId}`);
        if (this.state.files[projectId][fileId].status === FileUploadStatus.Uploading) {
            return this.state.files[projectId][fileId].xhr.abort();
        } else if (this.state.files[projectId][fileId].status === FileUploadStatus.DoneError) {
            this.setState((prev) => {
                const t1 = {
                    files: { ...prev.files, [projectId]: { ...prev.files[projectId] } },
                };
                delete t1.files[projectId][fileId];
                return t1;
            });
        } else {
            console.log('cancelUpload called while status is', this.state.files[projectId][fileId].status);
        }
    }

    async uploadWorkspaceFile(workspaceId: string, workInput: IWorkspaceInput, file: File, callback: () => void) {
        const fileId = uuidv4();
        const url = createWorkspaceInputURL(workspaceId);
        const formdata = new FormData();
        formdata.set('type', workInput.type);
        if (workInput.description) formdata.set('description', workInput.description);
        formdata.set('file', file);
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        const tf1 = (prev: IAppContextProviderState) => ({
            workspaceFiles: {
                ...prev.workspaceFiles,
                [workspaceId]: {
                    ...prev.workspaceFiles[workspaceId],
                    [fileId]: {
                        xhr,
                        file,
                        filename: workInput.name || 'filename unknown',
                        percent: 0,
                        status: FileUploadStatus.Uploading,
                        statusMsg: '',
                    },
                },
            },
        });
        await new Promise<void>((resolve) => this.setState(tf1, resolve));
        const progressListener = (event: ProgressEvent<XMLHttpRequestEventTarget>) => {
            console.log(`Uploaded ${event.loaded} bytes out of ${event.total}`);
            const newUploadPercent = Math.round((event.loaded / event.total) * 100);
            this.setState((prev) => ({
                workspaceFiles: {
                    ...prev.workspaceFiles,
                    [workspaceId]: {
                        ...prev.workspaceFiles[workspaceId],
                        [fileId]: { ...prev.workspaceFiles[workspaceId][fileId], percent: newUploadPercent },
                    },
                },
            }));
        };

        const abortListener = () => {
            const err = `File upload aborted. Status: ${xhr.status}`;
            this.setState((prev) => {
                const t1 = {
                    workspaceFiles: { ...prev.workspaceFiles, [workspaceId]: { ...prev.workspaceFiles[workspaceId] } },
                };
                delete t1.workspaceFiles[workspaceId][fileId];
                return t1;
            });
            console.error(err);
        };

        const errorListener = () => {
            const err = `Failed to upload the file for the workspace ${workspaceId}. Status: ${xhr.status}
Supported file formats are ${SUPPORTED_ARCHIVE_FORMATS} .
If the file size is huge, try removing large files, which are not needed.
If network is the problem, you can use the command line tool to accomplish the transformation. Check out https://move2kube.konveyor.io/installation/cli/`;
            this.setState((prev) => ({
                workspaceFiles: {
                    ...prev.workspaceFiles,
                    [workspaceId]: {
                        ...prev.workspaceFiles[workspaceId],
                        [fileId]: {
                            ...prev.workspaceFiles[workspaceId][fileId],
                            percent: 0,
                            status: FileUploadStatus.DoneError,
                            statusMsg: err,
                        },
                    },
                },
            }));
            console.error(err);
        };

        const loadListener = () => {
            if (xhr.status < 200 || xhr.status > 299) {
                let reason = 'Please check the input type and try again.';
                if (xhr.response && typeof xhr.response === 'object') {
                    reason = 'Error: ' + xhr.response.error.description;
                }
                const err = `failed to upload the file. Status: ${xhr.status} . ${reason}`;
                this.setState((prev) => ({
                    workspaceFiles: {
                        ...prev.workspaceFiles,
                        [workspaceId]: {
                            ...prev.workspaceFiles[workspaceId],
                            [fileId]: {
                                ...prev.workspaceFiles[workspaceId][fileId],
                                percent: 0,
                                status: FileUploadStatus.DoneError,
                                statusMsg: err,
                            },
                        },
                    },
                }));
                console.error(err);
                return callback();
            }
            console.log(`File upload complete. Status: ${xhr.status}`);
            this.setState((prev) => ({
                workspaceFiles: {
                    ...prev.workspaceFiles,
                    [workspaceId]: {
                        ...prev.workspaceFiles[workspaceId],
                        [fileId]: {
                            ...prev.workspaceFiles[workspaceId][fileId],
                            percent: 100,
                            status: FileUploadStatus.DoneSuccess,
                            statusMsg: 'File upload complete.',
                        },
                    },
                },
            }));
            console.log(`upload complete for file ${fileId} of workspace ${workspaceId}`);
            console.log('xhr.response', xhr.response);
            return callback();
        };
        xhr.upload.addEventListener('progress', progressListener);
        xhr.addEventListener('abort', abortListener);
        xhr.addEventListener('error', errorListener);
        xhr.addEventListener('load', loadListener);
        xhr.open('POST', url);
        xhr.send(formdata);
    }

    cancelWorkspaceUpload(workspaceId: string, fileId: string) {
        if (!this.state.workspaceFiles[workspaceId] || !this.state.workspaceFiles[workspaceId][fileId])
            throw new Error(`cannot cancel. there is no file with id ${fileId} for the workspace ${workspaceId}`);
        if (this.state.workspaceFiles[workspaceId][fileId].status === FileUploadStatus.Uploading) {
            return this.state.workspaceFiles[workspaceId][fileId].xhr.abort();
        } else if (this.state.workspaceFiles[workspaceId][fileId].status === FileUploadStatus.DoneError) {
            this.setState((prev) => {
                const t1 = {
                    workspaceFiles: { ...prev.workspaceFiles, [workspaceId]: { ...prev.workspaceFiles[workspaceId] } },
                };
                delete t1.workspaceFiles[workspaceId][fileId];
                return t1;
            });
        } else {
            console.log(
                'cancelWorkspaceUpload called while status is',
                this.state.workspaceFiles[workspaceId][fileId].status,
            );
        }
    }
    render(): JSX.Element {
        return <ApplicationContext.Provider value={this.state}>{this.props.children}</ApplicationContext.Provider>;
    }
}

function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export const AppContextProvider = withRouter(_AppContextProvider);
