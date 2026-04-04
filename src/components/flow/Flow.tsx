import ReactFlow, {
    Background,
    BackgroundVariant,
    ReactFlowProvider,
    addEdge,
    useReactFlow,
    type Connection,
    type NodeTypes,
    type EdgeTypes,
    type NodeChange,
    type EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useEffect, useCallback, useState, useMemo, useRef } from 'react';

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
import OutputNode from './nodes/output/OutputNode';
import Edge from './edges/Edge';
import ContextMenu from './ui/ContextMenu';
import NodeSelectorModal from './ui/NodeSelectorModal';
import { validateConnection } from './utils/connectionValidation';
import Toolbar from './ui/Toolbar';
import { useProject } from '../../contexts/ProjectContext';
import { useFlowData } from '../../contexts/FlowDataContext';

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
    shaderoutput: OutputNode,
};

const edgeTypes: EdgeTypes = {
    float: Edge,
    vec2: Edge,
    vec3: Edge,
    vec4: Edge,
};

let nodeIdCounter = 0;

function FlowContent() {
    const { getViewport, zoomIn, zoomOut, fitView } = useReactFlow();
    const { registerFlowHandlers } = useProject();
    const { nodes, edges, setNodes, setEdges } = useFlowData();

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, [setNodes]);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, [setEdges]);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [nodeSelectorModal, setNodeSelectorModal] = useState(false);

    // Undo/Redo state
    const history = useRef<{ nodes: typeof nodes; edges: typeof edges }[]>([]);
    const historyIndex = useRef(0);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Apply dragHandle to all nodes
    const nodesWithDragHandle = useMemo(() =>
        nodes.map((node: any) => ({
            ...node,
            dragHandle: '.node-drag-handle'
        })),
        [nodes]
    );

    // Update undo/redo state - call directly to avoid render issues
    const updateHistoryState = useCallback(() => {
        const canUndoValue = historyIndex.current > 0;
        const canRedoValue = historyIndex.current < history.current.length - 1;
        setCanUndo(canUndoValue);
        setCanRedo(canRedoValue);
    }, []);

    // Save state to history
    const saveToHistory = useCallback(() => {
        history.current = [...history.current.slice(0, historyIndex.current + 1), { nodes, edges }];
        historyIndex.current = history.current.length - 1;
        const canUndoValue = historyIndex.current > 0;
        const canRedoValue = historyIndex.current < history.current.length - 1;
        setCanUndo(canUndoValue);
        setCanRedo(canRedoValue);
    }, [nodes, edges]);

    const onConnect = useCallback((connection: Connection) => {
        const validation = validateConnection(connection);

        if (!validation.valid) {
            alert(`Connection rejected: ${validation.reason}`);
            return;
        }

        const edgeType = connection.sourceHandle?.split('-')[0] ?? 'default';
        setEdges((eds) => {
            const newEdges = addEdge({ ...connection, type: edgeType }, eds);
            return newEdges;
        });

        // Save to history after state update
        history.current = [...history.current.slice(0, historyIndex.current + 1), { nodes, edges: [...edges, { ...connection, type: edgeType, id: `edge-${edges.length}` }] }];
        historyIndex.current = history.current.length - 1;
        const canUndoValue = historyIndex.current > 0;
        const canRedoValue = historyIndex.current < history.current.length - 1;
        setCanUndo(canUndoValue);
        setCanRedo(canRedoValue);
    }, [nodes, edges]);

    // Handlers for ProjectContext
    const handleExportProject = useCallback(() => {
        console.log('handleExportProject called');
        const data = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shadeflow-project.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [nodes, edges]);

    // Register handlers with ProjectContext
    useEffect(() => {
        console.log('Registering flow handlers');
        registerFlowHandlers({
            export: handleExportProject
        });
    }, [registerFlowHandlers, handleExportProject]);

    // Initialize history
    useEffect(() => {
        if (history.current.length === 0) {
            history.current = [{ nodes, edges }];
            const canUndoValue = historyIndex.current > 0;
            const canRedoValue = historyIndex.current < history.current.length - 1;
            setCanUndo(canUndoValue);
            setCanRedo(canRedoValue);
        }
    }, [nodes, edges]);

    // Toolbar actions
    const handleUndo = useCallback(() => {
        if (historyIndex.current > 0) {
            historyIndex.current -= 1;
            const { nodes: newNodes, edges: newEdges } = history.current[historyIndex.current];
            setNodes(newNodes as any);
            setEdges(newEdges as any);
            const canUndoValue = historyIndex.current > 0;
            const canRedoValue = historyIndex.current < history.current.length - 1;
            setCanUndo(canUndoValue);
            setCanRedo(canRedoValue);
        }
    }, [setNodes, setEdges]);

    const handleRedo = useCallback(() => {
        if (historyIndex.current < history.current.length - 1) {
            historyIndex.current += 1;
            const { nodes: newNodes, edges: newEdges } = history.current[historyIndex.current];
            setNodes(newNodes as any);
            setEdges(newEdges as any);
            const canUndoValue = historyIndex.current > 0;
            const canRedoValue = historyIndex.current < history.current.length - 1;
            setCanUndo(canUndoValue);
            setCanRedo(canRedoValue);
        }
    }, [setNodes, setEdges]);

    const handleZoomIn = useCallback(() => {
        zoomIn({ duration: 300 });
    }, [zoomIn]);

    const handleZoomOut = useCallback(() => {
        zoomOut({ duration: 300 });
    }, [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView({ duration: 300, padding: 0.2 });
    }, [fitView]);

    const handleDuplicate = useCallback(() => {
        const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'shaderoutput');
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

            setNodes((nds) => {
                const updated = [...nds, ...newNodes];
                saveToHistory();
                return updated;
            });
        }
    }, [nodes, setNodes, getViewport, saveToHistory]);

    const handleDelete = useCallback(() => {
        setNodes((nds) => {
            const updated = nds.filter((n) => !n.selected || n.type === 'shaderoutput');
            saveToHistory();
            return updated;
        });
        setEdges((eds) => {
            const updated = eds.filter((e) => !e.selected);
            saveToHistory();
            return updated;
        });
    }, [setNodes, setEdges, saveToHistory]);

    // Check if there are selected nodes/edges
    const hasSelection = useMemo(() => {
        return nodes.some((n) => n.selected) || edges.some((e) => e.selected);
    }, [nodes, edges]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in input
            if ((e.target as HTMLElement).tagName === 'INPUT') return;

            // Undo (Ctrl+Z)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
                return;
            }

            // Redo (Ctrl+Y or Ctrl+Shift+Z)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                handleRedo();
                return;
            }

            // Delete key to remove selected elements
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (hasSelection) {
                    handleDelete();
                }
            }

            // Ctrl+D to duplicate selected nodes
            if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleDuplicate();
            }

            // Zoom shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === '=') {
                e.preventDefault();
                handleZoomIn();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                handleZoomOut();
            }
            // Fit view (Ctrl+0)
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                handleFitView();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasSelection, handleUndo, handleRedo, handleDelete, handleDuplicate, handleZoomIn, handleZoomOut, handleFitView]);

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
                setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
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
        setNodes((nds) => nds.filter((n) => !n.selected || n.type === 'shaderoutput'));
        setEdges((eds) => eds.filter((e) => !e.selected));
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

            setNodes((nds) => [...nds, ...newNodes]);
        }
    }, [nodes, setNodes, getViewport]);

    const handleSelectNode = useCallback((nodeType: string) => {
        const viewport = getViewport();
        // Center of screen in project coordinates
        const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
        const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

        const id = `${nodeType}-${nodeIdCounter++}`;
        setNodes((nds) => [...nds, { id, type: nodeType, data: {}, position: { x: centerX, y: centerY }, dragHandle: '.node-drag-handle' }]);
    }, [setNodes, getViewport]);

    return (
        <>
            <Toolbar
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitView={handleFitView}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                canUndo={canUndo}
                canRedo={canRedo}
                hasSelection={hasSelection}
            />
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
            <style>{`
                .react-flow__node {
                    background: transparent !important;
                }
            `}</style>
            <Background gap={20} size={1} variant={BackgroundVariant.Dots} />

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
        </>
    );
}

export default function FlowContentWrapper() {
    return (
        <ReactFlowProvider>
            <FlowContent />
        </ReactFlowProvider>
    );
}
