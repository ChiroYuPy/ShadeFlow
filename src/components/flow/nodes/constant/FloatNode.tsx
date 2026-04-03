import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useReactFlow } from 'reactflow';
import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface FloatNodeData {
  label?: string;
  value?: number;
}

export default function FloatNode({ id, data }: { id: string; data: FloatNodeData }) {
  const { setNodes } = useReactFlow();
  const [showEditor, setShowEditor] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);
  const [editorPosition, setEditorPosition] = useState({ top: 0, left: 0 });
  const [localValue, setLocalValue] = useState(String(data.value ?? 1));

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Float }];

  // Update local value when data changes
  useEffect(() => {
    setLocalValue(String(data.value ?? 1));
  }, [data.value]);

  // Close editor and save changes
  const saveAndClose = useCallback(() => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      setNodes((nds: any) =>
        nds.map((node: any) =>
          node.id === id
            ? { ...node, data: { ...node.data, value: numValue } }
            : node
        )
      );
    }
    setShowEditor(false);
  }, [localValue, id, setNodes]);

  // Close editor without saving
  const closeWithoutSaving = useCallback(() => {
    setLocalValue(String(data.value ?? 1));
    setShowEditor(false);
  }, [data.value]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveAndClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeWithoutSaving();
    }
  };

  return (
    <NodeWrapper title={data.label ?? 'Float'} outputs={outputs} icon={<NodeIcon type="float" />}>
      <div className="relative">
        <div
          ref={valueRef}
          className="text-lg font-mono text-blue-400 cursor-pointer hover:opacity-80 select-none"
          onClick={handleValueClick}
        >
          {data.value ?? 1}
        </div>
        {showEditor && createPortal(
          <div
            ref={editorRef}
            className="fixed z-[9999] bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-xl"
            style={{ top: `${editorPosition.top}px`, left: `${editorPosition.left}px` }}
          >
            <input
              type="number"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-32 px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              step="0.01"
              autoFocus
            />
          </div>,
          document.body
        )}
      </div>
    </NodeWrapper>
  );
}
