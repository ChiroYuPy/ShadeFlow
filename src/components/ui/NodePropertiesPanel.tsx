import { useState, useEffect } from 'react';
import { useFlowData } from '../../contexts/FlowDataContext';
import { useReactFlow } from 'reactflow';

export default function NodePropertiesPanel() {
  const { nodes } = useFlowData();
  const { setNodes } = useReactFlow();
  const [localR, setLocalR] = useState('1');
  const [localG, setLocalG] = useState('1');
  const [localB, setLocalB] = useState('1');
  const [localA, setLocalA] = useState('1');

  // Get selected nodes
  const selectedNodes = nodes.filter(n => n.selected);
  const singleSelectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  // Get node info (will be undefined if no node selected)
  const node = singleSelectedNode;
  const nodeType = node?.type || '';
  const data = node?.data as any;

  // Sync local states with node data when node changes
  useEffect(() => {
    if (nodeType === 'color' && data?.r !== undefined) {
      setLocalR(data.r.toString());
      setLocalG(data.g.toString());
      setLocalB(data.b.toString());
      setLocalA(data.a.toString());
    }
  }, [node?.id, nodeType, data?.r, data?.g, data?.b, data?.a]);

  // Early return AFTER all hooks if no node selected
  if (!singleSelectedNode) return null;

  // Check if node has editable properties (constants have value props)
  const editableTypes = ['float', 'vec2', 'vec3', 'vec4', 'color'];
  const hasValueProps = editableTypes.includes(nodeType);

  // Check if this is the Output node (cannot edit label)
  const isOutputNode = nodeType === 'shaderoutput';

  // Early return if no editable properties and no label needed
  if (!hasValueProps && !data.label && !isOutputNode) return null;

  const handleValueChange = (key: string, value: number | string) => {
    if (!node) return;
    setNodes((nds: any) =>
      nds.map((n: any) =>
        n.id === node.id
          ? { ...n, data: { ...n.data, [key]: value } }
          : n
      )
    );
  };

  // Capitalize first letter for display
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-4 w-72">
        {/* Node Type */}
        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
          {capitalize(nodeType)}
        </div>

        {/* Label - always shown, disabled for Output node */}
        <div className="mb-3">
          <label className="block text-xs text-zinc-500 mb-1">
            {isOutputNode ? 'Label (Output node)' : 'Label'}
          </label>
          {isOutputNode ? (
            <div className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-500">
              Output
            </div>
          ) : (
            <input
              type="text"
              defaultValue={data.label || ''}
              onBlur={(e) => handleValueChange('label', e.target.value)}
              placeholder={capitalize(nodeType)}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
            />
          )}
        </div>

        {/* Value properties - only for constant nodes */}
        {hasValueProps && (
          <>
            {/* Float value */}
            {nodeType === 'float' && data.value !== undefined && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={data.value ?? 0}
                  onBlur={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num)) handleValueChange('value', num);
                  }}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
              </div>
            )}

            {/* Vec2 values */}
            {nodeType === 'vec2' && (
              <div className="space-y-2">
                <label className="block text-xs text-zinc-500">Values</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">X</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.x ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('x', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Y</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.y ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('y', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vec3 values */}
            {nodeType === 'vec3' && (
              <div className="space-y-2">
                <label className="block text-xs text-zinc-500">Values</label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">X</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.x ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('x', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Y</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.y ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('y', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Z</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.z ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('z', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vec4 values */}
            {nodeType === 'vec4' && (
              <div className="space-y-2">
                <label className="block text-xs text-zinc-500">Values</label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">X</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.x ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('x', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Y</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.y ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('y', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">Z</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.z ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('z', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-600 mb-1">W</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={data.w ?? 0}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) handleValueChange('w', num);
                      }}
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Color values */}
            {nodeType === 'color' && (
              <div className="space-y-3">
                <label className="block text-xs text-zinc-500 mb-2">RGBA Values (0-1)</label>

                {/* Red slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs text-zinc-600">R</label>
                    <span className="text-xs text-zinc-400 font-mono">{parseFloat(localR).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={localR}
                    onInput={(e) => setLocalR((e.target as HTMLInputElement).value)}
                    onMouseUp={(e) => {
                      const num = parseFloat((e.target as HTMLInputElement).value);
                      handleValueChange('r', num);
                    }}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                    style={{ background: 'linear-gradient(to right, #1f1f1f, rgb(255, 0, 0))' }}
                  />
                </div>

                {/* Green slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs text-zinc-600">G</label>
                    <span className="text-xs text-zinc-400 font-mono">{parseFloat(localG).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={localG}
                    onInput={(e) => setLocalG((e.target as HTMLInputElement).value)}
                    onMouseUp={(e) => {
                      const num = parseFloat((e.target as HTMLInputElement).value);
                      handleValueChange('g', num);
                    }}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    style={{ background: 'linear-gradient(to right, #1f1f1f, rgb(0, 255, 0))' }}
                  />
                </div>

                {/* Blue slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs text-zinc-600">B</label>
                    <span className="text-xs text-zinc-400 font-mono">{parseFloat(localB).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={localB}
                    onInput={(e) => setLocalB((e.target as HTMLInputElement).value)}
                    onMouseUp={(e) => {
                      const num = parseFloat((e.target as HTMLInputElement).value);
                      handleValueChange('b', num);
                    }}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    style={{ background: 'linear-gradient(to right, #1f1f1f, rgb(0, 0, 255))' }}
                  />
                </div>

                {/* Alpha slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs text-zinc-600">A</label>
                    <span className="text-xs text-zinc-400 font-mono">{parseFloat(localA).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={localA}
                    onInput={(e) => setLocalA((e.target as HTMLInputElement).value)}
                    onMouseUp={(e) => {
                      const num = parseFloat((e.target as HTMLInputElement).value);
                      handleValueChange('a', num);
                    }}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-400"
                    style={{ background: 'linear-gradient(to right, transparent, white)' }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
