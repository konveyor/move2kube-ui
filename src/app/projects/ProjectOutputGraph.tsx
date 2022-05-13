/*
Copyright IBM Corporation 2022

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

import React, { useEffect } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    MiniMap,
    Controls,
    Background,
    Node,
    Edge,
} from 'react-flow-renderer';

interface Graph {
    nodes: Array<Node>;
    edges: Array<Edge>;
}

interface ProjectOutputGraphProps {
    graph: Graph;
}

const process = (x: string) => {
    return x.split('\n').map((line, i) => <div key={i}>{line}</div>);
};

const ProjectOutputGraph = ({ graph }: ProjectOutputGraphProps): JSX.Element => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        const d = { ...graph };
        console.log('original graph', d);
        d.nodes = d.nodes.map((node) => ({
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
        console.log('processed graph', d);
        setNodes(d.nodes);
        setEdges(d.edges);
    }, [graph, setNodes, setEdges]);

    return (
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
            <MiniMap />
            <Controls />
            <Background />
        </ReactFlow>
    );
};

export { ProjectOutputGraph, Graph };
