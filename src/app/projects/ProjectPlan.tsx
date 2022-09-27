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

import Yaml from 'js-yaml';
import {
    Card,
    Alert,
    Button,
    Toolbar,
    Spinner,
    CardBody,
    TextArea,
    CardTitle,
    CardHeader,
    ToolbarItem,
    ToolbarContent,
} from '@patternfly/react-core';
import { useEffect, useState } from 'react';
import { ErrHTTP401, IProject, IWorkspace, PlanProgressT, ProjectInputType } from '../common/types';
import { startPlanning, readPlan, updatePlan, waitForPlan } from '../networking/api';

interface IProjectPlanProps {
    refreshToggle: boolean;
    workspace: IWorkspace;
    project: IProject;
    refresh: () => void;
}

function ProjectPlan(props: IProjectPlanProps): JSX.Element {
    const [isPlanning, setIsPlanning] = useState(false);
    const [actualPlan, setActualPlan] = useState('');
    const [plan, setPlan] = useState('');
    const [planErr, setPlanErr] = useState<Error | string | null>(null);
    useEffect(() => {
        console.log('inside useEffect ProjectPlan');
        setIsPlanning(false);
        setActualPlan('');
        setPlan('');
        setPlanErr(null);
        if (props.project.status?.plan_error) {
            console.log('inside useEffect ProjectPlan, if plan error block');
            setPlanErr('planning was either cancelled or the timeout was exceeded');
        } else if (props.project.status?.plan) {
            console.log('inside useEffect ProjectPlan, if plan block');
            readPlan(props.workspace.id, props.project.id)
                .then((p) => {
                    console.log('inside useEffect ProjectPlan, if then block, plan:', p);
                    setActualPlan(p);
                    setPlan(p);
                })
                .catch(setPlanErr);
        }
    }, [
        props.refreshToggle,
        props.workspace.id,
        props.project.id,
        props.project.status?.plan,
        props.project.status?.plan_error,
    ]);
    let disableThisSection =
        (!props.project.status?.[ProjectInputType.Sources] &&
            !props.project.status?.[ProjectInputType.Customizations]) ||
        isPlanning;
    if (disableThisSection && !isPlanning && props.project.status?.[ProjectInputType.Reference]) {
        if (
            Object.values(props.project.inputs || {})
                .filter((x) => x.type === ProjectInputType.Reference)
                .map((x) => props.workspace.inputs?.[x.id])
                .some((x) => x?.type === ProjectInputType.Sources || x?.type === ProjectInputType.Customizations)
        ) {
            disableThisSection = false;
        }
    }
    return (
        <Card>
            <CardTitle>Plan</CardTitle>
            <CardHeader>
                <Toolbar>
                    <ToolbarContent>
                        <ToolbarItem>
                            <Button
                                isDisabled={disableThisSection}
                                onClick={() => {
                                    setIsPlanning(true);
                                    startPlanning(props.workspace.id, props.project.id)
                                        .then(() =>
                                            waitForPlan(
                                                props.workspace.id,
                                                props.project.id,
                                                (x: PlanProgressT) =>
                                                    x.files >= 0 &&
                                                    x.transformers >= 0 &&
                                                    setPlanErr(
                                                        `${x.transformers} transformers started and ${x.files} folders analyzed`,
                                                    ),
                                            ),
                                        )
                                        .then(() => {
                                            setIsPlanning(false);
                                            setPlanErr(null);
                                            props.refresh();
                                        })
                                        .catch((e) => {
                                            setIsPlanning(false);
                                            setPlanErr(e);
                                            if (e instanceof ErrHTTP401) props.refresh();
                                        });
                                }}
                            >
                                Start Planning
                            </Button>
                        </ToolbarItem>
                        <ToolbarItem>
                            <Button
                                isDisabled={disableThisSection || !props.project.status?.plan}
                                onClick={() => {
                                    try {
                                        console.log('save button clicked for plan:', Yaml.load(plan));
                                    } catch (e) {
                                        return setPlanErr(e as Error);
                                    }
                                    updatePlan(props.workspace.id, props.project.id, plan)
                                        .then(() => {
                                            setActualPlan(plan);
                                            setPlanErr(null);
                                            props.refresh();
                                        })
                                        .catch(setPlanErr);
                                }}
                            >
                                Save
                            </Button>
                        </ToolbarItem>
                        {isPlanning && <Spinner isSVG />}
                        {!isPlanning && plan !== actualPlan && (
                            <ToolbarItem>
                                <Alert variant="warning" title="*unsaved changes*" />
                            </ToolbarItem>
                        )}
                        {!isPlanning && props.project.status?.plan && props.project.status?.stale_plan && (
                            <ToolbarItem>
                                <Alert
                                    variant="warning"
                                    title="The inputs have changed since the last time the plan was generated. Please generate the plan again."
                                />
                            </ToolbarItem>
                        )}
                        {planErr && (
                            <Alert variant={typeof planErr === 'string' ? 'info' : 'danger'} title={`${planErr}`} />
                        )}
                    </ToolbarContent>
                </Toolbar>
            </CardHeader>
            <CardBody>
                <TextArea
                    isRequired
                    name="plan"
                    aria-label="plan"
                    resizeOrientation="vertical"
                    isDisabled={disableThisSection || !props.project.status?.plan}
                    validated={planErr ? 'error' : 'default'}
                    value={plan}
                    onChange={setPlan}
                    rows={20}
                />
            </CardBody>
        </Card>
    );
}

ProjectPlan.displayName = 'ProjectPlan';

export { ProjectPlan };
