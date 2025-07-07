import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

function FloatingNode({ position, text, color = '#ffffff' }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
      position={position}
    >
      <mesh ref={meshRef}>
        <boxGeometry args={[1.2, 0.8, 0.2]} />
        <meshStandardMaterial 
          color={color}
          transparent={true}
          opacity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <Center position={[0, 0, 0.15]}>
        <Text3D
          font="/fonts/inter_bold.json"
          size={0.1}
          height={0.02}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.01}
          bevelSize={0.01}
          bevelOffset={0}
          bevelSegments={5}
        >
          {text}
          <meshStandardMaterial color="#000000" />
        </Text3D>
      </Center>
    </Float>
  );
}

function ConnectionLine({ start, end }) {
  const lineRef = useRef();
  
  useFrame((state) => {
    if (lineRef.current) {
      const time = state.clock.elapsedTime;
      lineRef.current.material.opacity = 0.3 + Math.sin(time * 2) * 0.2;
    }
  });

  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ];
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial 
        color="#ffffff" 
        transparent={true}
        opacity={0.3}
      />
    </line>
  );
}

export default function FloatingNodes() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <FloatingNode position={[-2, 1, 0]} text="TEXT" color="#ffffff" />
        <FloatingNode position={[0, 0, 0]} text="IMAGE" color="#e5e5e5" />
        <FloatingNode position={[2, -1, 0]} text="VIDEO" color="#d4d4d4" />
        
        <ConnectionLine start={[-2, 1, 0]} end={[0, 0, 0]} />
        <ConnectionLine start={[0, 0, 0]} end={[2, -1, 0]} />
      </Canvas>
    </div>
  );
}