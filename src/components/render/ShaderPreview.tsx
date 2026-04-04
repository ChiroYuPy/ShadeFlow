import { useEffect, useRef, useState } from 'react';
import { generateWGSL } from '../flow/utils/graphToWGSL';
import type { Node, Edge } from 'reactflow';
import { useFlowData } from '../../contexts/FlowDataContext';

interface ShaderPreviewProps {
  className?: string;
  nodes?: Node[];
  edges?: Edge[];
}

export default function ShaderPreview({ className = '', nodes = [], edges = [] }: ShaderPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number>(0);
  const { graphStructureHash } = useFlowData();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas size
    const resizeCanvas = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Only resize if dimensions changed
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = Math.max(width, 300);
        canvas.height = Math.max(height, 300);
        console.log('Canvas resized:', canvas.width, 'x', canvas.height);
      }
    };

    // Initial resize
    resizeCanvas();

    // Also resize after a short delay to ensure container is fully rendered
    const delayedResize = setTimeout(() => {
      resizeCanvas();
      console.log('Delayed resize:', canvas.width, 'x', canvas.height);
    }, 100);

    window.addEventListener('resize', resizeCanvas);

    // Check if WebGPU is available
    // @ts-ignore - WebGPU not in TypeScript types yet
    if (!navigator.gpu) {
      setError('WebGPU is not supported in this browser');
      window.removeEventListener('resize', resizeCanvas);
      return;
    }

    // WebGPU objects (declared at this level so render can access them)
    let device: any = null;
    let context: any = null;
    let pipeline: any = null;
    let uniformBuffer: any = null;
    let bindGroup: any = null;

    // Uniform data - must match WGSL struct layout
    const uniformData = new Float32Array(264);
    const keys = new Uint32Array(256);

    // Render loop
    const render = (time: number) => {
      if (!device || !context || !pipeline || !uniformBuffer) {
        console.log('Render: Missing required objects', {
          device: !!device,
          context: !!context,
          pipeline: !!pipeline,
          uniformBuffer: !!uniformBuffer,
          bindGroup: !!bindGroup
        });
        return;
      }

      const currentTime = time * 0.001;

      // Update uniforms
      uniformData[0] = canvas.width;
      uniformData[1] = canvas.height;
      uniformData[2] = currentTime;
      uniformData[3] = 0.016;
      uniformData[4] = 0.5;
      uniformData[5] = 0.5;
      uniformData[6] = 0.0;
      uniformData[7] = 0;

      // Keys
      for (let i = 0; i < 256; i++) {
        uniformData[8 + i] = keys[i];
      }

      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      // Create command encoder
      const commandEncoder = device.createCommandEncoder();

      const textureView = context.getCurrentTexture().createView();
      // @ts-ignore - WebGPU not in TypeScript types yet
      const renderPassDescriptor = {
        colorAttachments: [{
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      };

      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline);
      if (bindGroup) {
        passEncoder.setBindGroup(0, bindGroup);
      }
      passEncoder.draw(6);
      passEncoder.end();

      device.queue.submit([commandEncoder.finish()]);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Initialize WebGPU
    const initializeWebGPU = async () => {
      try {
        // @ts-ignore
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setError('Failed to get WebGPU adapter');
          return;
        }

        device = await adapter.requestDevice();
        // @ts-ignore
        context = canvas.getContext('webgpu');

        if (!context) {
          setError('Failed to get WebGPU context');
          return;
        }

        // @ts-ignore
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
          device,
          format: presentationFormat,
          alphaMode: 'premultiplied',
        });

        // Create uniform buffer
        uniformBuffer = device.createBuffer({
          size: 1056,
          // @ts-ignore
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Generate WGSL shader
        let wgslCode = '';
        try {
          wgslCode = generateWGSL(nodes, edges);
          console.log('Generated WGSL:', wgslCode);
          setError(null);
        } catch (e) {
          console.error('WGSL generation error:', e);
          setError(e instanceof Error ? e.message : 'Shader generation failed');
          return;
        }

        // Create shader module
        const shaderModule = device.createShaderModule({ code: wgslCode });

        // Check for shader compilation errors
        const compilationInfo = await shaderModule.getCompilationInfo();
        if (compilationInfo.messages.length > 0) {
          console.log('Shader compilation messages:');
          for (const msg of compilationInfo.messages) {
            console.log(`  ${msg.type}: ${msg.message} (line ${msg.lineNum}, col ${msg.linePos})`);
          }
          const hasErrors = compilationInfo.messages.some((msg: any) => msg.type === 'error');
          if (hasErrors) {
            setError('Shader compilation failed. Check console for details.');
            return;
          }
        }

        // Create render pipeline
        try {
          pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
              module: shaderModule,
              entryPoint: 'vs_main',
            },
            fragment: {
              module: shaderModule,
              entryPoint: 'fs_main',
              targets: [{
                format: presentationFormat,
              }],
            },
            primitive: {
              topology: 'triangle-list',
            },
          });
          console.log('Pipeline created successfully');
        } catch (pipelineError) {
          console.error('Pipeline creation error:', pipelineError);
          setError(`Pipeline creation failed: ${pipelineError}`);
          return;
        }

        // Create bind group
        try {
          const bindGroupLayout = pipeline.getBindGroupLayout(0);
          bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
          });
          console.log('Bind group created successfully');

          // Start render loop AFTER WebGPU is fully initialized
          console.log('WebGPU initialized, starting render loop...');
          console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

          animationFrameRef.current = requestAnimationFrame(render);

        } catch (bindGroupError) {
          console.error('Bind group creation error:', bindGroupError);
          bindGroup = null;

          // Still start render loop even without bind group
          animationFrameRef.current = requestAnimationFrame(render);
        }

      } catch (e) {
        setError(e instanceof Error ? e.message : 'WebGPU initialization failed');
        return;
      }
    };

    // Event handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      uniformData[4] = x;
      uniformData[5] = y;
    };

    const handleMouseDown = () => {
      uniformData[6] = 1.0;
    };

    const handleMouseUp = () => {
      uniformData[6] = 0.0;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode < 256) {
        keys[e.keyCode] = 1;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.keyCode < 256) {
        keys[e.keyCode] = 0;
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Initialize WebGPU (async)
    initializeWebGPU();

    return () => {
      clearTimeout(delayedResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [graphStructureHash]);

  return (
    <div ref={containerRef} className={`w-full h-full bg-black ${className}`} style={{ minHeight: '400px' }}>
      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-black">
          <div className="max-w-md text-center p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {error.includes('not supported') ? 'Platform Not Compatible' : 'WebGPU Error'}
            </h2>

            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              {error}
            </p>

            {error.includes('not supported') && (
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 text-left">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-zinc-400">
                    <p className="font-medium text-zinc-300 mb-1">WebGPU is not supported on your browser</p>
                    <p className="text-xs">
                      Please use a browser that supports WebGPU, such as Chrome 113+, Edge 113+, or Firefox Nightly with WebGPU enabled.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error.includes('not supported') && (
              <div className="mt-4 text-xs text-zinc-500">
                <p>Supported browsers: Chrome 113+, Edge 113+, Firefox Nightly</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
}
