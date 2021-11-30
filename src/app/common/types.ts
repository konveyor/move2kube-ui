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

class ErrHTTP400 extends Error {
    constructor(message?: string) {
        message = 'HTTP 400 Bad Request ' + (message || '');
        super(message);
    }
}

class ErrHTTP401 extends Error {
    constructor(message?: string) {
        message = 'HTTP 401 Unauthorized ' + (message || '');
        super(message);
    }
}

class ErrHTTP403 extends Error {
    constructor(message?: string) {
        message = 'HTTP 403 Forbidden ' + (message || '');
        super(message);
    }
}

class ErrHTTP404 extends Error {
    constructor(message?: string) {
        message = 'HTTP 404 Not Found ' + (message || '');
        super(message);
    }
}

class ErrHTTP409 extends Error {
    constructor(message?: string) {
        message = 'HTTP 409 Conflict ' + (message || '');
        super(message);
    }
}

interface ISupportInfo {
    cli_version: string;
    api_version: string;
    ui_version: string;
    docker: string;
}

interface IUserInfo {
    preferred_username?: string;
    email: string;
    picture?: string;
}

interface IMetadata {
    id: string;
    timestamp: string;
    name?: string;
    description?: string;
}

interface IWorkspace extends IMetadata {
    project_ids?: Array<string>;
    inputs?: { [id: string]: IProjectInput };
}

interface IProject extends IMetadata {
    inputs?: { [id: string]: IProjectInput };
    outputs?: { [id: string]: IProjectOutput };
    status?: { [status: string]: boolean };
}

interface IProjectInput extends IMetadata {
    type: ProjectInputType;
}

enum ProjectInputType {
    Sources = 'sources',
    Customizations = 'customizations',
    Configs = 'configs',
    Reference = 'reference',
}

type IWorkspaceInput = IProjectInput;

interface IProjectOutput extends IMetadata {
    status: string;
}

interface IPlan {
    apiVersion: string;
    kind: string;
    metadata: { name: string };
}

enum FileUploadStatus {
    Uploading = 'UPLOADING',
    DoneSuccess = 'SUCCESS',
    DoneError = 'ERROR',
}

interface IFiles {
    [projectId: string]: {
        [fileId: string]: {
            file: File;
            filename: string;
            xhr: XMLHttpRequest;
            status: FileUploadStatus;
            statusMsg: string;
            percent: number;
        };
    };
}

type IWorkspaceFiles = IFiles;

interface IApplicationContext {
    isGuidedFlow: boolean;
    setGuidedFlow: (guided: boolean) => Promise<void>;

    currentWorkspace: IWorkspace;
    switchWorkspace: (id: string) => Promise<void>;

    workspaces: { [id: string]: IWorkspace };
    listWorkspaces: () => Promise<Array<IWorkspace>>;
    createWorkspace: (workspace: IWorkspace) => Promise<IMetadata>;
    readWorkspace: (id: string) => Promise<IWorkspace>;
    updateWorkspace: (workspace: IWorkspace) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;

    currentProject: IProject;
    switchProject: (id: string) => Promise<void>;

    projects: { [id: string]: IProject };
    listProjects: () => Promise<Array<IProject>>;
    createProject: (project: IProject) => Promise<IMetadata>;
    readProject: (id: string) => Promise<IProject>;
    updateProject: (project: IProject) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;

    goToRoute: (route: string, message?: string) => void;

    files: IFiles;
    uploadFile: (
        workspaceId: string,
        projectId: string,
        projInput: IProjectInput,
        file: File,
        callback: () => void,
    ) => void;
    cancelUpload: (projectId: string, fileId: string) => void;

    workspaceFiles: IWorkspaceFiles;
    uploadWorkspaceFile: (workspaceId: string, workInput: IWorkspaceInput, file: File, callback: () => void) => void;
    cancelWorkspaceUpload: (workspaceId: string, fileId: string) => void;
}

interface IQAContext {
    problems: Array<ProblemT>;
    setResolvedProblem: (idx: number, p: ProblemT) => void;
}

// https://github.com/konveyor/move2kube/blob/main/types/qaengine/problem.go#L52-L67
/*
// Problem defines the QA problem
type Problem struct {
    ID      string           `yaml:"id" json:"id"`
    Type    SolutionFormType `yaml:"type,omitempty" json:"type,omitempty"`
    Desc    string           `yaml:"description,omitempty" json:"description,omitempty"`
    Hints   []string         `yaml:"hints,omitempty" json:"hints,omitempty"`
    Options []string         `yaml:"options,omitempty" json:"options,omitempty"`
    Default interface{}      `yaml:"default,omitempty" json:"default,omitempty"`
    Answer  interface{}      `yaml:"answer,omitempty" json:"answer,omitempty"`
}
*/
type ProblemT = {
    id: string;
    type: string;
    description: string;
    hints?: Array<string>;
    options?: Array<string>;
    default?: unknown;
    answer?: unknown;
};

type ProjectsRowT = {
    cells: [{ title: JSX.Element; id: string; name: string }, string, string];
    selected?: boolean;
};

type WorkspacesRowT = {
    cells: [{ title: JSX.Element; id: string; name: string }, string, string];
    selected?: boolean;
};

type XHRListener = (resolve: (v: IMetadata) => void, reject: (v: unknown) => void, xhr: XMLHttpRequest) => void;

type PlanProgressT = {
    files: number;
    transformers: number;
};

const DEFAULT_WORKSPACE_ID = 'default.workspace';
const PROJECT_OUTPUT_STATUS_IN_PROGRESS = 'transforming';
const PROJECT_OUTPUT_STATUS_DONE = 'done';
const SUPPORTED_ARCHIVE_FORMATS = ['.zip', '.tar', '.tar.gz', '.tgz'];

export {
    ErrHTTP400,
    ErrHTTP401,
    ErrHTTP403,
    ErrHTTP404,
    ErrHTTP409,
    ISupportInfo,
    IUserInfo,
    IMetadata,
    IWorkspace,
    IWorkspaceInput,
    IProject,
    IProjectInput,
    ProjectInputType,
    IProjectOutput,
    IPlan,
    IApplicationContext,
    IQAContext,
    ProblemT,
    ProjectsRowT,
    WorkspacesRowT,
    XHRListener,
    PlanProgressT,
    FileUploadStatus,
    DEFAULT_WORKSPACE_ID,
    PROJECT_OUTPUT_STATUS_IN_PROGRESS,
    PROJECT_OUTPUT_STATUS_DONE,
    SUPPORTED_ARCHIVE_FORMATS,
};
