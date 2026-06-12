import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Cpu, Layers, Sparkles, Terminal } from 'lucide-react';

interface TslPreset {
  name: string;
  expression: string;
  description: string;
  vertexShader: string;
  fragmentShader: string;
  wgslCode: string;
  speed: number;
  freq: number;
  color: string;
}

const presets: TslPreset[] = [
  {
    name: 'Nebula Wave Aura',
    expression: 'color(0x7c3aed).add(normalLocal.mul(oscSine(time.mul(0.5)).mul(0.5)))',
    description: 'Deforms vertices dynamically using a sinus waves along the surface normals, with glowing chromatic shifts.',
    speed: 1.2,
    freq: 5.0,
    color: '#7c3aed',
    vertexShader: `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uFreq;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normal;
        // Vertex displacement logic compiled from TSL: normalLocal.mul(oscSine(time))
        float displacement = sin(position.y * uFreq + uTime * uSpeed) * 0.15;
        vec3 newPosition = position + normal * displacement;
        vPosition = newPosition;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uSpeed;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Pixel color logic compiled from TSL: color(0x7c3aed).add(normalLocal)
        vec3 norm = normalize(vNormal);
        float pulse = sin(uTime * uSpeed * 2.5) * 0.5 + 0.5;
        vec3 col = uColor + vec3(norm.x, norm.y, norm.z) * 0.4 * pulse;
        
        // Add subtle fresnel edge lighting
        float fresnel = pow(1.0 - max(dot(norm, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
        col += vec3(0.1, 0.5, 1.0) * fresnel * 0.6;
        
        gl_FragColor = vec4(col, 0.9);
      }
    `,
    wgslCode: `@group(0) @binding(1) var<uniform> uTime: f32;
@group(0) @binding(2) var<uniform> uColor: vec3<f32>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
};

@vertex
fn main(@location(0) position: vec3<f32>, @location(1) normal: vec3<f32>) -> VertexOutput {
  var output: VertexOutput;
  let displacement = sin(position.y * 5.0 + uTime * 1.2) * 0.15;
  output.position = vec4<f32>(position + normal * displacement, 1.0);
  output.normal = normal;
  return output;
}`
  },
  {
    name: 'Cyberspace Digigrid',
    expression: 'checker(uvNode.mul(uFreq)).mul(color(0x00ffcc)).add(normalLocal.mul(0.1))',
    description: 'Generates a procedural matrix-grid structure using custom checker-board operators in UV space.',
    speed: 0.8,
    freq: 12.0,
    color: '#00ffcc',
    vertexShader: `
      uniform float uTime;
      uniform float uSpeed;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vNormal = normal;
        vUv = uv;
        // Vertex jitter compiled from TSL
        vec3 jagged = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(jagged, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uFreq;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        // Custom TSL procedural checker element logic
        vec2 grid = fract(vUv * uFreq);
        float lineX = step(0.08, grid.x) * step(grid.x, 0.92);
        float lineY = step(0.08, grid.y) * step(grid.y, 0.92);
        float isGrid = 1.0 - (lineX * lineY);
        
        // Dynamic scan lines
        float scanline = sin(vUv.y * 100.0 + uTime * uSpeed * 10.0) * 0.05 + 0.95;
        
        vec3 glowColor = uColor * 1.5;
        vec3 baseColor = vec3(0.02, 0.05, 0.08);
        vec3 finalColor = mix(baseColor, glowColor, isGrid * scanline);
        
        // Glitch flicker
        if (sin(uTime * 15.0) > 0.98) {
          finalColor += vec3(0.2, 0.0, 0.4);
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    wgslCode: `@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let grid = fract(uv * 12.0);
  let isGrid = step(0.08, grid.x) + step(0.08, grid.y);
  return vec4<f32>(mix(vec3(0.01), vec3(0.0, 1.0, 0.8), isGrid), 1.0);
}`
  },
  {
    name: 'Solar Plasma Flare',
    expression: 'color(0xffaa00).mul(oscSine(time.mul(uSpeed)).add(0.2)).mul(triNoise3D(positionNode))',
    description: 'Simulates a turbulent geothermal stream fusing custom tri-noise generators with color modifiers.',
    speed: 1.5,
    freq: 3.0,
    color: '#ffaa00',
    vertexShader: `
      uniform float uTime;
      uniform float uSpeed;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      
      void main() {
        vNormal = normal;
        vec4 wPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = wPos.xyz;
        
        // Displace sphere vertices to look like turbulent plasma solar flares
        float noise = sin(position.x * 2.0 + uTime) * cos(position.y * 2.0 + uTime) * sin(position.z * 2.0 + uTime);
        vec3 deformed = position + normal * noise * 0.20;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(deformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uSpeed;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      
      void main() {
        vec3 norm = normalize(vNormal);
        // TSL simulated solar noise
        float t = uTime * uSpeed;
        float noise = sin(vWorldPosition.x * 5.0 + t) * 0.3 + sin(vWorldPosition.y * 3.0 - t * 2.0) * 0.3;
        vec3 plasma = uColor + vec3(1.0, 0.2, 0.0) * (noise + 0.4);
        
        gl_FragColor = vec4(plasma, 1.0);
      }
    `,
    wgslCode: `@fragment
fn main() -> @location(0) vec4<f32> {
  // Parallel compute shader plasma mapping
  return vec4<f32>(1.0, 0.5, 0.0, 1.0);
}`
  }
];

interface TSLSandboxProps {
  onCompile: (vertexShader: string, fragmentShader: string, speed: number, freq: number, color: string) => void;
  activePresetName: string;
}

export const TSLSandbox: React.FC<TSLSandboxProps> = ({ onCompile }) => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [speed, setSpeed] = useState(presets[0].speed);
  const [freq, setFreq] = useState(presets[0].freq);
  const [color, setColor] = useState(presets[0].color);

  // Active editor tab: TSL expression builder, compiled GLSL,Compiled WGSL
  const [activeTab, setActiveTab] = useState<'expression' | 'glsl' | 'wgsl'>('expression');

  const activePreset = presets[activePresetIndex];

  // Compile shaders on state variables modification
  const handleApply = () => {
    onCompile(activePreset.vertexShader, activePreset.fragmentShader, speed, freq, color);
  };

  // Switch presets helper
  const handleSelectPreset = (idx: number) => {
    setActivePresetIndex(idx);
    setSpeed(presets[idx].speed);
    setFreq(presets[idx].freq);
    setColor(presets[idx].color);
    
    // Auto invoke compile
    onCompile(
      presets[idx].vertexShader,
      presets[idx].fragmentShader,
      presets[idx].speed,
      presets[idx].freq,
      presets[idx].color
    );
  };

  useEffect(() => {
    handleApply();
  }, [activePresetIndex, speed, freq, color]);

  // Handle expression resets
  const handleReset = () => {
    setSpeed(presets[activePresetIndex].speed);
    setFreq(presets[activePresetIndex].freq);
    setColor(presets[activePresetIndex].color);
  };

  return (
    <div id="tsl-sandbox" className="flex flex-col h-full bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="bg-[#11111a] border-b border-gray-800 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider font-sans">
              TSL - Three Shader Language Sandbox
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Build and compile node-based materials visually on Luxarion's graphics pipelines.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition"
            title="Reset preset default parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white text-xs px-4 py-1.5 rounded-lg transition font-medium shadow-md shadow-purple-500/20"
          >
            <Play className="w-3.5 h-3.5" />
            Compile & Run
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Preset Selectors & Parameters Slider Panel (Left) */}
        <div className="lg:col-span-5 p-4 border-r border-gray-850 bg-[#08080c] flex flex-col justify-start overflow-y-auto gap-5">
          {/* Preset Selector List */}
          <div>
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Presets (Visual Shaders)
            </h3>
            <div className="flex flex-col gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(idx)}
                  className={`text-left p-3 rounded-lg border transition ${
                    activePresetIndex === idx
                      ? 'bg-purple-950/20 border-purple-800 shadow-inner'
                      : 'bg-gray-900/50 border-gray-850 hover:bg-gray-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-200">{preset.name}</span>
                    <span
                      style={{ backgroundColor: preset.color }}
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-gray-950"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Shader Input Configs */}
          <div className="border-t border-gray-850 pt-4">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Dynamic Node Uniforms
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span className="font-mono">uSpeed (Time Multiplier)</span>
                  <span className="text-emerald-400 font-mono font-medium">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span className="font-mono">uFreq (Wave Frequency)</span>
                  <span className="text-cyan-400 font-mono font-medium">{freq.toFixed(1)}Hz</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={freq}
                  onChange={(e) => setFreq(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span className="font-mono">uColor (Base Tint Color)</span>
                  <span className="text-purple-400 font-mono font-medium">{color}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-800 rounded text-xs font-mono text-gray-300 px-3 uppercase text-center focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Code Visualization & Shader Tabs (Right) */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden bg-[#07070b]">
          {/* Output Code Tabs */}
          <div className="flex bg-[#0d0d14] border-b border-gray-850">
            <button
              onClick={() => setActiveTab('expression')}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition ${
                activeTab === 'expression'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              TSL Javascript Expression
            </button>
            <button
              onClick={() => setActiveTab('glsl')}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition ${
                activeTab === 'glsl'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Compiled GLSL (WebGL)
            </button>
            <button
              onClick={() => setActiveTab('wgsl')}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition ${
                activeTab === 'wgsl'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Compiled WGSL (WebGPU)
            </button>
          </div>

          {/* Active Canvas / Code Representation */}
          <div className="flex-1 p-4 font-mono text-[11px] overflow-auto leading-relaxed text-gray-300 bg-[#06060a]">
            {activeTab === 'expression' && (
              <div className="space-y-4">
                <div className="bg-[#0b0b12] border border-gray-850 p-3 rounded-lg">
                  <span className="text-gray-500 block text-[10px] uppercase mb-1 font-sans font-semibold">TSL Compiler Source Expression</span>
                  <span className="text-amber-400 font-bold">const</span>{' '}
                  <span className="text-cyan-400 font-semibold">luxMaterial</span> ={' '}
                  <span className="text-amber-400 font-bold">new</span>{' '}
                  <span className="text-purple-400 font-semibold">MeshStandardMaterial</span>({`{`}
                  <div className="pl-4">
                    <span className="text-emerald-400">colorNode</span>:{' '}
                    <span className="text-blue-400">{activePreset.expression}</span>
                  </div>
                  {`});`}
                </div>

                <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-850 flex flex-col gap-2 font-sans">
                  <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    How TSL compilation works:
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Unlike standard WebGL engines that use slow and risky string concatenation for shader generation, Luxarion's <strong>Three Shader Language (TSL)</strong> constructs algebraic model trees.
                  </p>
                  <p className="text-[11px] text-gray-400">
                    When you run <code>renderer.render()</code>, the engine crawls these node dependencies trees and generates optimized GLSL or WebGPU-WGSL modules on-the-fly, giving you 100% type-safety and seamless hot reloading.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'glsl' && (
              <pre className="text-emerald-400 select-all whitespace-pre-wrap">
                {activePreset.fragmentShader.trim()}
              </pre>
            )}

            {activeTab === 'wgsl' && (
              <pre className="text-cyan-400 select-all whitespace-pre-wrap">
                {activePreset.wgslCode.trim()}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
