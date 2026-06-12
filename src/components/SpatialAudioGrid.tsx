import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Radio, Disc, Play, Activity } from 'lucide-react';
import { AudioEmitter } from '../types';

export const SpatialAudioGrid: React.FC = () => {
  const [audioStarted, setAudioStarted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeEmitterId, setActiveEmitterId] = useState<string | null>(null);

  // Default emitters
  const [emitters, setEmitters] = useState<AudioEmitter[]>([
    { id: '1', name: 'Ambient Pulsar', x: -2.5, y: -2, frequency: 130.81, type: 'triangle', active: false }, // C3
    { id: '2', name: 'Cyberspace Drone', x: 2.5, y: 2.5, frequency: 196.00, type: 'sawtooth', active: false }, // G3
    { id: '3', name: 'Pixel Lead', x: -1, y: 3, frequency: 329.63, type: 'sine', active: false }, // E4
  ]);

  // Coordinates of the central AudioListener (always at 0,0)
  const listenerPos = { x: 0, y: 0 };

  // Nodes dict stored in ref to control on pointer drags
  const synthNodes = useRef<{ [key: string]: { osc: OscillatorNode; gain: GainNode } }>({});

  const startAudioSystem = async () => {
    if (audioStarted) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyserRef.current = analyser;
    analyser.connect(ctx.destination);

    setAudioStarted(true);

    // Prompt user audio context is primed
    console.log('[Luxarion Audio] Audio Context and Analyser node pipeline online.');
  };

  // Start sound generation for a specific emitter node
  const startEmitterSound = (emitter: AudioEmitter) => {
    if (!audioCtxRef.current || !analyserRef.current) return;
    const ctx = audioCtxRef.current;

    // Stop if already running
    if (synthNodes.current[emitter.id]) {
      stopEmitterSound(emitter.id);
    }

    // Create web audio node path: osc -> lowpass(optional) -> gain -> analyzer
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = emitter.type;
    osc.frequency.value = emitter.frequency;

    // Calculate volume falloff based on spatial distance
    const dx = emitter.x - listenerPos.x;
    const dy = emitter.y - listenerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Logarithmic volume decay
    const volume = Math.max(0.01, Math.min(1, 1 / (1 + distance * 0.8)));
    gain.gain.setValueAtTime(emitter.active ? volume * 0.15 : 0, ctx.currentTime);

    osc.connect(gain);
    gain.connect(analyserRef.current);

    osc.start();

    synthNodes.current[emitter.id] = { osc, gain };
  };

  const stopEmitterSound = (id: string) => {
    const nodes = synthNodes.current[id];
    if (nodes) {
      try {
        nodes.osc.stop();
        nodes.osc.disconnect();
        nodes.gain.disconnect();
      } catch (e) {
        // Safe check
      }
      delete synthNodes.current[id];
    }
  };

  // Toggle emitter states (ON / OFF)
  const toggleEmitter = (id: string) => {
    if (!audioStarted) {
      startAudioSystem().then(() => {
        handleToggleAction(id);
      });
    } else {
      handleToggleAction(id);
    }
  };

  const handleToggleAction = (id: string) => {
    setEmitters((prev) =>
      prev.map((emitter) => {
        if (emitter.id === id) {
          const newState = !emitter.active;
          if (newState) {
            // Delay slightly to await state update
            setTimeout(() => {
              const currentEmitter = emitters.find((e) => e.id === id);
              if (currentEmitter) startEmitterSound({ ...currentEmitter, active: true });
            }, 10);
          } else {
            stopEmitterSound(id);
          }
          return { ...emitter, active: newState };
        }
        return emitter;
      })
    );
  };

  // Handle emitter position updates on dragging
  const handleGridClickOrDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeEmitterId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Grid spans -5 to 5 horizontally and vertically
    const clickX = ((e.clientX - rect.left) / rect.width) * 10 - 5;
    const clickY = ((e.clientY - rect.top) / rect.height) * -10 + 5; // Invert y coordinate for cartesian top-right

    updateEmitterCoordinate(activeEmitterId, clickX, clickY);
  };

  const updateEmitterCoordinate = (id: string, x: number, y: number) => {
    setEmitters((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = {
            ...e,
            x: parseFloat(x.toFixed(2)),
            y: parseFloat(y.toFixed(2)),
          };

          // Dynamically adjust Web Audio node gain based on new spatial distance
          if (synthNodes.current[id] && audioCtxRef.current) {
            const dx = updated.x - listenerPos.x;
            const dy = updated.y - listenerPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Log distance falloff formula
            const volume = Math.max(0.01, Math.min(1, 1 / (1 + distance * 0.8)));
            const gainNode = synthNodes.current[id].gain;
            gainNode.gain.linearRampToValueAtTime(volume * 0.15, audioCtxRef.current.currentTime + 0.1);
          }

          return updated;
        }
        return e;
      })
    );
  };

  // Frequency wave analyzer visual loops
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const bufferLength = analyserRef.current?.frequencyBinCount || 32;
      const dataArray = new Uint8Array(bufferLength);
      
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      ctx.fillStyle = '#06060a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(1, '#00ffcc');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      animId = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      cancelAnimationFrame(animId);
      // Stop all sounds on component unmount
      emitters.forEach((e) => stopEmitterSound(e.id));
    };
  }, [audioStarted]);

  return (
    <div id="spatial-audio-grid" className="grid grid-cols-1 lg:grid-cols-12 bg-[#09090f] border border-gray-800 rounded-xl overflow-hidden shadow-2xl h-full">
      {/* Visual Spatial grid container (Left) */}
      <div className="lg:col-span-7 p-4 bg-[#06060a] flex flex-col justify-center items-center relative">
        <label className="absolute top-4 left-4 z-10 text-[10px] uppercase font-mono tracking-widest text-[#00ffcc] flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded border border-gray-900">
          <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
          Luxarion Spatializer Space
        </label>

        {/* The Spatial Coordinate Grid Canvas */}
        <div
          onMouseMove={activeEmitterId ? handleGridClickOrDrag : undefined}
          onMouseUp={() => setActiveEmitterId(null)}
          className="w-[300px] h-[300px] relative bg-[#040407] border border-gray-900 rounded-lg overflow-hidden select-none flex items-center justify-center cursor-default shadow-inner"
          style={{
            backgroundImage: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.05) 0%, rgba(0, 0, 0, 0) 70%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 30px 30px, 30px 30px',
            backgroundPosition: 'center, center, center',
          }}
        >
          {/* Centered Listener node represent player position */}
          <div className="absolute w-8 h-8 rounded-full border border-indigo-400 bg-indigo-950/40 backdrop-blur z-20 flex items-center justify-center flex-col">
            <Volume2 className="w-4 h-4 text-indigo-300 animate-pulse" />
            <span className="text-[7px] text-indigo-400 font-mono font-bold mt-0.5">0, 0</span>
          </div>

          {/* Render individual adjustable emitters */}
          {emitters.map((emitter) => {
            // Convert coordinate ranges (-5 to 5) to percentages (0% to 100%)
            const leftPercent = ((emitter.x + 5) / 10) * 100;
            const topPercent = ((-emitter.y + 5) / 10) * 100;

            return (
              <div
                key={emitter.id}
                onMouseDown={() => {
                  if (!emitter.active) toggleEmitter(emitter.id);
                  setActiveEmitterId(emitter.id);
                }}
                style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center group cursor-grab active:cursor-grabbing transition-transform hover:scale-110`}
              >
                {/* Positional emitter radius indicator */}
                {emitter.active && (
                  <div className="absolute w-24 h-24 -translate-y-5 rounded-full border border-purple-500/10 animate-ping pointer-events-none" />
                )}

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center relative ${
                    emitter.active
                      ? 'bg-purple-950/50 border-purple-400 text-purple-300 shadow-md shadow-purple-500/40'
                      : 'bg-gray-900 border-gray-700 text-gray-450'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                </div>
                {/* Hover label information */}
                <div className="absolute top-7 bg-black/85 border border-indigo-950 px-2 py-0.5 rounded text-[8px] font-mono text-gray-300 whitespace-nowrap opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  {emitter.name} ({emitter.x}, {emitter.y})
                </div>
              </div>
            );
          })}
        </div>

        <span className="text-[9px] text-gray-500 font-mono mt-3 text-center">
          🕹️ Drag emitters relative to the center listener node (0,0) to modulate positional gain decay!
        </span>
      </div>

      {/* Control panel (Right) */}
      <div className="lg:col-span-5 p-5 border-t lg:border-t-0 lg:border-l border-gray-850 flex flex-col justify-between bg-[#08080d]">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-200 uppercase tracking-widest font-sans">
              Luxarion Spatial Audio Emitters
            </span>
            <button
              onClick={() => {
                if (!audioStarted) startAudioSystem().then(() => setAudioStarted(true));
              }}
              className={`text-[9px] font-mono border px-2 py-0.5 rounded ${
                audioStarted ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              {audioStarted ? 'Audio Context Active' : 'Initialize Context'}
            </button>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Simulates Luxarion's spatial audio engine. Sound decibels are governed by distance.
          </p>

          {/* Synth frequency wave visualization block */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1.5">
              <span>Dynamic Spectrogram Wave</span>
              <Disc className={`w-3 h-3 text-purple-400 ${audioStarted ? 'animate-spin' : ''}`} />
            </div>
            <canvas ref={canvasRef} width={250} height={55} className="w-full h-[55px] bg-black rounded-md border border-gray-900" />
          </div>

          {/* Audio Emitter Nodes controls list */}
          <div className="space-y-2">
            {emitters.map((emitter) => (
              <div
                key={emitter.id}
                className={`p-3 rounded-lg border flex items-center justify-between transition ${
                  emitter.active ? 'bg-purple-950/10 border-purple-900' : 'bg-gray-900/50 border-gray-850'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-200">{emitter.name}</span>
                    <span className="text-[8px] font-mono bg-purple-950 border border-purple-800 text-purple-300 px-1 py-0.2 rounded">
                      {emitter.frequency}Hz
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    Waveform: {emitter.type} • Dist:{' '}
                    {Math.sqrt(emitter.x * emitter.x + emitter.y * emitter.y).toFixed(2)}m
                  </div>
                </div>

                <button
                  onClick={() => toggleEmitter(emitter.id)}
                  className={`text-xs px-3 py-1.5 rounded font-sans transition ${
                    emitter.active
                      ? 'bg-rose-500/25 border border-rose-500 text-rose-300 hover:opacity-90'
                      : 'bg-purple-600 hover:bg-purple-700 text-white font-medium'
                  }`}
                >
                  {emitter.active ? 'Mute' : 'Broadcast'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-gray-850 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-[10px] text-gray-500 leading-relaxed leading-normal font-mono">
            Spatial parameters binded directly to HTMLAudioNodes via our automated PositionalAudio wrapper.
          </span>
        </div>
      </div>
    </div>
  );
};
