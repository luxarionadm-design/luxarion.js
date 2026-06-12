import React, { useState } from 'react';
import { Viewport3D } from './components/Viewport3D';
import { TSLSandbox } from './components/TSLSandbox';
import { PostProcessingRack } from './components/PostProcessingRack';
import { ComputeParticleSimulator } from './components/ComputeParticleSimulator';
import { SpatialAudioGrid } from './components/SpatialAudioGrid';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';
import { AIAssistant } from './components/AIAssistant';
import { PostProcessingConfig } from './types';
import { 
  Terminal, 
  Cpu, 
  Zap, 
  Settings, 
  Code2, 
  Activity, 
  Music, 
  FolderTree, 
  Bot, 
  Compass, 
  Maximize2 
} from 'lucide-react';

export default function App() {
  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'sandbox' | 'compute' | 'audio' | 'explorer' | 'ai'>('sandbox');

  // Sub-tab inside core sandbox workspace: either TSL compiler or post-processing rack
  const [sandboxPanel, setSandboxPanel] = useState<'tsl' | 'post'>('tsl');

  // Active geometry type for 3D Viewport
  const [geometryType, setGeometryType] = useState<'sphere' | 'torusKnot' | 'terrain' | 'box' | 'particles'>('torusKnot');

  // Live viewport metrics callbacks
  const [viewportStats, setViewportStats] = useState({
    fps: 60,
    vertices: 0,
    triangles: 0,
    drawCalls: 1,
  });

  // TSL sandbox active compilation states
  const [customVertexShader, setCustomVertexShader] = useState<string>('');
  const [customFragmentShader, setCustomFragmentShader] = useState<string>('');
  const [tslValues, setTslValues] = useState({
    speed: 1.0,
    freq: 4.0,
    color: '#00ffcc',
  });

  // Post processor active pipeline configs
  const [postConfig, setPostConfig] = useState<PostProcessingConfig>({
    bloomEnabled: true,
    bloomIntensity: 1.5,
    bloomRadius: 0.5,
    pixelateEnabled: false,
    pixelSize: 6,
    glitchEnabled: false,
    glitchSpeed: 0.5,
    chromaticAberration: 0.2,
    vignetteEnabled: true,
    materialMetalness: 0.7,
    materialRoughness: 0.2,
    materialColor: '#00ffcc',
    wireframe: false,
    cameraType: 'perspective',
  });

  // Handle shader compiler ticks from TSL Sandbox
  const handleTslCompile = (
    vert: string,
    frag: string,
    speed: number,
    freq: number,
    col: string
  ) => {
    setCustomVertexShader(vert);
    setCustomFragmentShader(frag);
    setTslValues({ speed, freq, color: col });
    
    // Auto-update standard color PBR to stay synchronized with custom tint
    setPostConfig(prev => ({
      ...prev,
      materialColor: col
    }));
  };

  return (
    <div className="min-h-screen bg-[#040407] text-gray-150 flex flex-col font-sans overflow-x-hidden antialiased">
      
      {/* Top Cockpit Header Navigation */}
      <header className="bg-[#08080d]/90 backdrop-blur border-b border-gray-900 sticky top-0 z-40 px-4 md:px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-purple-500/10">
            <Cpu className="w-5.5 h-5.5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-widest text-white font-mono uppercase">
                LUXARION ENGINE
              </span>
              <span className="bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-[8px] font-mono font-bold uppercase py-0.5 px-2 rounded-full tracking-wider">
                WebGPU Core Native
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Next-Gen WebGL/WebGPU 3D Shader, Parallel Compute & Spatial Audio Sandbox
            </p>
          </div>
        </div>

        {/* Live System Performance Telemetry */}
        <div className="flex flex-wrap items-center gap-3 bg-black/40 border border-gray-900 rounded-lg p-2 font-mono text-[10px]">
          <div className="px-2 border-r border-gray-850">
            <span className="text-gray-500 uppercase block text-[8px]">Adapter Pipeline</span>
            <span className="text-cyan-400 font-semibold uppercase flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              NATIVE GPUDevice Ready
            </span>
          </div>
          <div className="px-2 border-r border-gray-850">
            <span className="text-gray-500 uppercase block text-[8px]">Core Render Loop</span>
            <span className="text-gray-300 font-semibold mt-0.5 block">
              {viewportStats.fps} FPS
            </span>
          </div>
          <div className="px-2">
            <span className="text-gray-500 uppercase block text-[8px]">Active Vertices</span>
            <span className="text-gray-300 font-semibold mt-0.5 block">
              {viewportStats.vertices.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* Primary Workspace Sections Navigation tabs */}
      <nav className="bg-[#06060c] border-b border-gray-900 px-4 md:px-6 flex overflow-x-auto gap-1">
        {[
          { id: 'sandbox', label: '3D Studio Sandbox', icon: Compass },
          { id: 'compute', label: 'Compute Simulation', icon: Activity },
          { id: 'audio', label: 'Spatial Soundscape', icon: Music },
          { id: 'explorer', label: 'Architecture & Boilerplate', icon: FolderTree },
          { id: 'ai', label: 'Lead AI Architect', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-semibold tracking-wider flex items-center gap-2 border-b-2 transition select-none ${
                isActive
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-900/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Responsive Workspace Layout */}
      <main className="flex-1 p-4 md:p-6 max-w-[1700px] w-full mx-auto overflow-hidden">
        
        {/* TAB 1: Real-time 3D Studio & TSL Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full items-stretch">
            
            {/* Left Sidebar Frame: Holds the interactive 3D Viewport (xl:col-span-7) */}
            <div className="xl:col-span-7 flex flex-col gap-4">
              <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col relative min-h-[380px] lg:min-h-[480px]">
                
                {/* Viewport Control strip */}
                <div className="bg-[#11111a] border-b border-gray-850 px-4 py-3 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-xs font-mono text-gray-200 uppercase tracking-widest font-semibold">
                      Luxarion WebGL/WebGPU Canvas Viewport
                    </span>
                  </div>
                  
                  {/* Geometry Shape switch options */}
                  <div className="flex gap-1 bg-black/60 p-1 border border-gray-800 rounded-lg">
                    {[
                      { id: 'torusKnot', label: 'Torus Knot' },
                      { id: 'sphere', label: 'Sphere' },
                      { id: 'terrain', label: 'Terrain' },
                      { id: 'box', label: 'Box' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGeometryType(g.id as any)}
                        className={`text-[10px] font-mono px-2.5 py-1.5 rounded transition ${
                          geometryType === g.id
                            ? 'bg-purple-950 border border-purple-800 text-purple-300'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* The Live Three.js WebGL/WebGPU Viewport renderer */}
                <div className="flex-1 relative">
                  <Viewport3D
                    geometryType={geometryType}
                    config={postConfig}
                    customVertexShader={customVertexShader}
                    customFragmentShader={customFragmentShader}
                    statsCallback={setViewportStats}
                    tslValues={tslValues}
                  />

                  {/* Overlaid parameters telemetry card */}
                  <div className="absolute bottom-4 left-4 bg-[#09090f]/90 backdrop-blur border border-gray-850 rounded-lg p-3 w-48 font-mono text-[10px] z-20 flex flex-col gap-1.5 shadow-xl select-none">
                    <span className="text-[9px] uppercase tracking-wider text-purple-400 font-bold block border-b border-gray-800 pb-1 mb-1">
                      Render Telemetry
                    </span>
                    <div className="flex justify-between text-gray-300">
                      <span>Draw Calls</span>
                      <span className="font-semibold text-cyan-400">{viewportStats.drawCalls}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>FPS</span>
                      <span className={`font-semibold ${viewportStats.fps > 55 ? 'text-emerald-400' : 'text-amber-400'}`}>{viewportStats.fps}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Verts count</span>
                      <span className="font-semibold text-gray-100">{viewportStats.vertices.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Tris count</span>
                      <span className="font-semibold text-gray-100">{viewportStats.triangles.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Workspace Frame: Holds TSL compilation Sandbox and FX rack parameters (xl:col-span-5) */}
            <div className="xl:col-span-5 flex flex-col gap-4">
              
              {/* Studio sub-tab panels switcher */}
              <div className="flex border border-gray-800 rounded-lg overflow-hidden bg-black/40 p-1">
                <button
                  onClick={() => setSandboxPanel('tsl')}
                  className={`flex-1 py-2 text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5 rounded transition ${
                    sandboxPanel === 'tsl'
                      ? 'bg-purple-950/40 border border-purple-800 text-purple-300'
                      : 'text-gray-450 hover:text-gray-300'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  TSL Node Compiler
                </button>
                <button
                  onClick={() => setSandboxPanel('post')}
                  className={`flex-1 py-2 text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5 rounded transition ${
                    sandboxPanel === 'post'
                      ? 'bg-purple-950/40 border border-purple-800 text-purple-300'
                      : 'text-gray-450 hover:text-gray-300'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  FX Post-Processing Rack
                </button>
              </div>

              {/* Display sub-panel corresponding content */}
              <div className="flex-1 min-h-[350px]">
                {sandboxPanel === 'tsl' ? (
                  <TSLSandbox onCompile={handleTslCompile} activePresetName="" />
                ) : (
                  <PostProcessingRack config={postConfig} onChange={setPostConfig} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Parallel GPU Compute simulator */}
        {activeTab === 'compute' && (
          <div className="h-full">
            <ComputeParticleSimulator />
          </div>
        )}

        {/* TAB 3: Dynamic Spatial Sound synthesizer */}
        {activeTab === 'audio' && (
          <div className="h-full">
            <SpatialAudioGrid />
          </div>
        )}

        {/* TAB 4: Engine architecture and copyable boilerplates */}
        {activeTab === 'explorer' && (
          <div className="h-full">
            <ArchitectureExplorer />
          </div>
        )}

        {/* TAB 5: AI Graphics Architect conversation proxy */}
        {activeTab === 'ai' && (
          <div className="h-full">
            <AIAssistant />
          </div>
        )}

      </main>

      {/* System info bar / footer */}
      <footer className="bg-[#050508] border-t border-gray-900 py-3 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 font-mono gap-2 mt-auto">
        <div className="flex items-center gap-2">
          <span>© 2026 LUXARION LABS INC.</span>
          <span>•</span>
          <span>ALL HARDWARE RUNNING NORMALLY</span>
        </div>
        <div className="flex items-center gap-3">
          <span>PORT: 3000 INGRESS APPROVED</span>
          <span>•</span>
          <span className="text-purple-400">NEXT-GEN GRAPHICS EXPERIMENTAL PLATFORM</span>
        </div>
      </footer>
    </div>
  );
}
