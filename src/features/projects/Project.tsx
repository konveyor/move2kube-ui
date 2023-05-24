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

import { Alert, PageSection, Spinner, Title, Split, SplitItem } from "@patternfly/react-core";
import { FunctionComponent } from "react";
import { useParams } from "react-router-dom";
import { useReadWorkspaceQuery } from "../workspaces/workspacesApi";
import { useReadProjectQuery } from "./projectsApi";
import { Inputs } from '../inputs/Inputs';
import { Plan } from "../plan/Plan";
import { Outputs } from "../outputs/Outputs";
import { extractErrMsg } from "../common/utils";
import { selectPlanProgressStatus } from "../plan/planSlice";
import { useAppSelector } from "../../app/hooks";

export const Project: FunctionComponent = () => {
    const { workspaceId, projectId, outputId } = useParams();
    const currentWorkspaceId: string = workspaceId ?? '';
    const currentProjectId: string = projectId ?? '';
    const currentOutputId: string = outputId ?? '';
    const { data: currentWorkspace } = useReadWorkspaceQuery(currentWorkspaceId);
    const { data: currentProject, isLoading, error, refetch: refetchProject } = useReadProjectQuery({ wid: currentWorkspaceId, pid: currentProjectId });
    const statuses = currentProject ? Object.entries(currentProject.status || {}).filter(([_k, v]) => (v)).map(([k, _v]) => k) : [];
    const projectHasInputs = currentProject && Object.keys(currentProject.inputs ?? {}).length > 0;
    const projectHasPlan = currentProject && Object.entries(currentProject.status ?? {}).some(([k, v]) => v && k === 'plan');
    const projectHasStalePlan = currentProject && Object.entries(currentProject.status ?? {}).some(([k, v]) => v && k === 'stale_plan');
    const planProgressStatus = useAppSelector(selectPlanProgressStatus(workspaceId ?? '', projectId ?? ''));
    const isPlanning = Boolean(currentProject && planProgressStatus);

    return (
        <PageSection>
            {
                error ? (
                    <Alert variant="danger" title={extractErrMsg(error)}></Alert>
                ) : isLoading ? (
                    <Spinner />
                ) : currentProject ? (<>
                    <Title headingLevel="h1">Workspace {currentWorkspace?.name ?? currentWorkspaceId} - Project {currentProject.name ?? currentProjectId}</Title>
                    <br />
                    <table className="my-table">
                        <tbody>
                            <tr><td>ID</td><td>{currentProject.id}</td></tr>
                            <tr><td>Name</td><td>{currentProject.name}</td></tr>
                            <tr><td>Description</td><td>{currentProject.description}</td></tr>
                            <tr><td>Created at</td><td>{`${new Date(currentProject.timestamp)}`}</td></tr>
                            <tr><td>Status</td><td><Split hasGutter>{statuses.map((status) => (
                                <SplitItem key={status} className="my-chip">{status}</SplitItem>
                            ))}</Split></td></tr>
                        </tbody>
                    </table>
                    <br />
                    <Inputs
                        workspaceId={currentWorkspaceId}
                        projectId={currentProjectId}
                    />
                    <br />
                    <Plan
                        isDisabled={!projectHasInputs}
                        projectHasPlan={projectHasPlan}
                        projectHasStalePlan={projectHasStalePlan}
                        workspaceId={currentWorkspaceId}
                        projectId={currentProjectId}
                        refetch={refetchProject} />
                    <br />
                    <Outputs
                        isDisabled={!projectHasInputs || !projectHasPlan || projectHasStalePlan || isPlanning}
                        workspaceId={currentWorkspaceId}
                        projectId={currentProjectId}
                        outputId={currentOutputId}
                        outputs={currentProject.outputs}
                        refetch={refetchProject} />
                </>
                ) : null
            }
        </PageSection>
    );
};
