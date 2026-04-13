import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Environment, Text3D, Center, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedSphere = ({ position, color, scale, speed }) => {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(time * speed) * 0.3;
    meshRef.current.rotation.y = time * 0.5;
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} position={position} scale={scale}>
      <MeshDistortMaterial
        color={color}
        speed={2}
        distort={0.3}
        roughness={0}
        metalness={1}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </Sphere>
  );
};

const GlowingGrid = () => {
  const gridRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    gridRef.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.2) * 0.05;
  });

  return (
    <mesh ref={gridRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[30, 30, 30, 30]} />
      <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.1} />
    </mesh>
  );
};

const HeroScene = ({ title = "Tech Hub" }) => {
  return (
    <div className="h-48 w-full rounded-3xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} color="#6366f1" />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color="#a855f7" />
        
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
          <AnimatedSphere position={[-4, 1, -2]} color="#6366f1" scale={0.6} speed={1.2} />
          <AnimatedSphere position={[4, -1, -3]} color="#a855f7" scale={0.5} speed={1.5} />
          <AnimatedSphere position={[0, 2, -4]} color="#22d3ee" scale={0.4} speed={1.8} />
        </Float>
        
        <Sparkles count={100} scale={12} size={3} speed={0.3} color="#6366f1" />
        
        <GlowingGrid />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default HeroScene;
