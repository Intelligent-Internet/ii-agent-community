import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 100 }) {
  const mesh = useRef();
  
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp.set([
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ], i * 3);
    }
    return temp;
  }, [count]);

  const velocities = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp.set([
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
      ], i * 3);
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      const positions = mesh.current.geometry.attributes.position.array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Update positions
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
        
        // Wrap around edges
        if (positions[i3] > 10) positions[i3] = -10;
        if (positions[i3] < -10) positions[i3] = 10;
        if (positions[i3 + 1] > 10) positions[i3 + 1] = -10;
        if (positions[i3 + 1] < -10) positions[i3 + 1] = 10;
        if (positions[i3 + 2] > 10) positions[i3 + 2] = -10;
        if (positions[i3 + 2] < -10) positions[i3 + 2] = 10;
      }
      
      mesh.current.geometry.attributes.position.needsUpdate = true;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent={true}
        opacity={0.6}
        sizeAttenuation={true}
      />
    </points>
  );
}

export default function ParticleField() {
  return (
    <div className="absolute inset-0 -z-20">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Particles count={150} />
      </Canvas>
    </div>
  );
}