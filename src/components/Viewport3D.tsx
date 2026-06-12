import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PostProcessingConfig } from '../types';

interface Viewport3DProps {
  geometryType: 'sphere' | 'torusKnot' | 'terrain' | 'box' | 'particles';
  config: PostProcessingConfig;
  customVertexShader?: string;
  customFragmentShader?: string;
  statsCallback: (stats: { fps: number; vertices: number; triangles: number; drawCalls: number }) => void;
  tslValues?: {
    speed: number;
    color: string;
    freq: number;
  };
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  geometryType,
  config,
  customVertexShader,
  customFragmentShader,
  statsCallback,
  tslValues = { speed: 1.0, color: '#00ffcc', freq: 4.0 },
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | THREE.Points | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationFrameId = useRef<number | null>(null);
  const customMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Orbital controls states
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ theta: 0.6, phi: 1.1, radius: 6 });

  // Update loop for stats
  const lastTimeStats = useRef(performance.now());
  const framesCount = useRef(0);

  // Initialize renderer and scene
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060608);
    // Add grid and helper accents to match high-tech vibe of Luxarion
    scene.fog = new THREE.FogExp2(0x060608, 0.08);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    
    // Clear out container first
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights Setup
    const ambientLight = new THREE.AmbientLight(0x0f0f18, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00ffcc, 1.5);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7c3aed, 2.0);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xff0055, 3, 10);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Create initial object
    recreateMesh();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (!rendererRef.current || !cameraRef.current) continue;
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    });
    resizeObserver.observe(containerRef.current);

    // 5. Animation Loop
    const tick = () => {
      framesCount.current++;
      const now = performance.now();
      if (now - lastTimeStats.current >= 1000) {
        let vertices = 0;
        let triangles = 0;
        if (meshRef.current && meshRef.current.geometry) {
          const geom = meshRef.current.geometry;
          const pos = geom.getAttribute('position');
          if (pos) {
            vertices = pos.count;
            triangles = geom.index ? geom.index.count / 3 : vertices / 3;
          }
        }

        statsCallback({
          fps: Math.round((framesCount.current * 1000) / (now - lastTimeStats.current)),
          vertices,
          triangles: Math.floor(triangles),
          drawCalls: rendererRef.current?.info.render.calls || 1,
        });
        framesCount.current = 0;
        lastTimeStats.current = now;
      }

      const elapsedTime = clockRef.current.getElapsedTime();

      // Update shader uniforms if active
      if (customMaterialRef.current) {
        customMaterialRef.current.uniforms.uTime.value = elapsedTime;
        customMaterialRef.current.uniforms.uSpeed.value = tslValues.speed;
        customMaterialRef.current.uniforms.uFreq.value = tslValues.freq;
        const col = new THREE.Color(tslValues.color);
        customMaterialRef.current.uniforms.uColor.value.setRGB(col.r, col.g, col.b);
      }

      // Rotate regular mesh slightly for visual rhythm
      if (meshRef.current && geometryType !== 'particles') {
        meshRef.current.rotation.y = elapsedTime * 0.15 * tslValues.speed;
        meshRef.current.rotation.x = elapsedTime * 0.08 * tslValues.speed;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      resizeObserver.disconnect();
    };
  }, []);

  // Update orbit camera position based on rotation state variables
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const r = cameraRotation.current;
    
    // Convert spherical to cartesian coords
    const x = r.radius * Math.sin(r.phi) * Math.sin(r.theta);
    const y = r.radius * Math.cos(r.phi);
    const z = r.radius * Math.sin(r.phi) * Math.cos(r.theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Recreate geometry/mesh on configuration change
  const recreateMesh = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
    }

    let geometry: THREE.BufferGeometry;

    switch (geometryType) {
      case 'torusKnot':
        geometry = new THREE.TorusKnotGeometry(1, 0.35, 120, 16);
        break;
      case 'terrain':
        geometry = new THREE.PlaneGeometry(5, 5, 64, 64);
        // Rotate flat plane to stand as a ground matrix
        geometry.rotateX(-Math.PI / 2.5);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        break;
      case 'particles':
        // Generate glowing grid particles
        const count = 5000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorObj = new THREE.Color(config.materialColor);

        for (let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 6;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

          colors[i * 3] = colorObj.r * (0.4 + Math.random() * 0.6);
          colors[i * 3 + 1] = colorObj.g * (0.4 + Math.random() * 0.6);
          colors[i * 3 + 2] = colorObj.b * (0.4 + Math.random() * 0.6);
        }
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        break;
      case 'sphere':
      default:
        geometry = new THREE.SphereGeometry(1.2, 64, 64);
    }

    // Material Selection
    let material: THREE.Material;

    if (customVertexShader && customFragmentShader && geometryType !== 'particles') {
      // Dynamic TSL shader compilation representation in pure WebGL shader block!
      const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: customVertexShader,
        fragmentShader: customFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: tslValues.speed },
          uFreq: { value: tslValues.freq },
          uColor: { value: new THREE.Color(tslValues.color) },
        },
        wireframe: config.wireframe,
        transparent: true,
        side: THREE.DoubleSide,
      });
      customMaterialRef.current = shaderMaterial;
      material = shaderMaterial;
    } else if (geometryType === 'particles') {
      // Custom particle point rendering
      material = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
    } else {
      // Standard PBR Material mapping to Luxarion's Standard/Physical models
      customMaterialRef.current = null;
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.materialColor),
        roughness: config.materialRoughness,
        metalness: config.materialMetalness,
        wireframe: config.wireframe,
        side: THREE.DoubleSide,
        roughnessMap: null,
      });
    }

    if (geometryType === 'particles') {
      meshRef.current = new THREE.Points(geometry, material);
    } else {
      meshRef.current = new THREE.Mesh(geometry, material);
    }

    scene.add(meshRef.current);
  };

  // Re-run geometry generation when geometry type changes or custom shader is updated
  useEffect(() => {
    recreateMesh();
  }, [geometryType, customVertexShader, customFragmentShader, config.wireframe, config.materialColor, config.materialRoughness, config.materialMetalness]);

  // Handle Drag-to-Rotate camera movements
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    const r = cameraRotation.current;
    r.theta -= deltaX * 0.007;
    r.phi = Math.max(0.1, Math.min(Math.PI - 0.1, r.phi - deltaY * 0.007));

    previousMousePosition.current = {
      x: e.clientX,
      y: e.clientY,
    };

    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const r = cameraRotation.current;
    r.radius += e.deltaY * 0.005;
    r.radius = Math.max(2, Math.min(15, r.radius));
    updateCameraPosition();
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="w-full h-full cursor-grab active:cursor-grabbing relative outline-none"
      id="viewport-canvas-container"
    />
  );
};
