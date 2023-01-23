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

import { Alert, Spinner } from "@patternfly/react-core";
import { FunctionComponent } from "react";
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import { IGraph, useGetProjectOutputGraphQuery } from "../outputsApi";
import 'reactflow/dist/style.css';
import { extractErrMsg } from "../../common/utils";

interface IGraphProps {
    workspaceId: string;
    projectId: string;
    outputId: string;
}

interface IGraphBodyProps {
    graph: IGraph;
}

const process = (x: string) => {
    return x.split('\n').map((line, i) => <div key={i}>{line}</div>);
};

export const GraphBody: FunctionComponent<IGraphBodyProps> = ({ graph }) => {
    const newNodes = graph.nodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            label: (
                <div className="on-hover">
                    {process(node.data.label as string)}
                    {node.data.pathMappings && (
                        <div className="on-hover-child">
                            <div>pathMappings:</div>
                            {process(node.data.pathMappings)}
                        </div>
                    )}
                </div>
            ),
        },
    }));

    const [nodes, _setNodes, onNodesChange] = useNodesState(newNodes);
    const [edges, _setEdges, onEdgesChange] = useEdgesState(graph.edges);

    return (
        <ReactFlow
            fitView
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
        >
            <Background />
            <Controls />
            <MiniMap />
        </ReactFlow>
    );
};

export const Graph: FunctionComponent<IGraphProps> = ({ workspaceId, projectId, outputId }) => {
    const { data: graph, isLoading, error } = useGetProjectOutputGraphQuery({ wid: workspaceId, pid: projectId, outputId });
    return (
        error ? (
            <Alert variant="danger" title={extractErrMsg(error)} />
        ) : isLoading ? (
            <Spinner />
        ) : graph ? (
            <GraphBody graph={graph} />
        ) : null
    );
};
