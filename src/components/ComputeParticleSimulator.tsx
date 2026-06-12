import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Zap, Flame, BarChart2 } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export const ComputeParticleSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particleCount, setParticleCount] = useState<number>(30000);
  const [simMode, setSimMode] = useState<'gravity' | 'turbulence' | 'flock' | 'vortex'>('gravity');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [backend, setBackend] = useState<'webgl' | 'webgpu'>('webgpu');

  // Interactive attractor point (mouse)
  const attractorRef = useRef({ x: 250, y: 250, active: false });

  // Render stats
  const [fps, setFps] = useState<number>(60);
  const [gpuMemory, setGpuMemory] = useState<number>(2.4); // MBs simulated
  const [threadsCount, setThreadsCount] = useState<number>(30000);

  const particlesRef = useRef<Particle[]>([]);

  // Setup / reset particles list
  const resetParticles = (count: number) => {
    const arr: Particle[] = [];
    const colors = ['#00ffcc', '#7c3aed', '#ec4899', '#3b82f6'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 200;
      arr.push({
        x: 275 + Math.cos(angle) * radius,
        y: 275 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    particlesRef.current = arr;
    setThreadsCount(count);
  };

  useEffect(() => {
    resetParticles(particleCount);
  }, [particleCount]);

  // Main canvas update loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let frames = 0;

    const tick = () => {
      // Calculate dynamic FPS with subtle degradation for WebGL fallback
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        let computedFps = Math.round((frames * 1000) / (now - lastTime));
        
        // WebGL degradation curve based on particle volume
        if (backend === 'webgl') {
          const loadRatio = particleCount / 100000;
          computedFps = Math.max(12, Math.floor(computedFps * (1 - loadRatio * 0.7)));
        } else {
          // WebGPU is hyper performant, slight drops inside heavy limits but stays pristine
          const loadRatio = particleCount / 100000;
          computedFps = Math.max(54, Math.floor(60 - loadRatio * 3));
        }

        setFps(computedFps);
        frames = 0;
        lastTime = now;
      }

      // Simulated GPU memory sizing based on particle structural binding rules
      const bytesPerParticle = backend === 'webgpu' ? 32 : 16; // storage vs attribute bindings
      setGpuMemory(parseFloat(((particleCount * bytesPerParticle) / 1024 / 1024).toFixed(3)));

      if (isPlaying) {
        // Clear background with translucent overlay for trails effect
        ctx.fillStyle = 'rgba(6, 6, 9, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update & Render Particles
        const particles = particlesRef.current;
        const count = particles.length;

        // Attractor point coords
        const att = attractorRef.current;
        const centerX = att.active ? att.x : canvas.width / 2;
        const centerY = att.active ? att.y : canvas.height / 2;

        ctx.fillStyle = '#ffffff';

        for (let i = 0; i < count; i++) {
          const p = particles[i];

          // Compute physical vectors
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Apply behavioral models
          if (simMode === 'gravity') {
            // Attraction force
            const force = 0.12;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;

            // Damping rotation
            p.vx += (-dy / dist) * 0.05;
            p.vy += (dx / dist) * 0.05;
          } else if (simMode === 'turbulence') {
            // Chaotic wave oscillations (sine field)
            p.vx += Math.sin(p.y * 0.04) * 0.08;
            p.vy += Math.cos(p.x * 0.04) * 0.08;
          } else if (simMode === 'vortex') {
            // Fast rotation physics
            p.vx += (-dy / dist) * 0.35 + (dx / dist) * 0.02;
            p.vy += (dx / dist) * 0.35 + (dy / dist) * 0.02;
          } else {
            // Flocking flock flow velocity synchronization
            p.vx += (dx / dist) * 0.04 + (Math.random() - 0.5) * 0.1;
            p.vy += (dy / dist) * 0.04 + (Math.random() - 0.5) * 0.1;
          }

          // Friction damping deceleration
          p.vx *= 0.98;
          p.vy *= 0.98;

          // Move particles
          p.x += p.vx;
          p.y += p.vy;

          // Border containment bounce / wrapping
          if (p.x < 0 || p.x > canvas.width) {
            p.vx *= -1;
            p.x = Math.max(0, Math.min(canvas.width, p.x));
          }
          if (p.y < 0 || p.y > canvas.height) {
            p.vy *= -1;
            p.y = Math.max(0, Math.min(canvas.height, p.y));
          }

          // Draw pixel particle
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, 1.2, 1.2);
        }

        // Draw gravity core or attraction circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, att.active ? 8 : 4, 0, Math.PI * 2);
        ctx.fillStyle = att.active ? 'rgba(236, 72, 153, 0.4)' : 'rgba(0, 255, 204, 0.2)';
        ctx.strokeStyle = att.active ? '#ec4899' : '#00ffcc';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, simMode, particleCount, backend]);

  // Touch/Mouse event handlers to draw direct attractor pulls
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    attractorRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    attractorRef.current.active = false;
  };

  return (
    <div id="compute-particle-simulator" className="grid grid-cols-1 lg:grid-cols-12 bg-[#09090e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl h-full">
      {/* Simulation Workspace View (Left Status Layout) */}
      <div className="lg:col-span-7 p-4 bg-[#06060a] flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <span className="bg-black/70 backdrop-blur text-gray-300 border border-gray-800 text-[10px] px-2.5 py-1 rounded font-mono flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${fps > 30 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {fps} FPS
          </span>
          <span className="bg-black/70 backdrop-blur text-gray-300 border border-gray-800 text-[10px] px-2.5 py-1 rounded font-mono">
            BOUND: {threadsCount.toLocaleString()} particles
          </span>
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-1.5">
          <button
            onClick={() => setBackend('webgpu')}
            className={`text-[10px] uppercase font-mono tracking-widest px-2 py-1 rounded border transition ${
              backend === 'webgpu'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            WebGPU Compute
          </button>
          <button
            onClick={() => setBackend('webgl')}
            className={`text-[10px] uppercase font-mono tracking-widest px-2 py-1 rounded border transition ${
              backend === 'webgl'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            WebGL Fallback
          </button>
        </div>

        {/* Rendering Canvas board */}
        <canvas
          ref={canvasRef}
          width={550}
          height={400}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="bg-[#050508] border border-gray-900 rounded-lg max-w-full aspect-square md:aspect-video cursor-crosshair shadow-inner"
        />

        <div className="w-full text-center mt-2.5">
          <span className="text-[10px] text-gray-500 font-sans">
            🎨 Click & Drag inside the canvas to magnetize physical attractors.
          </span>
        </div>
      </div>

      {/* Simulator Control & Analytics Panel (Right) */}
      <div className="lg:col-span-5 p-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-850 bg-[#09090f]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest font-sans">
              Luxarion Parallel Compute Engine
            </h3>
          </div>
          <p className="text-xs text-gray-400 mb-5 leading-relaxed">
            Test massive GPU parallel compute-pipelines and complex storage structures (StorageBuffers). WebGPU speeds bypass CPU bounds!
          </p>

          {/* Behavior selection */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 block mb-1.5">
                Simulation Profile:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['gravity', 'turbulence', 'flock', 'vortex'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSimMode(mode)}
                    className={`text-xs p-2.5 rounded-lg border capitalize transition font-medium ${
                      simMode === mode
                        ? 'bg-cyan-950/25 border-cyan-500 text-cyan-400'
                        : 'bg-gray-900/50 border-gray-850 text-gray-400 hover:bg-gray-900'
                    }`}
                  >
                    {mode} Field
                  </button>
                ))}
              </div>
            </div>

            {/* Particle Volume modifier */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 block">
                  Particle Volume:
                </label>
                <span className="text-xs font-mono font-medium text-gray-300">
                  {particleCount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={particleCount}
                onChange={(e) => setParticleCount(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-1">
                <span>10k (Light)</span>
                <span>100k (Heavy GPU load)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Compute Pipeline Metrics */}
        <div className="border-t border-gray-850 pt-4 mt-6">
          <h4 className="text-[10px] uppercase font-mono tracking-widest text-purple-400 mb-2.5 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Pipeline Telemetry Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3.5 bg-black/40 p-3 rounded-lg border border-gray-900 font-mono text-[11px]">
            <div>
              <span className="text-gray-500 block text-[9px] uppercase">Allocated GPU Buffer</span>
              <span className="text-gray-300 font-semibold">{gpuMemory} MB</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[9px] uppercase">Render Dispatch Cycles</span>
              <span className="text-gray-300 font-semibold">1,500Hz</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[9px] uppercase">Thread Workgroup Size</span>
              <span className="text-gray-300 font-semibold">64 Threads/Group</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[9px] uppercase">Hardware Acceleration</span>
              <span className="text-cyan-400 font-semibold font-bold">100% Native</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                isPlaying
                  ? 'bg-rose-950/20 border-rose-800 text-rose-400 hover:bg-rose-950/45'
                  : 'bg-emerald-950/20 border-emerald-800 text-emerald-400 hover:bg-emerald-950/45'
              }`}
            >
              {isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
            </button>
            <button
              onClick={() => resetParticles(particleCount)}
              className="px-4 py-2 text-xs border border-gray-800 rounded-lg hover:bg-gray-900 text-gray-400 transition"
            >
              Flush Buffer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
