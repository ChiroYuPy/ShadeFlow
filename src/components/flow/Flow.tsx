import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    type Connection,
    type NodeTypes,
    type EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useEffect, useCallback } from 'react';

import FloatNode from './nodes/input/FloatNode';
import Vec2Node from './nodes/input/Vec2Node';
import Vec3Node from './nodes/input/Vec3Node';
import Vec4Node from './nodes/input/Vec4Node';
import AddNode from './nodes/math/AddNode';
import MultiplyNode from './nodes/math/MultiplyNode';
import Edge from './edges/Edge';
import FlowFloatingPanel from '../ui/FlowFloatingPanel';
import { generateWGSL } from './utils/graphToWGSL';
import type { FlowEdge, NodeData } from './types/FlowTypes';
import { validateConnection } from './utils/connectionValidation';
import { ShaderType } from './types/ShaderType';

const nodeTypes: NodeTypes = {
    float: FloatNode,
    add: AddNode,
    multiply: MultiplyNode,
    vec2: Vec2Node,
    vec3: Vec3Node,
    vec4: Vec4Node,
};

const edgeTypes: EdgeTypes = {
    float: Edge,
    vec2: Edge,
    vec3: Edge,
    vec4: Edge,
};

let nodeIdCounter = 0;

function FlowContent() {
    const { getViewport } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

    const onConnect = (connection: Connection) => {
        const validation = validateConnection(connection);

        if (!validation.valid) {
            alert(`Connection rejected: ${validation.reason}`);
            return;
        }

        const edgeType = connection.sourceHandle?.split('-')[0] ?? 'default';
        setEdges((eds) => addEdge({ ...connection, type: edgeType }, eds));
    };

    const addNode = useCallback((type: string) => {
        const viewport = getViewport();
        // Center of screen in project coordinates
        const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
        const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

        const id = `${type}-${nodeIdCounter++}`;

        let newNode: NodeData;

        switch (type) {
            case 'float':
                newNode = {
                    label: 'Float',
                    value: 1,
                } as any;
                break;
            case 'vec2':
                newNode = {
                    label: 'Vec2',
                    x: 0,
                    y: 0,
                } as any;
                break;
            case 'vec3':
                newNode = {
                    label: 'Vec3',
                    x: 0,
                    y: 0,
                    z: 0,
                } as any;
                break;
            case 'vec4':
                newNode = {
                    label: 'Vec4',
                    x: 0,
                    y: 0,
                    z: 0,
                    w: 0,
                } as any;
                break;
            case 'add':
                newNode = {
                    label: 'Add',
                    type: ShaderType.Float,
                } as any;
                break;
            case 'multiply':
                newNode = {
                    label: 'Multiply',
                    type: ShaderType.Float,
                } as any;
                break;
            default:
                newNode = { label: type } as any;
        }

        setNodes((nds) => [...nds, { id, type, data: newNode, position: { x: centerX, y: centerY } }]);
    }, [getViewport, setNodes]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in input
            if ((e.target as HTMLElement).tagName === 'INPUT') return;

            switch (e.key) {
                case '1':
                    addNode('float');
                    break;
                case '2':
                    addNode('add');
                    break;
                case '3':
                    addNode('multiply');
                    break;
                case '4':
                    addNode('vec2');
                    break;
                case '5':
                    addNode('vec3');
                    break;
                case '6':
                    addNode('vec4');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [addNode]);

    const saveGraph = () => {
        const data = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'graph.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadGraph = (json: string) => {
        const parsed = JSON.parse(json);
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
    };

    const compileWGSL = () => {
        const code = generateWGSL(nodes, edges);
        console.log(code);
        alert('WGSL code generated (see console)');
    };

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            snapToGrid
            snapGrid={[20, 20]}
            fitView
            minZoom={0.5}
            maxZoom={2}
            defaultEdgeOptions={{
                animated: false,
                style: { stroke: '#888' },
            }}
        >
            <Controls />
            <Background gap={20} size={1} variant={BackgroundVariant.Dots} />
            <FlowFloatingPanel saveGraph={saveGraph} loadGraph={loadGraph} compileWGSL={compileWGSL} />
        </ReactFlow>
    );
}

export default function Flow() {
    return (
        <ReactFlowProvider>
            <div className="w-screen h-screen bg-zinc-900">
                <FlowContent />
            </div>
        </ReactFlowProvider>
    );
}
