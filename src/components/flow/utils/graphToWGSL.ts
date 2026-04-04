import type { Node, Edge } from 'reactflow';

type NodeData = any;

// Sanitize node ID to be valid WGSL identifier (replace hyphens and special chars with underscores)
function sanitizeNodeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function generateWGSL(nodes: Node<NodeData>[], edges: Edge[]): string {
  if (nodes.length === 0) {
    return `// No nodes in the graph
struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VSOutput {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );

  var vs_out: VSOutput;
  let pos = positions[vertex_index];
  vs_out.position = vec4<f32>(pos, 0.0, 1.0);
  vs_out.uv = pos * 0.5 + 0.5;
  vs_out.uv.y = 1.0 - vs_out.uv.y;
  return vs_out;
}

@fragment
fn fs_main(vs_in: VSOutput) -> @location(0) vec4<f32> {
  // Test color - should be bright red
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}`;
  }

  const codeLines: string[] = [];
  const nodeValues: Record<string, { value: string; type: string; components?: { x?: string; y?: string; z?: string; w?: string } }> = {};
  const nodeIdMap = new Map<string, string>(); // Map original IDs to sanitized IDs

  // Build node ID mapping
  for (const node of nodes) {
    nodeIdMap.set(node.id, sanitizeNodeId(node.id));
  }

  const getInputValue = (nodeId: string, handleId: string): { value: string; type: string } => {
    const edge = edges.find((e) => e.target === nodeId && e.targetHandle === handleId);
    if (edge) {
      const sourceNodeId = nodeIdMap.get(edge.source) || edge.source;
      const sourceNode = nodeValues[sourceNodeId];
      return sourceNode || { value: '0.0', type: 'float' };
    }
    return { value: '0.0', type: 'float' };
  };

  // Process nodes to generate fragment shader code
  for (const node of nodes) {
    const sanitizedId = nodeIdMap.get(node.id) || node.id;

    switch (node.type) {
      case 'float':
        nodeValues[sanitizedId] = { value: `${node.data?.value ?? 1.0}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = ${node.data?.value ?? 1.0};`);
        break;

      case 'vec2': {
        const x = node.data?.x ?? 0.0;
        const y = node.data?.y ?? 0.0;
        nodeValues[sanitizedId] = {
          value: `vec2<f32>(${x}, ${y})`,
          type: 'vec2',
          components: { x: x.toString(), y: y.toString() }
        };
        codeLines.push(`  let ${sanitizedId} = vec2<f32>(${x}, ${y});`);
        break;
      }

      case 'vec3': {
        const x = node.data?.x ?? 0.0;
        const y = node.data?.y ?? 0.0;
        const z = node.data?.z ?? 0.0;
        nodeValues[sanitizedId] = {
          value: `vec3<f32>(${x}, ${y}, ${z})`,
          type: 'vec3',
          components: { x: x.toString(), y: y.toString(), z: z.toString() }
        };
        codeLines.push(`  let ${sanitizedId} = vec3<f32>(${x}, ${y}, ${z});`);
        break;
      }

      case 'vec4': {
        const x = node.data?.x ?? 0.0;
        const y = node.data?.y ?? 0.0;
        const z = node.data?.z ?? 0.0;
        const w = node.data?.w ?? 1.0;
        nodeValues[sanitizedId] = {
          value: `vec4<f32>(${x}, ${y}, ${z}, ${w})`,
          type: 'vec4',
          components: { x: x.toString(), y: y.toString(), z: z.toString(), w: w.toString() }
        };
        codeLines.push(`  let ${sanitizedId} = vec4<f32>(${x}, ${y}, ${z}, ${w});`);
        break;
      }

      case 'color': {
        const r = node.data?.r ?? 1.0;
        const g = node.data?.g ?? 1.0;
        const b = node.data?.b ?? 1.0;
        nodeValues[sanitizedId] = {
          value: `vec4<f32>(${r}, ${g}, ${b}, 1.0)`,
          type: 'vec4',
          components: { x: r.toString(), y: g.toString(), z: b.toString(), w: '1.0' }
        };
        codeLines.push(`  let ${sanitizedId} = vec4<f32>(${r}, ${g}, ${b}, 1.0);`);
        break;
      }

      case 'add': {
        const nodeType = node.data?.type ?? 'float';
        const a = getInputValue(node.id, `${nodeType}-input-1`);
        const b = getInputValue(node.id, `${nodeType}-input-2`);
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: nodeType };
        codeLines.push(`  let ${sanitizedId} = ${a.value} + ${b.value};`);
        break;
      }

      case 'subtract': {
        const nodeType = node.data?.type ?? 'float';
        const a = getInputValue(node.id, `${nodeType}-input-1`);
        const b = getInputValue(node.id, `${nodeType}-input-2`);
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: nodeType };
        codeLines.push(`  let ${sanitizedId} = ${a.value} - ${b.value};`);
        break;
      }

      case 'multiply': {
        const nodeType = node.data?.type ?? 'float';
        const a = getInputValue(node.id, `${nodeType}-input-1`);
        const b = getInputValue(node.id, `${nodeType}-input-2`);
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: nodeType };
        codeLines.push(`  let ${sanitizedId} = ${a.value} * ${b.value};`);
        break;
      }

      case 'divide': {
        const nodeType = node.data?.type ?? 'float';
        const a = getInputValue(node.id, `${nodeType}-input-1`);
        const b = getInputValue(node.id, `${nodeType}-input-2`);
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: nodeType };
        codeLines.push(`  let ${sanitizedId} = ${a.value} / ${b.value};`);
        break;
      }

      case 'power': {
        const a = getInputValue(node.id, 'float-input-1');
        const b = getInputValue(node.id, 'float-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = pow(${a.value}, ${b.value});`);
        break;
      }

      case 'sqrt': {
        const a = getInputValue(node.id, 'float-input-1');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = sqrt(${a.value});`);
        break;
      }

      case 'abs': {
        const a = getInputValue(node.id, 'float-input-1');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = abs(${a.value});`);
        break;
      }

      case 'min': {
        const a = getInputValue(node.id, 'float-input-1');
        const b = getInputValue(node.id, 'float-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = min(${a.value}, ${b.value});`);
        break;
      }

      case 'max': {
        const a = getInputValue(node.id, 'float-input-1');
        const b = getInputValue(node.id, 'float-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = max(${a.value}, ${b.value});`);
        break;
      }

      case 'clamp': {
        const a = getInputValue(node.id, 'float-input-1');
        const b = getInputValue(node.id, 'float-input-2');
        const c = getInputValue(node.id, 'float-input-3');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = clamp(${a.value}, ${b.value}, ${c.value});`);
        break;
      }

      case 'mix': {
        const a = getInputValue(node.id, 'float-input-1');
        const b = getInputValue(node.id, 'float-input-2');
        const c = getInputValue(node.id, 'float-input-3');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = mix(${a.value}, ${b.value}, ${c.value});`);
        break;
      }

      case 'step': {
        const a = getInputValue(node.id, 'float-input-1');
        const b = getInputValue(node.id, 'float-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = step(${a.value}, ${b.value});`);
        break;
      }

      case 'smoothstep': {
        const a = getInputValue(node.id, 'float-input-1');
        const b = getInputValue(node.id, 'float-input-2');
        const c = getInputValue(node.id, 'float-input-3');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = smoothstep(${a.value}, ${b.value}, ${c.value});`);
        break;
      }

      case 'sin': {
        const a = getInputValue(node.id, 'float-input-1');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = sin(${a.value});`);
        break;
      }

      case 'cos': {
        const a = getInputValue(node.id, 'float-input-1');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = cos(${a.value});`);
        break;
      }

      case 'tan': {
        const a = getInputValue(node.id, 'float-input-1');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = tan(${a.value});`);
        break;
      }

      case 'time': {
        nodeValues[sanitizedId] = { value: 'uniforms.time', type: 'float' };
        codeLines.push(`  let ${sanitizedId} = uniforms.time;`);
        break;
      }

      case 'deltatime': {
        nodeValues[sanitizedId] = { value: 'uniforms.deltaTime', type: 'float' };
        codeLines.push(`  let ${sanitizedId} = uniforms.deltaTime;`);
        break;
      }

      case 'uv': {
        nodeValues[sanitizedId] = { value: 'vs_in.uv', type: 'vec2' };
        codeLines.push(`  let ${sanitizedId} = vs_in.uv;`);
        break;
      }

      case 'keydown': {
        nodeValues[sanitizedId] = { value: `uniforms.keys[${node.data?.key ?? 0}]`, type: 'bool' };
        codeLines.push(`  let ${sanitizedId} = uniforms.keys[${node.data?.key ?? 0}];`);
        break;
      }

      case 'keyup': {
        nodeValues[sanitizedId] = { value: `!uniforms.keys[${node.data?.key ?? 0}]`, type: 'bool' };
        codeLines.push(`  let ${sanitizedId} = !uniforms.keys[${node.data?.key ?? 0}];`);
        break;
      }

      case 'cursordown': {
        nodeValues[sanitizedId] = { value: 'uniforms.mouseDown', type: 'bool' };
        codeLines.push(`  let ${sanitizedId} = uniforms.mouseDown;`);
        break;
      }

      case 'cursorup': {
        nodeValues[sanitizedId] = { value: '!uniforms.mouseDown', type: 'bool' };
        codeLines.push(`  let ${sanitizedId} = !uniforms.mouseDown;`);
        break;
      }

      case 'cursorpos': {
        nodeValues[sanitizedId] = { value: 'uniforms.mousePos', type: 'vec2' };
        codeLines.push(`  let ${sanitizedId} = uniforms.mousePos;`);
        break;
      }

      case 'and': {
        const a = getInputValue(node.id, 'bool-input-1');
        const b = getInputValue(node.id, 'bool-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'bool' };
        codeLines.push(`  let ${sanitizedId} = ${a.value} && ${b.value};`);
        break;
      }

      case 'or': {
        const a = getInputValue(node.id, 'bool-input-1');
        const b = getInputValue(node.id, 'bool-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'bool' };
        codeLines.push(`  let ${sanitizedId} = ${a.value} || ${b.value};`);
        break;
      }

      case 'not': {
        const a = getInputValue(node.id, 'bool-input-1');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'bool' };
        codeLines.push(`  let ${sanitizedId} = !${a.value};`);
        break;
      }

      case 'compare': {
        const a = getInputValue(node.id, 'float-input-1');
        const b = getInputValue(node.id, 'float-input-2');
        const op = node.data?.operator ?? '==';
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'bool' };
        codeLines.push(`  let ${sanitizedId} = ${a.value} ${op} ${b.value};`);
        break;
      }

      case 'if': {
        const condition = getInputValue(node.id, 'bool-input-1');
        const trueValue = getInputValue(node.id, 'float-input-2');
        const falseValue = getInputValue(node.id, 'float-input-3');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = select(${falseValue.value}, ${trueValue.value}, ${condition.value});`);
        break;
      }

      case 'dot': {
        const a = getInputValue(node.id, 'vec2-input-1');
        const b = getInputValue(node.id, 'vec2-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = dot(${a.value}, ${b.value});`);
        break;
      }

      case 'cross': {
        const a = getInputValue(node.id, 'vec3-input-1');
        const b = getInputValue(node.id, 'vec3-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'vec3' };
        codeLines.push(`  let ${sanitizedId} = cross(${a.value}, ${b.value});`);
        break;
      }

      case 'normalize': {
        const a = getInputValue(node.id, 'vec2-input-1');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'vec2' };
        codeLines.push(`  let ${sanitizedId} = normalize(${a.value});`);
        break;
      }

      case 'length': {
        const a = getInputValue(node.id, 'vec2-input-1');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = length(${a.value});`);
        break;
      }

      case 'distance': {
        const a = getInputValue(node.id, 'vec2-input-1');
        const b = getInputValue(node.id, 'vec2-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'float' };
        codeLines.push(`  let ${sanitizedId} = distance(${a.value}, ${b.value});`);
        break;
      }

      case 'reflect': {
        const a = getInputValue(node.id, 'vec2-input-1');
        const b = getInputValue(node.id, 'vec2-input-2');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'vec2' };
        codeLines.push(`  let ${sanitizedId} = reflect(${a.value}, ${b.value});`);
        break;
      }

      case 'refract': {
        const a = getInputValue(node.id, 'vec2-input-1');
        const b = getInputValue(node.id, 'vec2-input-2');
        const c = getInputValue(node.id, 'float-input-3');
        nodeValues[sanitizedId] = { value: `${sanitizedId}`, type: 'vec2' };
        codeLines.push(`  let ${sanitizedId} = refract(${a.value}, ${b.value}, ${c.value});`);
        break;
      }

      case 'matrixidentity': {
        nodeValues[sanitizedId] = { value: `mat4x4<f32>()`, type: 'mat4' };
        codeLines.push(`  let ${sanitizedId} = mat4x4<f32>();`);
        break;
      }

      case 'matrixmultiply': {
        nodeValues[sanitizedId] = { value: `mat4x4<f32>()`, type: 'mat4' };
        codeLines.push(`  let ${sanitizedId} = mat4x4<f32>();`);
        break;
      }

      case 'matrixinverse': {
        nodeValues[sanitizedId] = { value: `mat4x4<f32>()`, type: 'mat4' };
        codeLines.push(`  let ${sanitizedId} = mat4x4<f32>();`);
        break;
      }

      case 'matrixtranspose': {
        nodeValues[sanitizedId] = { value: `mat4x4<f32>()`, type: 'mat4' };
        codeLines.push(`  let ${sanitizedId} = mat4x4<f32>();`);
        break;
      }
    }
  }

  // Find output node
  const outputNode = nodes.find(n => n.type === 'shaderoutput');
  let finalColor = 'vec4<f32>(0.0, 0.0, 0.0, 1.0)';

  if (outputNode) {
    // Get input connected to output node
    const inputEdge = edges.find(e => e.target === outputNode.id && e.targetHandle === 'vec4-input');
    if (inputEdge) {
      const sanitizedSourceId = nodeIdMap.get(inputEdge.source) || inputEdge.source;
      const nodeVal = nodeValues[sanitizedSourceId];
      if (nodeVal) {
        if (nodeVal.type === 'vec4') {
          finalColor = nodeVal.value;
        } else if (nodeVal.type === 'vec3') {
          if (nodeVal.components) {
            finalColor = `vec4<f32>(${nodeVal.components.x}, ${nodeVal.components.y}, ${nodeVal.components.z}, 1.0)`;
          } else {
            finalColor = `vec4<f32>(0.0, 0.0, 0.0, 1.0)`;
          }
        } else if (nodeVal.type === 'vec2') {
          if (nodeVal.components) {
            finalColor = `vec4<f32>(${nodeVal.components.x}, ${nodeVal.components.y}, 0.0, 1.0)`;
          } else {
            finalColor = `vec4<f32>(0.0, 0.0, 0.0, 1.0)`;
          }
        } else if (nodeVal.type === 'float') {
          finalColor = `vec4<f32>(${nodeVal.value}, ${nodeVal.value}, ${nodeVal.value}, 1.0)`;
        }
      }
    }
  }

  // Build complete WGSL shader
  const shader = `// Generated WGSL Shader
struct Uniforms {
  resolution: vec2<f32>,
  time: f32,
  deltaTime: f32,
  mousePos: vec2<f32>,
  mouseDown: u32,
  frame: u32,
  keys: array<u32, 256>,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VSOutput {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );

  var vs_out: VSOutput;
  let pos = positions[vertex_index];
  vs_out.position = vec4<f32>(pos, 0.0, 1.0);
  vs_out.uv = pos * 0.5 + 0.5;
  vs_out.uv.y = 1.0 - vs_out.uv.y;
  return vs_out;
}

@fragment
fn fs_main(vs_in: VSOutput) -> @location(0) vec4<f32> {
${codeLines.join('\n')}

  // Ensure uniforms are not optimized out by referencing them
  let _unused_uniforms = uniforms.resolution.x + uniforms.time;

  return ${finalColor};
}`;

  return shader;
}
