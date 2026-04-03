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

import FloatNode from './nodes/constant/FloatNode';
import Vec2Node from './nodes/constant/Vec2Node';
import Vec3Node from './nodes/constant/Vec3Node';
import Vec4Node from './nodes/constant/Vec4Node';
import ColorNode from './nodes/constant/ColorNode';
import AddNode from './nodes/arithmetic/AddNode';
import SubtractNode from './nodes/arithmetic/SubtractNode';
import MultiplyNode from './nodes/arithmetic/MultiplyNode';
import DivideNode from './nodes/arithmetic/DivideNode';
import PowerNode from './nodes/math/PowerNode';
import SqrtNode from './nodes/math/SqrtNode';
import AbsNode from './nodes/math/AbsNode';
import MinNode from './nodes/math/MinNode';
import MaxNode from './nodes/math/MaxNode';
import ClampNode from './nodes/math/ClampNode';
import MixNode from './nodes/math/MixNode';
import StepNode from './nodes/math/StepNode';
import SmoothStepNode from './nodes/math/SmoothStepNode';
import SinNode from './nodes/trigonometry/SinNode';
import CosNode from './nodes/trigonometry/CosNode';
import TanNode from './nodes/trigonometry/TanNode';
import TimeNode from './nodes/input/TimeNode';
import DeltaTimeNode from './nodes/input/DeltaTimeNode';
import UVNode from './nodes/input/UVNode';
import KeyDownNode from './nodes/input/KeyDownNode';
import KeyUpNode from './nodes/input/KeyUpNode';
import CursorDownNode from './nodes/input/CursorDownNode';
import CursorUpNode from './nodes/input/CursorUpNode';
import CursorPosNode from './nodes/input/CursorPosNode';
import AndNode from './nodes/logic/AndNode';
import OrNode from './nodes/logic/OrNode';
import NotNode from './nodes/logic/NotNode';
import CompareNode from './nodes/logic/CompareNode';
import IfNode from './nodes/logic/IfNode';
import DotNode from './nodes/vector/DotNode';
import CrossNode from './nodes/vector/CrossNode';
import NormalizeNode from './nodes/vector/NormalizeNode';
import LengthNode from './nodes/vector/LengthNode';
import DistanceNode from './nodes/vector/DistanceNode';
import ReflectNode from './nodes/vector/ReflectNode';
import RefractNode from './nodes/vector/RefractNode';
import MatrixIdentityNode from './nodes/matrix/MatrixIdentityNode';
import MatrixMultiplyNode from './nodes/matrix/MatrixMultiplyNode';
import MatrixInverseNode from './nodes/matrix/MatrixInverseNode';
import MatrixTransposeNode from './nodes/matrix/MatrixTransposeNode';
import Edge from './edges/Edge';
import FlowFloatingPanel from '../ui/FlowFloatingPanel';
import { generateWGSL } from './utils/graphToWGSL';
import type { FlowEdge, NodeData } from './types/FlowTypes';
import { validateConnection } from './utils/connectionValidation';
import { getNodeTypeByShortcut } from './nodes/NodeRegistry';

const nodeTypes: NodeTypes = {
    float: FloatNode,
    vec2: Vec2Node,
    vec3: Vec3Node,
    vec4: Vec4Node,
    color: ColorNode,
    add: AddNode,
    subtract: SubtractNode,
    multiply: MultiplyNode,
    divide: DivideNode,
    power: PowerNode,
    sqrt: SqrtNode,
    abs: AbsNode,
    min: MinNode,
    max: MaxNode,
    clamp: ClampNode,
    mix: MixNode,
    step: StepNode,
    smoothstep: SmoothStepNode,
    sin: SinNode,
    cos: CosNode,
    tan: TanNode,
    time: TimeNode,
    deltatime: DeltaTimeNode,
    uv: UVNode,
    keydown: KeyDownNode,
    keyup: KeyUpNode,
    cursordown: CursorDownNode,
    cursorup: CursorUpNode,
    cursorpos: CursorPosNode,
    and: AndNode,
    or: OrNode,
    not: NotNode,
    compare: CompareNode,
    if: IfNode,
    dot: DotNode,
    cross: CrossNode,
    normalize: NormalizeNode,
    length: LengthNode,
    distance: DistanceNode,
    reflect: ReflectNode,
    refract: RefractNode,
    matrixidentity: MatrixIdentityNode,
    matrixmultiply: MatrixMultiplyNode,
    matrixinverse: MatrixInverseNode,
    matrixtranspose: MatrixTransposeNode,
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

        // Les valeurs par défaut sont définies dans les composants de nœuds eux-mêmes
        setNodes((nds) => [...nds, { id, type, data: {}, position: { x: centerX, y: centerY } }]);
    }, [getViewport, setNodes]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in input
            if ((e.target as HTMLElement).tagName === 'INPUT') return;

            const nodeType = getNodeTypeByShortcut(e.key);
            if (nodeType) {
                addNode(nodeType);
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
