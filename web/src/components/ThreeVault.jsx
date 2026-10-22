import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Lock, Sparkles, RefreshCw } from 'lucide-react';

/**
 * ThreeVault.jsx — Interactive 3D Cryptographic Vault using Three.js WebGL.
 * Visualizes the 3-Lock cryptographic tokenization and zero-PII security model.
 */
export default function ThreeVault({ mode = 'lock2', height = 340 }) {
  const mountRef = useRef(null);
  const [activeLock, setActiveLock] = useState(mode);
  const [rotationSpeed, setRotationSpeed] = useState(0.006);

  // Lock themes: Lock 1 (Sapphire Blue), Lock 2 (Amethyst Purple), Lock 3 (Emerald Green)
  const THEMES = {
    lock1: {
      name: 'Lock 1: Ephemeral Source Ingestion',
      color: 0x3b82f6,
      wireColor: 0x60a5fa,
      particleColor: 0x93c5fd,
      description: 'Transient in-memory verification against national registry. Raw IDs purged in < 20ms.',
      crypto: 'SHA-256 WebCrypto Hash',
      tag: 'Lock 1 Active',
    },
    lock2: {
      name: 'Lock 2: Blind HMAC Tokenization',
      color: 0x8b5cf6,
      wireColor: 0xa78bfa,
      particleColor: 0xc4b5fd,
      description: 'Cohort-isolated KMS key generates 16-char base32 tokens. Unlinkable across academic years.',
      crypto: 'HMAC-SHA256 (KMS Salted)',
      tag: 'Lock 2 Active',
    },
    lock3: {
      name: 'Lock 3: Triangulate & Merkle Anchor',
      color: 0x10b981,
      wireColor: 0x34d399,
      particleColor: 0xa7f3d0,
      description: 'Deterministic rule engine (R1-R7) anchored to daily Ed25519-signed Merkle root.',
      crypto: 'Ed25519 JWS + Merkle Tree',
      tag: 'Lock 3 Active',
    },
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 400;
    const h = height;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const theme = THEMES[activeLock];

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(theme.color, 3.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xffffff, 1.5, 50);
    pointLight2.position.set(-5, -5, 3);
    scene.add(pointLight2);

    // 1. Central Core: Inner Icosahedron
    const coreGeometry = new THREE.IcosahedronGeometry(1.25, 0);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: theme.color,
      emissive: theme.color,
      emissiveIntensity: 0.35,
      shininess: 90,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    // 2. Outer Shield: Wireframe Icosahedron
    const wireGeometry = new THREE.IcosahedronGeometry(1.75, 1);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: theme.wireColor,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireMesh);

    // 3. Orbiting Cryptographic Rings
    const ringGeometry = new THREE.TorusGeometry(2.1, 0.02, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: theme.wireColor,
      transparent: true,
      opacity: 0.6,
    });
    const ringMesh1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh1.rotation.x = Math.PI / 3;
    scene.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh2.rotation.y = Math.PI / 3;
    scene.add(ringMesh2);

    // 4. Floating Particle Constellation
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.4 + Math.random() * 1.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: theme.particleColor,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 2;
      mouseY = (y / rect.height) * 2;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / h;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Autonomous rotation
      coreMesh.rotation.x += rotationSpeed;
      coreMesh.rotation.y += rotationSpeed * 1.5;

      wireMesh.rotation.x -= rotationSpeed * 0.7;
      wireMesh.rotation.y -= rotationSpeed * 1.1;

      ringMesh1.rotation.z += rotationSpeed * 1.8;
      ringMesh2.rotation.z -= rotationSpeed * 1.4;

      particleSystem.rotation.y += rotationSpeed * 0.4;

      // Mouse responsive inertia
      targetRotationY += (mouseX - targetRotationY) * 0.05;
      targetRotationX += (mouseY - targetRotationX) * 0.05;

      coreMesh.rotation.y += targetRotationY * 0.02;
      coreMesh.rotation.x += targetRotationX * 0.02;
      wireMesh.rotation.y += targetRotationY * 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [activeLock, rotationSpeed, height]);

  return (
    <div className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/70 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-white text-sm sm:text-base tracking-tight">
              Interactive 3D Cryptographic Vault
            </h3>
            <p className="text-[11px] text-slate-400">
              WebGL Hardware Accelerated · Move cursor to orbit
            </p>
          </div>
        </div>

        {/* Lock Selector Pills */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          {(['lock1', 'lock2', 'lock3']).map((l) => (
            <button
              key={l}
              onClick={() => setActiveLock(l)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeLock === l
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {l === 'lock1' ? 'Lock 1' : l === 'lock2' ? 'Lock 2' : 'Lock 3'}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div
        ref={mountRef}
        style={{ height: `${height}px` }}
        className="w-full relative cursor-grab active:cursor-grabbing my-1 flex items-center justify-center"
      />

      {/* Bottom Technical Spec Pill */}
      <div className="pt-3 border-t border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs z-10">
        <div>
          <span className="font-bold text-white block sm:inline">
            {THEMES[activeLock].name}:
          </span>{' '}
          <span className="text-slate-300">
            {THEMES[activeLock].description}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 font-mono text-[11px] text-blue-300">
            {THEMES[activeLock].crypto}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

