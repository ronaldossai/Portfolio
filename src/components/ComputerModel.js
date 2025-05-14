import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export default function ComputerModel({ ...props }) {
  const group = useRef();
  const { nodes } = useGLTF('/assets/NE555.glb');
  
  // Add rotation animation
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      {/* Render the NE555 chip model */}
      {/* No longer using 3D model*/}
      {Object.keys(nodes).map((nodeName) => {
        // Skip the Scene node or any other non-mesh nodes
        if (nodeName === 'Scene' || !nodes[nodeName].geometry) return null;
        
        return (
          <mesh
            key={nodeName}
            castShadow
            receiveShadow
            geometry={nodes[nodeName].geometry}
            material={nodes[nodeName].material}
            position={nodes[nodeName].position}
            rotation={nodes[nodeName].rotation}
            scale={nodes[nodeName].scale}
          />
        );
      })}
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/computer.glb');
