import React, { useRef, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

const AnimatedOrb = memo(({ value, color }) => {
  const meshRef = useRef();
  const scale = Math.min(0.4 + (value * 0.04), 1);
  const distortion = Math.min(0.15 + (value * 0.015), 0.4);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.y = time * 0.3;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 24, 24]} scale={scale}>
        <MeshDistortMaterial
          color={color}
          speed={1.5}
          distort={distortion}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
});

const StatOrb = memo(({ value = 0, color = "#6366f1" }) => {
  return (
    <div className="h-28 w-28">
      <Canvas 
        camera={{ position: [0, 0, 2.5] }} 
        dpr={1}
        frameloop="demand"
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1} color={color} />
        
        <AnimatedOrb value={value} color={color} />
      </Canvas>
    </div>
  );
});

export default StatOrb;
