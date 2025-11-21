
import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Cylinder, Cone } from '@react-three/drei';
import { ArrowLeft, Flame, Gauge, Activity, Rocket, Timer, Map, Database } from 'lucide-react';
import * as THREE from 'three';

interface RocketLabProps {
  onExit: () => void;
}

// --- 3D Components ---

const RocketEngine = ({ flowRate }: { flowRate: number }) => {
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (flameRef.current) {
      // Jitter the flame for realism
      const jitter = Math.random() * 0.1;
      const scaleY = (flowRate / 20) + jitter; // Scale flame based on flow rate
      flameRef.current.scale.set(1 + jitter * 0.5, Math.max(0.1, scaleY), 1 + jitter * 0.5);
      flameRef.current.position.y = -1.5 - (scaleY / 2); // Keep attached to nozzle
      
      // Flicker opacity
      const mat = flameRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.6 + Math.random() * 0.4;
    }
  });

  return (
    <group position={[0, 1, 0]}>
      {/* Rocket Body */}
      <Cylinder args={[0.5, 0.5, 3, 32]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.2} />
      </Cylinder>
      
      {/* Nose Cone */}
      <Cone args={[0.5, 1, 32]} position={[0, 3.5, 0]}>
        <meshStandardMaterial color="#ef4444" />
      </Cone>

      {/* Fins */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, i * (Math.PI / 2), 0]} position={[0, 0.5, 0]}>
          <boxGeometry args={[0.1, 1, 1.5]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      ))}

      {/* Engine Nozzle */}
      <Cone args={[0.4, 0.8, 32, 1, true]} position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial color="#334155" side={THREE.DoubleSide} />
      </Cone>

      {/* Dynamic Flame */}
      <mesh ref={flameRef} position={[0, -1, 0]}>
        <coneGeometry args={[0.3, 1, 16, 1, true]} />
        <meshBasicMaterial 
          color={flowRate > 80 ? "#3b82f6" : "#f97316"} // Blue flame at high thrust
          transparent 
          opacity={0.8} 
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

