import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

const GlowRing = ({ speed }) => {
  const ringRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    ringRef.current.rotation.z = time * speed * 0.2;
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[1.6, 0.015, 8, 50]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.5} />
    </mesh>
  );
};

const OrbMesh = ({ count, color, distortion, speed }) => {
  const meshRef = useRef();

  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 32, 32]} scale={1.3}>
        <MeshDistortMaterial
          color={color}
          speed={speed}
          distort={distortion}
          roughness={0.1}
          metalness={0.9}
        />
      </Sphere>
      <GlowRing speed={speed} />
    </Float>
  );
};

const CareerOrb = ({ count = 0 }) => {
  const distortion = Math.min(0.35 + (count * 0.02), 0.6);
  const speed = Math.min(1.2 + (count * 0.15), 3);
  const color = count > 0 ? '#818cf8' : '#475569';

  return (
    <div className="h-72 w-full">
      <Canvas 
        camera={{ position: [0, 0, 4.5] }} 
        dpr={1}
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[8, 8, 8]} angle={0.15} penumbra={1} intensity={1.5} color="#6366f1" />
        <pointLight position={[-8, -8, -8]} intensity={0.8} color="#a855f7" />
        
        <OrbMesh count={count} color={color} distortion={distortion} speed={speed} />
      </Canvas>
    </div>
  );
};

export default CareerOrb;
