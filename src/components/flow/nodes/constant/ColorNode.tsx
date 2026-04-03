import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useReactFlow } from 'reactflow';
import { RgbColorPicker } from "react-colorful";
import { ShaderType } from '../../types/ShaderType';
import type { PortDef } from '../NodeWrapper';
import NodeWrapper from '../NodeWrapper';
import NodeIcon from '../NodeIcon';

export interface ColorNodeData {
  label?: string;
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}

export default function ColorNode({ id, data }: { id: string; data: ColorNodeData }) {
  const { setNodes } = useReactFlow();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  // Local state for temporary color changes
  const [localColor, setLocalColor] = useState(() => ({
    r: Math.round((data.r ?? 1) * 255),
    g: Math.round((data.g ?? 1) * 255),
    b: Math.round((data.b ?? 1) * 255)
  }));

  const outputs: PortDef[] = [{ label: 'out', shaderType: ShaderType.Vec4 }];

  // Convert RGB values to CSS color string
  const r = data.r ?? 1;
  const g = data.g ?? 1;
  const b = data.b ?? 1;
  const a = data.a ?? 1;

  const colorStyle = {
    backgroundColor: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
  };

  // Update local color when data changes (from outside)
  useEffect(() => {
    setLocalColor({
      r: Math.round((data.r ?? 1) * 255),
      g: Math.round((data.g ?? 1) * 255),
      b: Math.round((data.b ?? 1) * 255)
    });
  }, [data.r, data.g, data.b]);

  // Close picker and save changes
  const saveAndClose = useCallback(() => {
    setNodes((nds: any) =>
      nds.map((node: any) =>
        node.id === id
          ? { ...node, data: { ...node.data, r: localColor.r / 255, g: localColor.g / 255, b: localColor.b / 255 } }
          : node
      )
    );
    setShowPicker(false);
  }, [localColor, id, setNodes]);

  // Close picker without saving
  const closeWithoutSaving = useCallback(() => {
    setLocalColor({
      r: Math.round((data.r ?? 1) * 255),
      g: Math.round((data.g ?? 1) * 255),
      b: Math.round((data.b ?? 1) * 255)
    });
    setShowPicker(false);
  }, [data.r, data.g, data.b]);

  useEffect(() => {
    if (!showPicker) return;

    // Close on any interaction outside picker
    const handleInteraction = (event: Event) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target)) {
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
  }, [showPicker, saveAndClose]);

  const handleColorClick = () => {
    if (!showPicker && colorRef.current) {
      const rect = colorRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + 5,
        left: rect.left
      });
    }
    setShowPicker(!showPicker);
  };

  const handleColorChange = (newColor: { r: number; g: number; b: number }) => {
    // Only update local state, not node data
    setLocalColor(newColor);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveAndClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeWithoutSaving();
    }
  };

  return (
    <NodeWrapper title={data.label ?? 'Color'} outputs={outputs} icon={<NodeIcon type="color" />}>
      <div className="relative">
        <div
          ref={colorRef}
          className="w-12 h-12 rounded border border-zinc-600 cursor-pointer hover:opacity-80 transition-opacity"
          style={colorStyle}
          onClick={handleColorClick}
        />
      </div>
      {showPicker && createPortal(
        <div
          ref={pickerRef}
          className="fixed z-[9999] bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-xl"
          style={{ top: `${pickerPosition.top}px`, left: `${pickerPosition.left}px` }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <RgbColorPicker
            color={localColor}
            onChange={handleColorChange}
          />
        </div>,
        document.body
      )}
    </NodeWrapper>
  );
}
