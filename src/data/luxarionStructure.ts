import { FileNode } from '../types';

export const luxarionTree: FileNode = {
  name: 'luxarion',
  type: 'directory',
  path: '/',
  children: [
    {
      name: 'src',
      type: 'directory',
      path: '/src',
      children: [
        {
          name: 'core',
          type: 'directory',
          path: '/src/core',
          children: [
            {
              name: 'renderers',
              type: 'directory',
              path: '/src/core/renderers',
              children: [
                {
                  name: 'WebGLRenderer.js',
                  type: 'file',
                  path: '/src/core/renderers/WebGLRenderer.js',
                  description: 'The core renderer for WebGL fallback mode. Responsible for managing the underlying WebGL context, compiling GLSL shaders, handling clipping planes, and setting up render state transitions efficiently.',
                  codeSnippet: `/**
 * Luxarion WebGL 1.0 & 2.0 Fallback Renderer
 * Designed for standard hardware support and legacy contexts.
 */
import { WebGLExtensions } from './WebGL/WebGLExtensions.js';
import { WebGLState } from './WebGL/WebGLState.js';
import { WebGLCapabilities } from './WebGL/WebGLCapabilities.js';
import { Color } from '../../math/Color.js';

export class WebGLRenderer {
  constructor(parameters = {}) {
    this.canvas = parameters.canvas || document.createElement('canvas');
    this.context = this.canvas.getContext('webgl2', {
      alpha: parameters.alpha !== undefined ? parameters.alpha : false,
      depth: parameters.depth !== undefined ? parameters.depth : true,
      antialias: parameters.antialias !== undefined ? parameters.antialias : true,
    });
    
    this.state = new WebGLState(this.context);
    this.capabilities = new WebGLCapabilities(this.context);
    this._clearColor = new Color(0x0a0a0c);
    
    console.log("Luxarion WebGLRenderer initialized. GLSL Supported version: 300 es");
  }

  setClearColor(color, opacity = 1.0) {
    this._clearColor.copy(color);
    const gl = this.context;
    gl.clearColor(color.r, color.g, color.b, opacity);
  }

  render(scene, camera) {
    const gl = this.context;
    
    // Bind state and capabilities
    this.state.reset();
    
    // Perform Frustum Culling & Create Render List
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const renderList = scene.getRenderList(camera);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let object of renderList) {
      this.renderObject(object, scene, camera);
    }
  }
}`
                },
                {
                  name: 'WebGPURenderer.js',
                  type: 'file',
                  path: '/src/core/renderers/WebGPURenderer.js',
                  description: 'High-performance next-gen 3D renderer designed for modern GPUs. Utilizes the WebGPU API to support compute shaders, custom bind groups, command buffers, pipelines, GPU-driven instancing, and asynchronous resource allocation.',
                  codeSnippet: `/**
 * Luxarion High-Performance WebGPURenderer
 * Utilizing next-generation WebGPU API for compute pipelines.
 */
import { WebGPUBackend } from './WebGPU/WebGPUBackend.js';
import { WebGPUBindings } from './WebGPU/WebGPUBindings.js';
import { WebGPUPipeline } from './WebGPU/WebGPUPipeline.js';

export class WebGPURenderer {
  constructor(parameters = {}) {
    this.canvas = parameters.canvas || document.createElement('canvas');
    this.backend = new WebGPUBackend(this.canvas);
    this.bindings = new WebGPUBindings(this.backend);
    this.pipelines = new WebGPUPipeline(this.backend);
    this.initialized = false;
  }

  async init() {
    await this.backend.init();
    this.device = this.backend.device;
    this.context = this.backend.context;
    this.initialized = true;
    console.log("Luxarion WebGPURenderer Ready. GPUAdapter Name:", this.backend.adapterInfo.device);
  }

  render(scene, camera) {
    if (!this.initialized) return;

    const device = this.device;
    const commandEncoder = device.createCommandEncoder();
    
    // Compute pass before render pass (GPU-driven updates)
    this.backend.runComputePipelines(commandEncoder);
    
    const renderPassDescriptor = this.backend.getRenderPassDescriptor();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
    scene.updateMatrixWorld();
    
    // Dynamic binding and instancing
    const renderList = scene.getRenderList(camera);
    for (let object of renderList) {
      const pipeline = this.pipelines.get(object);
      passEncoder.setPipeline(pipeline);
      
      const bindGroups = this.bindings.get(object);
      for (let i = 0; i < bindGroups.length; i++) {
        passEncoder.setBindGroup(i, bindGroups[i]);
      }
      
      const geometry = object.geometry;
      passEncoder.setVertexBuffer(0, geometry.vertexBuf);
      passEncoder.drawIndexed(geometry.indexCount, 1, 0, 0, 0);
    }
    
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
}`
                }
              ]
            },
            {
              name: 'nodes',
              type: 'directory',
              path: '/src/core/nodes',
              children: [
                {
                  name: 'Node.js',
                  type: 'file',
                  path: '/src/core/nodes/Node.js',
                  description: 'The foundation for all TSL (Three Shader Language) nodes. Represents a mathematical, relational, or sampling calculation block that compiles into GLSL/WGSL string chunks.',
                  codeSnippet: `/**
 * Luxarion Node Foundation Class (TSL Base Element)
 */
export class Node {
  constructor(nodeType = 'void') {
    this.nodeType = nodeType;
    this.uuid = Math.random().toString(36).substring(2, 15);
  }

  getType() {
    return this.nodeType;
  }

  build(builder, output) {
    const hash = this.getHash(builder);
    if (builder.hasNodeResult(hash)) {
      return builder.getNodeResult(hash);
    }
    
    const result = this.generate(builder, output);
    builder.setNodeResult(hash, result);
    return result;
  }

  generate(builder, output) {
    throw new Error('Not implemented: generate() inside TSL Node class.');
  }

  add(node) {
    return new OperatorNode('+', this, node);
  }

  mul(node) {
    return new OperatorNode('*', this, node);
  }
}`
                },
                {
                  name: 'gpgpu',
                  type: 'directory',
                  path: '/src/core/nodes/gpgpu',
                  children: [
                    {
                      name: 'ComputeNode.js',
                      type: 'file',
                      path: '/src/core/nodes/gpgpu/ComputeNode.js',
                      description: 'Specialized TSL Node that triggers WebGPU compute-shader calculations. Manages workgroup sizes, thread bindings, and execution of parallel algorithms directly on the GPU.',
                      codeSnippet: `/**
 * ComputeNode for WebGPU Parallel calculations
 */
import { Node } from '../Node.js';

export class ComputeNode extends Node {
  constructor(shaderCode, count, workgroupSize = [64, 1, 1]) {
    super('compute');
    this.shaderCode = shaderCode;
    this.count = count;
    this.workgroupSize = workgroupSize;
    
    this.buffer = null; // Bound GPU buffer
  }

  generate(builder) {
    const device = builder.renderer.device;
    const wgsl = this.shaderCode;
    
    // Dynamic generation of pipeline layout
    const module = device.createShaderModule({ code: wgsl });
    this.pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module, entryPoint: 'main' }
    });
    
    return this.pipeline;
  }

  dispatch(passEncoder) {
    passEncoder.dispatchWorkgroups(
      Math.ceil(this.count / this.workgroupSize[0])
    );
  }
}`
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'extras',
          type: 'directory',
          path: '/src/extras',
          children: [
            {
              name: 'controls',
              type: 'directory',
              path: '/src/extras/controls',
              children: [
                {
                  name: 'OrbitControls.js',
                  type: 'file',
                  path: '/src/extras/controls/OrbitControls.js',
                  description: 'OrbitControls allows the camera to orbit around a pivot position. It listens to hover, drag, mouse wheel, and pinch gestures, with built-in damping inertia for smooth, high-fidelity developer navigation.',
                  codeSnippet: `/**
 * Luxarion OrbitControls
 * Facilitates custom drag-and-rotate developer orbits with inertia.
 */
import { Vector3 } from '../../core/math/Vector3.js';

export class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new Vector3(0, 0, 0);
    
    this.zoomSpeed = 1.0;
    this.rotateSpeed = 1.0;
    
    this.enableDamping = true;
    this.dampingFactor = 0.05;
    
    this._spherical = { radius: 10, phi: Math.PI/3, theta: 0 };
    this.setupListeners();
  }

  setupListeners() {
    this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this));
  }

  onPointerDown(event) {
    const onPointerMove = (e) => {
      const dx = e.movementX * this.rotateSpeed * 0.005;
      const dy = e.movementY * this.rotateSpeed * 0.005;
      
      this._spherical.theta -= dx;
      this._spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this._spherical.phi - dy));
      this.updateCamera();
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  onWheel(event) {
    this._spherical.radius += event.deltaY * this.zoomSpeed * 0.01;
    this._spherical.radius = Math.max(1, Math.min(100, this._spherical.radius));
    this.updateCamera();
  }

  updateCamera() {
    const s = this._spherical;
    const x = s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    const y = s.radius * Math.cos(s.phi);
    const z = s.radius * Math.sin(s.phi) * Math.cos(s.theta);
    
    this.camera.position.set(x, y, z).add(this.target);
    this.camera.lookAt(this.target);
  }
}`
                }
              ]
            }
          ]
        },
        {
          name: 'materials',
          type: 'directory',
          path: '/src/materials',
          children: [
            {
              name: 'MeshPhysicalMaterial.js',
              type: 'file',
              path: '/src/materials/MeshPhysicalMaterial.js',
              description: 'An extension of MeshStandardMaterial, providing advanced physical properties like clearcoat, sheen, iridescence, transmission/refraction, or thin-film interference. Ideal for glass or automotive metallic paints.',
              codeSnippet: `/**
 * MeshPhysicalMaterial System
 * Extension of standard PBR providing physical transparency and clearcoat.
 */
import { MeshStandardMaterial } from './MeshStandardMaterial.js';

export class MeshPhysicalMaterial extends MeshStandardMaterial {
  constructor(parameters = {}) {
    super(parameters);
    this.type = 'MeshPhysicalMaterial';
    
    this.clearcoat = parameters.clearcoat || 0.0;
    this.clearcoatRoughness = parameters.clearcoatRoughness || 0.0;
    this.transmission = parameters.transmission || 0.0; // Refractive opacity
    this.ior = parameters.ior || 1.5; // Index of refraction
    this.sheen = parameters.sheen || 0.0;
    this.thickness = parameters.thickness || 0.0;
  }
}`
            }
          ]
        }
      ]
    },
    {
      name: 'examples',
      type: 'directory',
      path: '/examples',
      children: [
        {
          name: '08-nodes-tsl',
          type: 'directory',
          path: '/examples/08-nodes-tsl',
          children: [
            {
              name: 'basic-nodes',
              type: 'directory',
              path: '/examples/08-nodes-tsl/basic-nodes',
              children: [
                {
                  name: 'index.html',
                  type: 'file',
                  path: '/examples/08-nodes-tsl/basic-nodes/index.html',
                  codeSnippet: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Luxarion TSL - Basic Nodes</title>
</head>
<body style="margin: 0; overflow: hidden; background: #000;">
    <div id="canvas-container"></div>
    <script type="module" src="./main.js"></script>
</body>
</html>`
                },
                {
                  name: 'main.js',
                  type: 'file',
                  path: '/examples/08-nodes-tsl/basic-nodes/main.js',
                  description: 'A standard TSL (Three Shader Language) example showing how shader modules are written using functional node syntax.',
                  codeSnippet: `import { WebGPURenderer, Scene, PerspectiveCamera, Mesh, BoxGeometry, MeshBasicMaterial } from 'luxarion';
import { positionLocal, normalLocal, time, oscSine, color } from 'luxarion/nodes';

const renderer = new WebGPURenderer({ antialias: true });
await renderer.init();
document.body.appendChild(renderer.canvas);

const scene = new Scene();
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

// Define custom material with TSL logic
const tslMaterial = new MeshBasicMaterial({
  // Instead of static colors, assign a functional TSL node!
  // It generates color dynamically based on time and local normals
  colorNode: color(0x00ffcc).mul(oscSine(time.mul(2.0))).add(normalLocal.mul(0.5))
});

const mesh = new Mesh(new BoxGeometry(1, 1, 1), tslMaterial);
scene.add(mesh);

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.01;
  mesh.rotation.x += 0.005;
  renderer.render(scene, camera);
}
animate();`
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export function findNodeByPath(node: FileNode, path: string): FileNode | null {
  if (node.path === path) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }
  return null;
}
