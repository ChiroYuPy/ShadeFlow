import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useReactFlow } from 'reactflow';
import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface Vec4NodeData {
  label?: string;
  x?: number;
  y?: number;
  z?: number;
  w?: number;
}

export default function Vec4Node({ id, data }: { id: string; data: Vec4NodeData }) {
  const { setNodes } = useReactFlow();
  const [showEditor, setShowEditor] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);
  const inputXRef = useRef<HTMLInputElement>(null);
  const inputYRef = useRef<HTMLInputElement>(null);
  const inputZRef = useRef<HTMLInputElement>(null);
  const inputWRef = useRef<HTMLInputElement>(null);
  const [editorPosition, setEditorPosition] = useState({ top: 0, left: 0 });
  const [localValue, setLocalValue] = useState({ x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0, w: data.w ?? 0 });

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec4 }];

  // Update local value when data changes
  useEffect(() => {
    setLocalValue({ x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0, w: data.w ?? 0 });
  }, [data.x, data.y, data.z, data.w]);

  // Close editor and save changes
  const saveAndClose = useCallback(() => {
    setNodes((nds: any) =>
      nds.map((node: any) =>
        node.id === id
          ? { ...node, data: { ...node.data, x: localValue.x, y: localValue.y, z: localValue.z, w: localValue.w } }
          : node
      )
    );
    setShowEditor(false);
  }, [localValue, id, setNodes]);

  // Close editor without saving
  const closeWithoutSaving = useCallback(() => {
    setLocalValue({ x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0, w: data.w ?? 0 });
    setShowEditor(false);
  }, [data.x, data.y, data.z, data.w]);

  useEffect(() => {
    if (!showEditor) return;

    // Close on any interaction outside editor
    const handleInteraction = (event: Event) => {
      const target = event.target as Node;
      if (!editorRef.current?.contains(target)) {
        saveAndClose();
      }
    };

    // Listen for various events on window with capture to catch before ReactFlow
    const options = { capture: true };
    window.addEventListener('mousedown', handleInteraction, options);
    window.addEventListener('keydown', handleInteraction, options);
    window.addEventListener('wheel', handleInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', handleInteraction, options);
    window.addEventListener('touchmove', handleInteraction, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleInteraction, options);

    return () => {
      window.removeEventListener('mousedown', handleInteraction, options);
      window.removeEventListener('keydown', handleInteraction, options);
      window.removeEventListener('wheel', handleInteraction, { capture: true, passive: true } as any);
      window.removeEventListener('touchstart', handleInteraction, options);
      window.removeEventListener('touchmove', handleInteraction, { capture: true, passive: true } as any);
      window.removeEventListener('pointerdown', handleInteraction, options);
    };
  }, [showEditor, saveAndClose]);

  const handleValueClick = () => {
    if (!showEditor && valueRef.current) {
      const rect = valueRef.current.getBoundingClientRect();
      setEditorPosition({
        top: rect.bottom + 5,
        left: rect.left
      });
    }
    setShowEditor(!showEditor);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'x' | 'y' | 'z' | 'w') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'x') {
        inputYRef.current?.focus();
      } else if (field === 'y') {
        inputZRef.current?.focus();
      } else if (field === 'z') {
        inputWRef.current?.focus();
      } else {
        saveAndClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeWithoutSaving();
    }
  };

  return (
    <NodeWrapper title={data.label ?? 'Vec4'} outputs={outputs} icon={<NodeIcon type="vec4" />}>
      <div className="relative">
        <div
          ref={valueRef}
          className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono cursor-pointer hover:opacity-80 select-none"
          onClick={handleValueClick}
        >
          <span className="text-red-400">x: {data.x ?? 0}</span>
          <span className="text-red-400">y: {data.y ?? 0}</span>
          <span className="text-red-400">z: {data.z ?? 0}</span>
          <span className="text-red-400">w: {data.w ?? 0}</span>
        </div>
        {showEditor && createPortal(
          <div
            ref={editorRef}
            className="fixed z-[9999] bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-xl"
            style={{ top: `${editorPosition.top}px`, left: `${editorPosition.left}px` }}
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={inputXRef}
                type="number"
                value={localValue.x}
                onChange={(e) => setLocalValue({ ...localValue, x: parseFloat(e.target.value) || 0 })}
                onKeyDown={(e) => handleKeyDown(e, 'x')}
                className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-red-400 font-mono text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                step="0.01"
                placeholder="x"
                autoFocus
              />
              <input
                ref={inputYRef}
                type="number"
                value={localValue.y}
                onChange={(e) => setLocalValue({ ...localValue, y: parseFloat(e.target.value) || 0 })}
                onKeyDown={(e) => handleKeyDown(e, 'y')}
                className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-red-400 font-mono text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                step="0.01"
                placeholder="y"
              />
              <input
                ref={inputZRef}
                type="number"
                value={localValue.z}
                onChange={(e) => setLocalValue({ ...localValue, z: parseFloat(e.target.value) || 0 })}
                onKeyDown={(e) => handleKeyDown(e, 'z')}
                className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-red-400 font-mono text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                step="0.01"
                placeholder="z"
              />
              <input
                ref={inputWRef}
                type="number"
                value={localValue.w}
                onChange={(e) => setLocalValue({ ...localValue, w: parseFloat(e.target.value) || 0 })}
                onKeyDown={(e) => handleKeyDown(e, 'w')}
                className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-red-400 font-mono text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                step="0.01"
                placeholder="w"
              />
            </div>
          </div>,
          document.body
        )}
      </div>
    </NodeWrapper>
  );
}
