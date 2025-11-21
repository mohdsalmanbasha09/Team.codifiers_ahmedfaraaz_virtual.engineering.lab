import React, { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Center, Float } from '@react-three/drei';
import { SATELLITE_EXAMPLES } from '../constants';
import { SatelliteData } from '../types';
import { ArrowLeft, Cpu, Radio, Zap } from 'lucide-react';

interface SatelliteLabProps {
  onHome: () => void;
}

// A simple boxy satellite model for "Network Satellite"
const NetworkSatellite = ({ onSelect, selected }: { onSelect: () => void, selected: boolean }) => {
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Main Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial color={selected ? "#00FFFF" : "#888"} wireframe={selected} />
        </mesh>
        {/* Solar Panels */}
        <mesh position={[2, 0, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[3, 0.1, 1]} />
          <meshStandardMaterial color="#223344" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-2, 0, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[3, 0.1, 1]} />
          <meshStandardMaterial color="#223344" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Antenna */}
        <mesh position={[0, 1.2, 0]}>
          <coneGeometry args={[0.3, 0.8, 16]} />
          <meshStandardMaterial color="#aaa" />
        </mesh>
        
        {/* Label */}
        <Html position={[0, -1.5, 0]} center transform>
          <div className="text-white bg-black/50 px-2 py-1 text-xs border border-white/30 rounded">
            Network Satellite
          </div>
        </Html>
      </Float>
    </group>
  );
};

// A rover-like model for "Rover Satellite" (Lander)
const RoverSatellite = ({ onSelect, selected }: { onSelect: () => void, selected: boolean }) => {
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        {/* Main Body */}
        <mesh position={[0, 0, 0]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={selected ? "#00FFFF" : "#A52A2A"} wireframe={selected} />
        </mesh>
        {/* Legs */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos(i * Math.PI/2)*0.8, -0.8, Math.sin(i * Math.PI/2)*0.8]} rotation={[0.5, i * Math.PI/2, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        ))}
        {/* Dish */}
        <mesh position={[0.8, 0.5, 0]} rotation={[0, 0, -0.5]}>
           <cylinderGeometry args={[0.5, 0.1, 0.2]} />
           <meshStandardMaterial color="#ddd" />
        </mesh>

         {/* Label */}
         <Html position={[0, -1.8, 0]} center transform>
          <div className="text-white bg-black/50 px-2 py-1 text-xs border border-white/30 rounded">
            Rover Satellite
          </div>
        </Html>
      </Float>
    </group>
  );
};

const SatelliteLab: React.FC<SatelliteLabProps> = ({ onHome }) => {
  const [activeSatId, setActiveSatId] = useState<string | null>(null);

  const activeData = SATELLITE_EXAMPLES.find(s => s.id === activeSatId);

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{ 
             backgroundImage: 'linear-gradient(#4fd1c5 1px, transparent 1px), linear-gradient(90deg, #4fd1c5 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}
      />

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <OrbitControls enableZoom={false} />
        
        <Center position={[-2.5, 0, 0]}>
          <NetworkSatellite 
            selected={activeSatId === 'net-sat-1'}
            onSelect={() => setActiveSatId('net-sat-1')} 
          />
        </Center>

        <Center position={[2.5, 0, 0]}>
          <RoverSatellite 
            selected={activeSatId === 'rover-1'}
            onSelect={() => setActiveSatId('rover-1')} 
          />
        </Center>
      </Canvas>

      {/* Top Nav */}
      <div className="absolute top-8 left-8 z-10">
        <button onClick={onHome} className="flex items-center text-cyan-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Return to Orbit
        </button>
      </div>

      {/* Right Panel: Satellite Info (Sketch 4 "Info" boxes) */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-black/90 border-l border-cyan-500/30 p-8 backdrop-blur-md transform transition-transform duration-500 flex flex-col">
        <h2 className="text-3xl font-bold text-white mb-2 brand-font">Satellite Lab</h2>
        <p className="text-gray-400 mb-8 text-sm">Select a unit to inspect engineering schematics.</p>

        {activeData ? (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="border-b border-gray-700 pb-4">
              <h3 className="text-2xl text-cyan-400 font-bold">{activeData.name}</h3>
              <p className="text-gray-400 italic mt-1">{activeData.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-800/50 p-4 rounded flex items-center">
                 <div className="w-10 h-10 bg-cyan-900/50 rounded flex items-center justify-center mr-4">
                   <Cpu className="text-cyan-400 w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-xs text-gray-500 uppercase">Total Mass</p>
                   <p className="text-xl font-mono text-white">{activeData.specs.mass}</p>
                 </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded flex items-center">
                 <div className="w-10 h-10 bg-orange-900/50 rounded flex items-center justify-center mr-4">
                   <Zap className="text-orange-400 w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-xs text-gray-500 uppercase">Power Source</p>
                   <p className="text-xl font-mono text-white">{activeData.specs.power}</p>
                 </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded flex items-center">
                 <div className="w-10 h-10 bg-purple-900/50 rounded flex items-center justify-center mr-4">
                   <Radio className="text-purple-400 w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-xs text-gray-500 uppercase">Target Orbit</p>
                   <p className="text-xl font-mono text-white">{activeData.specs.orbit}</p>
                 </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 border border-dashed border-gray-600 rounded text-center text-xs text-gray-500">
              <p>SCHEMATIC VER 4.2.1</p>
              <p>CONFIDENTIAL ENGINEERING DATA</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-30">
            <div className="text-center">
              <div className="w-16 h-16 border-2 border-white rounded-full mx-auto mb-4 animate-pulse"></div>
              <p>Waiting for selection...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SatelliteLab;