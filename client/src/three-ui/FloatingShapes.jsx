import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

const FloatingOrb = ({ position, color, speed, distort, scale = 1 }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(time / 3) * 0.2;
    meshRef.current.rotation.y = Math.cos(time / 4) * 0.2;
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 32, 32]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          speed={speed * 0.5}
          distort={distort}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

const ParticleField = () => {
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i < 50; i++) {
      p.push(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
    }
    return new Float32Array(p);
  }, []);

  const pointsRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#6366f1" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
};

const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 -z-10 opacity-60">
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 60 }} 
        dpr={1}
        frameloop="demand"
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#6366f1" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#a855f7" />
        
        <FloatingOrb position={[-3, 2, -3]} color="#6366f1" speed={1} distort={0.3} scale={0.6} />
        <FloatingOrb position={[3, -1, -2]} color="#a855f7" speed={0.8} distort={0.4} scale={0.5} />
        <FloatingOrb position={[0, 3, -4]} color="#22d3ee" speed={1.2} distort={0.3} scale={0.4} />
        
        <ParticleField />
      </Canvas>
    </div>
  );
};

export default FloatingShapes;