const TestStand = () => {
  return (
    <group position={[0, -2, 0]}>
      <Cylinder args={[2, 2.5, 1, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.5} />
      </Cylinder>
      <gridHelper args={[20, 20, "#475569", "#1e293b"]} position={[0, -0.5, 0]} />
    </group>
  );
};

// --- Main Component ---

const RocketLab: React.FC<RocketLabProps> = ({ onExit }) => {
  const [flowRate, setFlowRate] = useState<number>(0); // kg/s
  const [fuelLoad, setFuelLoad] = useState<number>(5000); // kg
  
  // Constants for simulation
  const EXHAUST_VELOCITY = 2500; // m/s (approx for liquid fuel)
  const ROCKET_DRY_MASS = 2000; // kg (structure + payload)

  // 1. Thrust Calculation: F = m_dot * Ve
  const thrustkN = (flowRate * EXHAUST_VELOCITY) / 1000; // kN
  const thrustN = thrustkN * 1000; // Newtons

  // 2. Burn Time: t = m_fuel / m_dot
  const burnTimeSeconds = flowRate > 0 ? fuelLoad / flowRate : 0;

  // 3. Delta V (Tsiolkovsky Rocket Equation): dV = Ve * ln(m0 / mf)
  const initialMass = ROCKET_DRY_MASS + fuelLoad;
  const finalMass = ROCKET_DRY_MASS;
  // We calculate potential Delta V based on full tank, but applied acceleration depends on flow.
  const maxDeltaV = EXHAUST_VELOCITY * Math.log(initialMass / finalMass); // m/s

  // 4. Distance Traveled DURING Burn (Acceleration Phase)
  // Approximation: d = 1/2 * a * t^2
  // Since mass changes, acceleration is not constant. We use average mass for estimation.
  const averageMass = ROCKET_DRY_MASS + (fuelLoad / 2);
  const averageAcceleration = flowRate > 0 ? thrustN / averageMass : 0; // m/s^2
  
  const burnDistanceMeters = 0.5 * averageAcceleration * Math.pow(burnTimeSeconds, 2);
  const burnDistanceKm = burnDistanceMeters / 1000;

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden flex">
      
      {/* Left Side: 3D Simulation */}
      <div className="flex-grow relative h-full">
        <div className="absolute top-8 left-8 z-10">
          <button 
            onClick={onExit}
            className="flex items-center text-cyan-400 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded border border-cyan-500/30 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Exit Experiment
          </button>
        </div>

        <Canvas camera={{ position: [4, 4, 6], fov: 50 }}>
          <color attach="background" args={['#0f172a']} />
          <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#f97316" />
          
          <RocketEngine flowRate={flowRate} />
          <TestStand />
          
          <OrbitControls maxPolarAngle={Math.PI / 2} minDistance={3} maxDistance={15} />
        </Canvas>
      </div>

      {/* Right Side: Control Panel & Data */}
      <div className="w-96 bg-slate-900 border-l border-cyan-500/30 p-6 flex flex-col gap-6 z-20 shadow-xl overflow-y-auto custom-scrollbar">
        
        <div>
          <h2 className="text-2xl font-bold text-white brand-font flex items-center gap-2">
            <Rocket className="text-cyan-400" /> Rocket Lab
          </h2>
          <p className="text-gray-400 text-sm mt-1">Propulsion & Range Calculator</p>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-cyan-400 text-sm font-bold flex items-center gap-2">
                <Gauge className="w-4 h-4" /> Fuel Flow Rate
              </label>
              <span className="text-white font-mono">{flowRate.toFixed(1)} kg/s</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="0.1"
              value={flowRate}
              onChange={(e) => setFlowRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-orange-400 text-sm font-bold flex items-center gap-2">
                <Database className="w-4 h-4" /> Fuel Tank Load
              </label>
              <span className="text-white font-mono">{fuelLoad} kg</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="20000" 
              step="500"
              value={fuelLoad}
              onChange={(e) => setFuelLoad(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>

        {/* Performance Data */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <p className="text-gray-500 text-[10px] uppercase">Thrust Generated</p>
              <p className="text-xl text-white font-mono">{thrustkN.toFixed(1)} <span className="text-xs text-gray-400">kN</span></p>
           </div>
           <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <p className="text-gray-500 text-[10px] uppercase">Exhaust Velocity</p>
              <p className="text-xl text-white font-mono">2.5 <span className="text-xs text-gray-400">km/s</span></p>
           </div>
        </div>

        {/* Distance / Burn Stats */}
        <div className="bg-black/20 p-4 rounded border border-gray-700 space-y-4">
          <h3 className="text-cyan-500 text-xs font-bold uppercase flex items-center gap-2">
            <Activity className="w-3 h-3" /> Mission Performance
          </h3>
          
          <div className="flex items-center justify-between border-b border-gray-700 pb-2">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Timer className="w-4 h-4 text-yellow-500" /> Burn Time
            </div>
            <div className="text-right">
              <p className="font-mono text-lg text-white">{flowRate > 0 ? burnTimeSeconds.toFixed(1) : "∞"} s</p>
              <p className="text-[10px] text-gray-500">Until fuel depletion</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-700 pb-2">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Map className="w-4 h-4 text-green-500" /> Acceleration Dist.
            </div>
            <div className="text-right">
              <p className="font-mono text-lg text-white">{flowRate > 0 ? burnDistanceKm.toFixed(2) : "0.00"} km</p>
              <p className="text-[10px] text-gray-500">Distance covered during burn</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Rocket className="w-4 h-4 text-red-500" /> Max Delta-V
            </div>
            <div className="text-right">
              <p className="font-mono text-lg text-white">{(maxDeltaV / 1000).toFixed(2)} km/s</p>
              <p className="text-[10px] text-gray-500">Total velocity change capacity</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded text-xs text-blue-200">
          <strong>Physics Insight:</strong> Higher flow rate increases Thrust (Force), but burns fuel faster. 
          Total Delta-V (change in speed) depends on the ratio of Fuel Mass to Dry Mass, not how fast you burn it!
        </div>
      </div>
    </div>
  );
};

export default RocketLab;
