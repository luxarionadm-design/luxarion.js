export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  description?: string;
  codeSnippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export type ThemePreset = 'cosmic-dark' | 'electric-purple' | 'matrix-green' | 'nordic-minimal';

export interface PostProcessingConfig {
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomRadius: number;
  pixelateEnabled: boolean;
  pixelSize: number;
  glitchEnabled: boolean;
  glitchSpeed: number;
  chromaticAberration: number;
  vignetteEnabled: boolean;
  materialMetalness: number;
  materialRoughness: number;
  materialColor: string;
  wireframe: boolean;
  cameraType: 'perspective' | 'orthographic';
}

export interface AudioEmitter {
  id: string;
  name: string;
  x: number; // grid coordinate, e.g. -5 to 5
  y: number;
  frequency: number;
  type: 'sine' | 'square' | 'triangle' | 'sawtooth';
  active: boolean;
}
