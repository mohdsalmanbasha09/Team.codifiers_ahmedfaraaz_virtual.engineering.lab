
import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { ArrowLeft, Play, RotateCcw, ArrowDown } from 'lucide-react';
import * as THREE from 'three';

interface GravityLabProps {
  onExit: () => void;
}

interface PlanetGravity {
  id: string;
  name: string;
  g: number; // m/s^2
  color: string;
}

const PLANETS: PlanetGravity[] = [
  { id: 'earth', name: 'Earth', g: 9.81, color: '#22A6B3' },
  { id: 'moon', name: 'Moon', g: 1.62, color: '#A5A5A5' },
  { id: 'mars', name: 'Mars', g: 3.72, color: '#EB4D4B' },
  { id: 'jupiter', name: 'Jupiter', g: 24.79, color: '#D35400' },
];

const DROP_HEIGHT = 10; // meters

// --- 3D Components ---

const ChamberWalls = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>
      <gridHelper args={[20, 20, "#475569", "#0f172a"]} position={[0, 0.01, 0]} />

      {/* Height Markers Pillar */}
      <mesh position={[-2, 5, 0]}>
        <boxGeometry args={[0.2, 10, 0.2]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      {[0, 2.5, 5, 7.5, 10].map((y) => (
        <group key={y} position={[-2, y, 0]}>
          <mesh position={[0.3, 0, 0]}>
            <boxGeometry args={[0.4, 0.05, 0.05]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <Text 
            position={[1, 0, 0]} 
            fontSize={0.5} 
            color="white"
            anchorX="left"
            anchorY="middle"
          >
            {y}m
          </Text>
        </group>
      ))}
    </group>
  );
};

interface FallingObjectProps {
  isActive: boolean;
  g: number;
  color: string;
  isGhost?: boolean;
  onHit?: (time: number) => void;
  resetSignal: number;
}

const FallingObject: React.FC<FallingObjectProps> = ({ isActive, g, color, isGhost, onHit, resetSignal }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const hitRef = useRef(false);

  useEffect(() => {
    // Reset physics state
    timeRef.current = 0;
    hitRef.current = false;
    if (meshRef.current) {
      meshRef.current.position.y = DROP_HEIGHT;
    }
  }, [resetSignal, g]);

  useFrame((state, delta) => {
    if (isActive && !hitRef.current && meshRef.current) {
      timeRef.current += delta;
      const t = timeRef.current;
      
      // y = y0 - 0.5 * g * t^2
      const newY = DROP_HEIGHT - (0.5 * g * t * t);

      if (newY <= 0.5) { // 0.5 is radius of ball
        meshRef.current.position.y = 0.5;
        hitRef.current = true;
        if (onHit) onHit(t);
      } else {
        meshRef.current.position.y = newY;
      }
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={[isGhost ? 2 : 0, DROP_HEIGHT, 0]} 
      castShadow={!isGhost}
    >
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        transparent={isGhost} 
        opacity={isGhost ? 0.3 : 1}
        emissive={color}
        emissiveIntensity={isGhost ? 0 : 0.2}
      />
      {!isGhost && (
        <Html position={[0, 1, 0]} center>
           <div className="text-xs bg-black/50 text-white px-1 rounded whitespace-nowrap border border-white/20">
             {hitRef.current ? 'Impact' : 'Test Mass'}
           </div>
        </Html>
      )}
    </mesh>
  );
};

// --- Main Component ---

const GravityLab: React.FC<GravityLabProps> = ({ onExit }) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetGravity>(PLANETS[0]);
  const [isDropping, setIsDropping] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  
  // Results
  const [fallTime, setFallTime] = useState<number | null>(null);
  const [impactVelocity, setImpactVelocity] = useState<number | null>(null);

  const startDrop = () => {
    setFallTime(null);
    setImpactVelocity(null);
    setResetCount(p => p + 1); // Reset positions first
    setTimeout(() => setIsDropping(true), 100); // Slight delay to ensure reset
  };

  const reset = () => {
    setIsDropping(false);
    setResetCount(p => p + 1);
    setFallTime(null);
    setImpactVelocity(null);
  };

  const handleImpact = (time: number) => {
    setFallTime(time);
    // v = g * t
    setImpactVelocity(selectedPlanet.g * time);
  };

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
            Exit Lab
          </button>
        </div>

        <div className="absolute top-8 right-8 z-10 bg-black/60 p-4 rounded backdrop-blur text-right border border-gray-700">
           <h3 className="text-xl font-bold text-white mb-1">Vacuum Chamber</h3>
           <p className="text-gray-400 text-xs">Height: {DROP_HEIGHT} meters</p>
           <div className="mt-2 text-2xl font-mono text-cyan-400 font-bold">
              g = {selectedPlanet.g} m/s²
           </div>
        </div>

        <Canvas shadows camera={{ position: [0, 6, 14], fov: 45 }}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          
          <ChamberWalls />
          
          {/* Main Object */}
          <FallingObject 
            isActive={isDropping} 
            g={selectedPlanet.g} 
            color={selectedPlanet.color}
            onHit={handleImpact}
            resetSignal={resetCount}
          />

          {/* Earth Ghost Reference (only if not on Earth) */}
          {selectedPlanet.id !== 'earth' && (
            <FallingObject 
              isActive={isDropping} 
              g={9.81} 
              color="#22A6B3" 
              isGhost={true}
              resetSignal={resetCount}
            />
          )}

          <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} />
        </Canvas>
      </div>

      {/* Right Side: Controls */}
      <div className="w-80 bg-slate-900 border-l border-cyan-500/30 p-6 flex flex-col gap-6 z-20 shadow-xl">
        
        <div>
          <h2 className="text-2xl font-bold text-white brand-font flex items-center gap-2">
            <ArrowDown className="text-cyan-400" /> Gravity Lab
          </h2>
          <p className="text-gray-400 text-sm mt-1">Free Fall Simulator</p>
        </div>

        {/* Planet Selector */}
        <div className="grid grid-cols-2 gap-2">
          {PLANETS.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlanet(p);
                reset();
              }}
              className={`p-3 rounded border text-sm font-bold transition-all ${
                selectedPlanet.id === p.id 
                ? 'bg-cyan-900/50 border-cyan-500 text-white' 
                : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={startDrop}
            disabled={isDropping && fallTime === null}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" /> DROP
          </button>
          <button 
            onClick={reset}
            className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Results Display */}
        <div className="bg-black/30 p-4 rounded border border-gray-700 space-y-4 flex-grow">
          <h3 className="text-cyan-500 text-xs font-bold uppercase border-b border-gray-700 pb-2">
            Experiment Data
          </h3>
          
          <div>
             <p className="text-gray-500 text-xs uppercase">Equation</p>
             <p className="text-white font-mono italic text-sm mt-1">d = ½gt²</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-800/50 p-3 rounded">
              <p className="text-gray-400 text-xs">Fall Time (t)</p>
              <p className="text-2xl font-mono text-white">
                {fallTime !== null ? fallTime.toFixed(2) : '--'} <span className="text-sm text-gray-500">s</span>
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded">
              <p className="text-gray-400 text-xs">Impact Velocity (v)</p>
              <p className="text-2xl font-mono text-white">
                {impactVelocity !== null ? impactVelocity.toFixed(2) : '--'} <span className="text-sm text-gray-500">m/s</span>
              </p>
            </div>
          </div>

          {selectedPlanet.id !== 'earth' && fallTime !== null && (
             <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
               Comparison: On Earth, this would take <span className="text-white font-bold">{(Math.sqrt(2 * DROP_HEIGHT / 9.81)).toFixed(2)}s</span>.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GravityLab;
