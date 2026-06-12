import React from 'react';
import { ToggleLeft, ToggleRight, Sliders, ShieldAlert, Cpu } from 'lucide-react';
import { PostProcessingConfig } from '../types';

interface PostProcessingRackProps {
  config: PostProcessingConfig;
  onChange: (newConfig: PostProcessingConfig) => void;
}

export const PostProcessingRack: React.FC<PostProcessingRackProps> = ({ config, onChange }) => {
  const handleToggle = (key: keyof PostProcessingConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const handleSlider = (key: keyof PostProcessingConfig, val: number) => {
    onChange({
      ...config,
      [key]: val,
    });
  };

  const handleString = (key: keyof PostProcessingConfig, val: string) => {
    onChange({
      ...config,
      [key]: val,
    });
  };

  return (
    <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-5 shadow-2xl h-full flex flex-col justify-start gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest font-sans">
            FX Post-Processing Rack
          </h2>
        </div>
        <p className="text-[11px] text-gray-400">
          Injected into Luxarion's <code>EffectComposer</code> stack. Toggle shader passes dynamically.
        </p>
      </div>

      {/* FX Stack list */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        
        {/* Pass 1: Bloom pass */}
        <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-850">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-200">Unreal Bloom (Neon Glow)</span>
            <button onClick={() => handleToggle('bloomEnabled')} className="text-indigo-400 focus:outline-none">
              {config.bloomEnabled ? <ToggleRight className="w-8 h-8 text-indigo-400" /> : <ToggleLeft className="w-8 h-8 text-gray-650" />}
            </button>
          </div>
          {config.bloomEnabled && (
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Intensity</span>
                  <span className="text-indigo-400 font-mono font-bold">{config.bloomIntensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.1"
                  value={config.bloomIntensity}
                  onChange={(e) => handleSlider('bloomIntensity', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pass 2: Retro Pixelate pass */}
        <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-850">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-200">Retro Pixelation Pass</span>
            <button onClick={() => handleToggle('pixelateEnabled')} className="text-emerald-400 focus:outline-none">
              {config.pixelateEnabled ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-gray-650" />}
            </button>
          </div>
          {config.pixelateEnabled && (
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Pixel Scale (Size)</span>
                  <span className="text-emerald-400 font-mono font-bold">{config.pixelSize}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={config.pixelSize}
                  onChange={(e) => handleSlider('pixelSize', parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pass 3: Glitch/Chromatic Aberration */}
        <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-850">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-200">Chroma & Glitch Pass</span>
            <button onClick={() => handleToggle('glitchEnabled')} className="text-rose-400 focus:outline-none">
              {config.glitchEnabled ? <ToggleRight className="w-8 h-8 text-rose-400" /> : <ToggleLeft className="w-8 h-8 text-gray-650" />}
            </button>
          </div>
          {config.glitchEnabled && (
            <div className="space-y-3 pt-2 border-t border-gray-800">
              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Flicker Speed</span>
                  <span className="text-rose-400 font-mono font-bold">{config.glitchSpeed.toFixed(1)}Hz</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={config.glitchSpeed}
                  onChange={(e) => handleSlider('glitchSpeed', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Dispersion Width</span>
                  <span className="text-rose-400 font-mono font-bold">{config.chromaticAberration.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={config.chromaticAberration}
                  onChange={(e) => handleSlider('chromaticAberration', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pass 4: Material Properties */}
        <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-850 space-y-3.5">
          <span className="text-xs font-semibold text-gray-200 block">PBR Material Pipeline</span>
          
          <div className="border-t border-gray-850 pt-3 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Wireframe Viewport</span>
              <button
                onClick={() => handleToggle('wireframe')}
                className={`w-10 py-1 rounded text-[10px] font-mono border transition ${
                  config.wireframe ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-gray-850 border-gray-800 text-gray-450'
                }`}
              >
                {config.wireframe ? 'ON' : 'OFF'}
              </button>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>Core Surface Color</span>
                <span className="font-mono text-cyan-400 text-uppercase">{config.materialColor}</span>
              </div>
              <div className="flex gap-1.5">
                {['#7c3aed', '#00ffcc', '#ec4899', '#3b82f6', '#f59e0b'].map((col) => (
                  <button
                    key={col}
                    onClick={() => handleString('materialColor', col)}
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-md border transition ${
                      config.materialColor === col ? 'ring-2 ring-white border-transparent scale-110' : 'border-gray-850'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>Material Metalness</span>
                <span className="text-gray-300 font-mono">{config.materialMetalness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.materialMetalness}
                onChange={(e) => handleSlider('materialMetalness', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>Material Roughness</span>
                <span className="text-gray-300 font-mono">{config.materialRoughness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.materialRoughness}
                onChange={(e) => handleSlider('materialRoughness', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
          </div>
        </div>

      </div>

      <div className="bg-[#111119] border border-gray-850 p-2.5 rounded-lg flex items-start gap-2">
        <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="text-[10px] text-gray-400 leading-normal font-mono">
          Renderer binds WebGL-Pass parameters as static uniform uniforms, compiling dynamically on frame tickers.
        </span>
      </div>
    </div>
  );
};
