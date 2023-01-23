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

import { Alert, Button, Card, CardBody, Spinner, Split, SplitItem, TextArea, Title } from "@patternfly/react-core";
import { FunctionComponent, useEffect, useState } from "react";
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-yaml';
import 'prismjs/themes/prism.css';
import { useReadPlanQuery, useStartPlanningMutation, useUpdatePlanMutation } from "./planApi";
import { extractErrMsg } from "../common/utils";

export interface IPlanProps {
    isDisabled?: boolean;
    projectHasPlan?: boolean;
    projectHasStalePlan?: boolean;
    workspaceId: string;
    projectId: string;
    refetch?: () => void;
}

const hightlightWithLineNumbers = (input: string) =>
    Prism.highlight(input, Prism.languages.yaml, 'yaml')
        .split("\n")
        .map((line, i) => `<span class='editorLineNumber'>${i + 1}</span>${line}`)
        .join("\n");

const NoPlanText: FunctionComponent = () => (
    <TextArea isDisabled aria-label="empty plan" rows={10}></TextArea>
);

export const Plan: FunctionComponent<IPlanProps> = ({
    workspaceId, projectId, isDisabled, projectHasPlan, projectHasStalePlan, refetch,
}) => {
    isDisabled = isDisabled ?? false;
    const {
        data: planObj,
        isLoading: isGettingPlan,
        isFetching: isGettingPlanAgain,
        error: getPlanErr,
    } = useReadPlanQuery({ wid: workspaceId, pid: projectId }, { skip: isDisabled });
    const [startPlanning, { isLoading: isPlanStarting, error: startPlanError }] = useStartPlanningMutation();
    const [updatePlan, { isLoading: isUpdatingPlan, error: updatePlanError }] = useUpdatePlanMutation();
    const [currentPlan, setCurrentPlan] = useState(planObj?.plan || '');
    useEffect(() => {
        setCurrentPlan(planObj?.plan ?? '');
        try {
            if (refetch) refetch();
        } catch (e) {
            console.log(`${e}`);
        }
    }, [planObj?.plan, refetch]);

    return (
        <Card>
            <CardBody>
                <Title headingLevel="h3">Plan</Title>
                <br />
                <Split hasGutter>
                    <SplitItem>
                        <Button
                            isDisabled={isDisabled || isPlanStarting || isUpdatingPlan || isGettingPlan || isGettingPlanAgain}
                            onClick={() => {
                                startPlanning({ wid: workspaceId, pid: projectId });
                            }}
                        >
                            Start Planning
                        </Button>
                    </SplitItem>
                    <SplitItem>
                        <Button
                            isDisabled={isDisabled || isUpdatingPlan || !currentPlan || currentPlan === planObj?.plan}
                            onClick={() => updatePlan({ wid: workspaceId, pid: projectId, plan: currentPlan })}
                        >
                            Save
                        </Button>
                    </SplitItem>
                    {(isGettingPlan || isGettingPlanAgain) &&
                        <SplitItem>
                            <Spinner size="lg" />
                        </SplitItem>
                    }
                </Split>
                <br />
                {startPlanError && <><Alert variant="danger" title={extractErrMsg(startPlanError)} /><br /></>}
                {updatePlanError && <><Alert variant="danger" title={extractErrMsg(updatePlanError)} /><br /></>}
                {!isDisabled && projectHasPlan && projectHasStalePlan && <>
                    <Alert
                        variant="warning"
                        title="The inputs have changed since the last time the plan was generated. Please generate the plan again." />
                    <br />
                </>}
                {(isGettingPlan || isGettingPlanAgain) ? (
                    <NoPlanText />
                ) : getPlanErr ? (
                    <>
                        {(getPlanErr as { status: number })?.status !== 404 && <Alert variant="danger" title={extractErrMsg(getPlanErr)} />}
                        <NoPlanText />
                    </>
                ) : planObj ? (
                    <div className="wrap-editor">
                        <Editor
                            readOnly={isDisabled}
                            value={currentPlan}
                            onValueChange={p => setCurrentPlan(p)}
                            highlight={code => hightlightWithLineNumbers(code)}
                            padding={10}
                            textareaId="codeArea"
                            className="editor"
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 18,
                                outline: 0
                            }}
                        />
                    </div>
                ) : (
                    <NoPlanText />
                )}
            </CardBody>
        </Card>
    );
};
