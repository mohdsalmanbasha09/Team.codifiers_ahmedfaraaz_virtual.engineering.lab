
import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Html } from '@react-three/drei';
import { ArrowLeft, Sun, Zap, Battery, AlertTriangle, Info } from 'lucide-react';
import * as THREE from 'three';

interface SolarPowerLabProps {
  onExit: () => void;
}

// --- Constants ---
const SOLAR_CONSTANT = 1361; // W/m^2 at 1 AU

// --- 3D Components ---

const SolarPanelSatellite = ({ distanceAU, irradiance }: { distanceAU: number, irradiance: number }) => {
  // Calculate visual glow based on irradiance (max glow at Mercury, dim at Jupiter)
  // Normalized: Mercury (~9000 W/m2) is max. Earth (1361) is normal.
  const intensityFactor = Math.min(irradiance / 1361, 3); 
  const emissiveIntensity = Math.min(intensityFactor * 0.5, 2);

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <group rotation={[0, -Math.PI / 4, 0]}>
        {/* Central Body */}
        <mesh>
          <boxGeometry args={[1, 1.5, 1]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Solar Wings */}
        <group>
          {/* Left Wing */}
          <mesh position={[-2.2, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[3, 1.2, 0.1]} />
            <meshStandardMaterial 
              color="#1e293b" 
              emissive="#3b82f6" 
              emissiveIntensity={emissiveIntensity} 
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          {/* Grid Lines on Panel */}
          <mesh position={[-2.2, 0, 0.06]}>
            <planeGeometry args={[2.8, 1.1]} />
            <meshBasicMaterial color="#ffffff" wireframe opacity={0.1} transparent />
          </mesh>

          {/* Right Wing */}
          <mesh position={[2.2, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[3, 1.2, 0.1]} />
            <meshStandardMaterial 
              color="#1e293b" 
              emissive="#3b82f6" 
              emissiveIntensity={emissiveIntensity} 
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
           <mesh position={[2.2, 0, 0.06]}>
            <planeGeometry args={[2.8, 1.1]} />
            <meshBasicMaterial color="#ffffff" wireframe opacity={0.1} transparent />
          </mesh>
        </group>

        {/* Antenna */}
        <mesh position={[0, 1, 0]}>
           <cylinderGeometry args={[0.1, 0.1, 0.5]} />
           <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
           <sphereGeometry args={[0.3]} />
           <meshStandardMaterial color="#94a3b8" />
        </mesh>

        {/* Label */}
        <Html position={[0, -1.2, 0]} center>
           <div className="text-[10px] bg-black/60 text-cyan-400 px-1 border border-cyan-500/30 rounded whitespace-nowrap">
             PV Array Temp: {(273 + (20 * intensityFactor)).toFixed(0)} K
           </div>
        </Html>
      </group>
    </Float>
  );
};

const SunSource = ({ distanceAU }: { distanceAU: number }) => {
  // Visually move the sun away, but keep it in view. 
  // Mapping: 0.2 AU -> x=-4. 10 AU -> x=-40.
  const visualX = -4 - (distanceAU * 2);
  
  return (
    <group position={[visualX, 2, 4]}>
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      {/* Light source intensity decays with distance */}
      <pointLight 
        intensity={3} 
        distance={100} 
        decay={0} // We handle visual fading via position manually for clarity
        color="#fff" 
      />
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#FDB813" transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

const FluxVisualization = ({ distanceAU }: { distanceAU: number }) => {
  // Visualize "rays" or particles becoming less dense
  const count = Math.max(5, Math.floor(50 / (distanceAU * distanceAU)));
  
  return (
    <group position={[-4, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
       {Array.from({ length: count }).map((_, i) => (
         <mesh key={i} position={[Math.random() * 2 - 1, Math.random() * 4 - 2, Math.random() * 10]} rotation={[0, Math.PI/2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 20]} />
            <meshBasicMaterial color="yellow" transparent opacity={0.2} />
         </mesh>
       ))}
    </group>
  );
};

// --- Main Component ---

const SolarPowerLab: React.FC<SolarPowerLabProps> = ({ onExit }) => {
  const [distance, setDistance] = useState<number>(1.0); // AU

  // Physics Calculation
  // I = P / (4 * pi * r^2), but we use Solar Constant reference.
  // I_local = I_earth / d_au^2
  const irradiance = SOLAR_CONSTANT / (distance * distance);
  
  // Efficiency Calculation (Hypothetical Panel)
  // Standard panels drop efficiency if too hot (Mercury) or too low light (Jupiter)
  // Simplified: 20% base efficiency.
  const panelArea = 10; // m^2
  const rawPower = irradiance * panelArea;
  const generatedPower = rawPower * 0.20; // 20% efficiency

  const getZoneInfo = (d: number) => {
    if (d < 0.7) return { name: "Inner Solar System (Mercury/Venus)", status: "EXTREME HEAT", color: "text-red-500" };
    if (d < 1.5) return { name: "Habitable Zone (Earth)", status: "OPTIMAL", color: "text-green-500" };
    if (d < 3.0) return { name: "Asteroid Belt / Mars", status: "REDUCED OUTPUT", color: "text-yellow-500" };
    return { name: "Outer Solar System (Jupiter+)", status: "CRITICAL LOW POWER", color: "text-blue-500" };
  };

  const zone = getZoneInfo(distance);

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden flex">
      
      {/* Left: 3D Scene */}
      <div className="flex-grow relative h-full">
         <div className="absolute top-8 left-8 z-10">
          <button 
            onClick={onExit}
            className="flex items-center text-cyan-400 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded border border-cyan-500/30 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Exit Lab
          </button>
        </div>
        
        <div className="absolute bottom-8 left-8 z-10 max-w-md text-xs text-gray-400 pointer-events-none select-none">
           <p>Visual scale modified for clarity. Light intensity represents photon flux density.</p>
        </div>

        <Canvas shadows camera={{ position: [4, 2, 6], fov: 50 }}>
          <color attach="background" args={['#020617']} />
          <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.1} />
          
          <SolarPanelSatellite distanceAU={distance} irradiance={irradiance} />
          <SunSource distanceAU={distance} />
          <FluxVisualization distanceAU={distance} />
          
          <OrbitControls minDistance={3} maxDistance={10} />
        </Canvas>
      </div>

      {/* Right: Controls & Data */}
      <div className="w-96 bg-slate-900 border-l border-cyan-500/30 p-6 flex flex-col gap-6 z-20 shadow-xl overflow-y-auto custom-scrollbar">
        
        <div>
          <h2 className="text-2xl font-bold text-white brand-font flex items-center gap-2">
            <Sun className="text-yellow-400" /> Solar Efficiency
          </h2>
          <p className="text-gray-400 text-sm mt-1">Inverse Square Law Lab</p>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
             <div className="flex justify-between items-end mb-2">
               <label className="text-cyan-400 text-sm font-bold">Distance from Sun</label>
               <span className="text-2xl font-mono text-white">{distance.toFixed(2)} <span className="text-sm text-gray-500">AU</span></span>
             </div>
             <input 
              type="range" 
              min="0.3" 
              max="10.0" 
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
             <div className="flex justify-between text-[10px] text-gray-500 mt-1">
               <span>Mercury (0.4)</span>
               <span>Earth (1.0)</span>
               <span>Saturn (9.5)</span>
             </div>
          </div>

          {/* Status Box */}
          <div className={`p-3 rounded border border-dashed text-center ${zone.color === 'text-red-500' ? 'border-red-900 bg-red-900/10' : zone.color === 'text-blue-500' ? 'border-blue-900 bg-blue-900/10' : 'border-gray-700 bg-gray-800/30'}`}>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">Location</p>
             <p className="text-white font-bold">{zone.name}</p>
             <p className={`text-xs font-bold mt-1 ${zone.color}`}>{zone.status}</p>
          </div>

          {/* Data Display */}
          <div className="grid grid-cols-1 gap-3">
             <div className="bg-black/30 p-4 rounded border border-yellow-500/20 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-yellow-500/10">
                   <Sun className="w-24 h-24" />
                </div>
                <p className="text-gray-400 text-xs uppercase">Solar Irradiance</p>
                <p className="text-2xl font-mono text-white">
                   {irradiance.toFixed(0)} <span className="text-sm text-gray-500">W/m²</span>
                </p>
             </div>

             <div className="bg-black/30 p-4 rounded border border-green-500/20 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-green-500/10">
                   <Zap className="w-24 h-24" />
                </div>
                <p className="text-gray-400 text-xs uppercase">Generated Power (10m²)</p>
                <p className="text-2xl font-mono text-white">
                   {generatedPower.toFixed(0)} <span className="text-sm text-gray-500">Watts</span>
                </p>
             </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded text-xs text-blue-200 mt-auto flex items-start gap-2">
             <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
             <p>
               As distance doubles, intensity drops by 4x (1/d²). 
               Deep space missions require large arrays or nuclear sources (RTG).
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarPowerLab;
