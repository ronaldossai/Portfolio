import React from 'react';
// Import these lines once you've installed Three.js dependencies
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
// import ComputerModel from './ComputerModel';

// Placeholder component until Three.js is installed
export default function ComputerScene() {
  return (
    <div className="h-64 md:h-80 lg:h-96 w-full md:w-1/2 flex items-center justify-center">
      <div className="bg-tertiary p-6 rounded-lg shadow-lg text-center">
        <div className="mb-4">
          <div className="bg-secondary/80 w-32 h-24 mx-auto rounded-md flex items-center justify-center">
            <div className="bg-gray-700 w-28 h-20 rounded-md flex items-center justify-center">
              <div className="text-white text-xs">
                <span className="text-secondary">// TODO: </span><br />
                Install Three.js<br />dependencies
              </div>
            </div>
          </div>
        </div>
        <p className="text-dark text-sm">
          Placeholder for 3D Computer Model
        </p>
        <p className="text-secondary text-xs mt-2">
          (Three.js dependencies needed)
        </p>
      </div>
    </div>
  );
}
