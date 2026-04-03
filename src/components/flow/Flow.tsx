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
import { useEffect, useCallback, useState, useMemo } from 'react';

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
import ContextMenu from './ui/ContextMenu';
import NodeSelectorModal from './ui/NodeSelectorModal';
import { generateWGSL } from './utils/graphToWGSL';
import type { FlowEdge, NodeData } from './types/FlowTypes';
import { validateConnection } from './utils/connectionValidation';

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
    const { getViewport, setNodes, setEdges } = useReactFlow();
    const [nodes, , onNodesChange] = useNodesState<NodeData>([]);
    const [edges, , onEdgesChange] = useEdgesState<FlowEdge>([]);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [nodeSelectorModal, setNodeSelectorModal] = useState(false);

    // Apply dragHandle to all nodes
    const nodesWithDragHandle = useMemo(() =>
        nodes.map((node: any) => ({
            ...node,
            dragHandle: '.node-drag-handle'
        })),
        [nodes]
    );

    const onConnect = (connection: Connection) => {
        const validation = validateConnection(connection);

        if (!validation.valid) {
            alert(`Connection rejected: ${validation.reason}`);
            return;
        }

        const edgeType = connection.sourceHandle?.split('-')[0] ?? 'default';
        setEdges((eds) => addEdge({ ...connection, type: edgeType }, eds));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in input
            if ((e.target as HTMLElement).tagName === 'INPUT') return;

            // Delete key to remove selected elements
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (nodes.length > 0) {
                    setNodes((nds: any) => nds.filter((n: any) => !n.selected));
                    setEdges((eds: any) => eds.filter((e: any) => !e.selected));
                }
            }

            // Ctrl+D to duplicate selected nodes
            if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const selectedNodes = nodes.filter((n) => n.selected);
                if (selectedNodes.length > 0) {
                    const viewport = getViewport();
                    const offsetX = 50 / viewport.zoom;
                    const offsetY = 50 / viewport.zoom;

                    const newNodes = selectedNodes.map((node) => ({
                        ...node,
                        id: `${node.type}-${nodeIdCounter++}`,
                        position: {
                            x: node.position.x + offsetX,
                            y: node.position.y + offsetY,
                        },
                        selected: false,
                        dragHandle: '.node-drag-handle',
                    }));

                    setNodes((nds: any) => [...nds, ...newNodes]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, setNodes, setEdges, getViewport]);

    // Context menu handler
    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();

        // Check if we clicked on a node or edge
        const target = event.target as HTMLElement;
        const nodeElement = target.closest('.react-flow__node');
        const edgeElement = target.closest('.react-flow__edge');

        if (nodeElement) {
            // Find the node ID from the DOM element
            const nodeId = nodeElement.getAttribute('data-id');
            if (nodeId) {
                // Select this node only
                setNodes((nds: any) => nds.map((n: any) => ({ ...n, selected: n.id === nodeId })));
                // Show context menu
                setContextMenu({ x: event.clientX, y: event.clientY });
                return;
            }
        }

        if (edgeElement) {
            // Find the edge ID from the DOM element
            const edgeId = edgeElement.getAttribute('data-id');
            if (edgeId) {
                // Select this edge only
                setEdges((eds: any) => eds.map((e: any) => ({ ...e, selected: e.id === edgeId })));
                // Show context menu
                setContextMenu({ x: event.clientX, y: event.clientY });
                return;
            }
        }

        // If we didn't click on a node or edge, show node selector modal
        setNodeSelectorModal(true);
    }, [setNodes, setEdges]);

    const handleDeleteSelected = useCallback(() => {
        setNodes((nds: any) => nds.filter((n: any) => !n.selected));
        setEdges((eds: any) => eds.filter((e: any) => !e.selected));
    }, [setNodes, setEdges]);

    const handleDuplicateSelected = useCallback(() => {
        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length > 0) {
            const viewport = getViewport();
            const offsetX = 50 / viewport.zoom;
            const offsetY = 50 / viewport.zoom;

            const newNodes = selectedNodes.map((node) => ({
                ...node,
                id: `${node.type}-${nodeIdCounter++}`,
                position: {
                    x: node.position.x + offsetX,
                    y: node.position.y + offsetY,
                },
                selected: false,
                dragHandle: '.node-drag-handle',
            }));

            setNodes((nds: any) => [...nds, ...newNodes]);
        }
    }, [nodes, setNodes, getViewport]);

    const handleSelectNode = useCallback((nodeType: string) => {
        const viewport = getViewport();
        // Center of screen in project coordinates
        const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
        const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

        const id = `${nodeType}-${nodeIdCounter++}`;
        setNodes((nds: any) => [...nds, { id, type: nodeType, data: {}, position: { x: centerX, y: centerY }, dragHandle: '.node-drag-handle' }]);
    }, [setNodes, getViewport]);

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
        const nodes = (parsed.nodes as any[]).map((node: any) => ({
            ...node,
            dragHandle: '.node-drag-handle'
        }));
        setNodes(nodes);
        setEdges(parsed.edges as any);
    };

    const compileWGSL = () => {
        const code = generateWGSL(nodes, edges);
        console.log(code);
        alert('WGSL code generated (see console)');
    };

    return (
        <ReactFlow
            nodes={nodesWithDragHandle}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onContextMenu={handleContextMenu}
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

            {/* Context Menus */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onDelete={handleDeleteSelected}
                    onDuplicate={handleDuplicateSelected}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {nodeSelectorModal && (
                <NodeSelectorModal
                    onSelectNode={handleSelectNode}
                    onClose={() => setNodeSelectorModal(false)}
                />
            )}
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
