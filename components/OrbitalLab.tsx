
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line } from '@react-three/drei';
import { ArrowLeft, RotateCcw, Play, Globe, Info, AlertTriangle, Rocket, Target } from 'lucide-react';
import * as THREE from 'three';

interface OrbitalLabProps {
  onExit: () => void;
}

// --- Physics Constants ---
const PLANET_RADIUS = 2;
const GM = 20; // Gravitational Parameter (G * M)
const INITIAL_RADIUS = 4; // Starting distance from center

// --- 3D Components ---

const CentralPlanet = () => {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshStandardMaterial color="#1e40af" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Atmosphere Glow */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <Html position={[0, 2.5, 0]} center>
         <div className="text-[10px] text-cyan-300 font-mono bg-black/50 px-1 rounded">Earth (Start)</div>
      </Html>
    </group>
  );
};

interface SatelliteProps {
  position: THREE.Vector3;
  crashed: boolean;
}

const Satellite: React.FC<SatelliteProps> = ({ position, crashed }) => {
  if (crashed) return null; // Hide if crashed (explosion effect handled elsewhere conceptually)

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      {/* Solar Panels */}
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={[0.5, 0.05, 0.2]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[-0.4, 0, 0]}>
        <boxGeometry args={[0.5, 0.05, 0.2]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
};

// --- Simulation Logic ---

const SimulationScene = ({ 
  running, 
  initialSpeed, 
  angle, 
  onCrash, 
  onEscape,
  resetTrigger 
}: { 
  running: boolean, 
  initialSpeed: number, 
  angle: number, 
  onCrash: () => void, 
  onEscape: () => void,
  resetTrigger: number 
}) => {
  const satPos = useRef(new THREE.Vector3(INITIAL_RADIUS, 0, 0));
  const satVel = useRef(new THREE.Vector3(0, 0, 0));
  const [trail, setTrail] = useState<THREE.Vector3[]>([]);
  const [crashed, setCrashed] = useState(false);

  // Initialize / Reset
  useEffect(() => {
    satPos.current.set(INITIAL_RADIUS, 0, 0);
    
    // Calculate velocity vector based on angle
    // Angle 0 = Tangent (Perpendicular to radius). 
    // Positive Angle = Away from planet. Negative = Towards.
    const rads = (angle * Math.PI) / 180;
    
    // Z is tangent direction, X is radial direction
    // Velocity components relative to radial vector (1,0,0):
    // Radial velocity (X) = sin(angle) * speed
    // Tangential velocity (Z) = cos(angle) * speed (negative Z for right-hand rule orbit)
    
    const vx = Math.sin(rads) * initialSpeed;
    const vz = -Math.cos(rads) * initialSpeed;
    
    satVel.current.set(vx, 0, vz);
    setTrail([new THREE.Vector3(INITIAL_RADIUS, 0, 0)]);
    setCrashed(false);
  }, [resetTrigger, initialSpeed, angle]);

  useFrame((state, delta) => {
    if (!running || crashed) return;

    // Simulation sub-stepping for better accuracy
    const steps = 4;
    const dt = (delta * 1) / steps; // Time multiplier

    for (let i = 0; i < steps; i++) {
      const r = satPos.current.length();
      
      // Crash Detection
      if (r < PLANET_RADIUS + 0.1) {
        setCrashed(true);
        onCrash();
        return;
      }

      // Escape Detection (arbitrary large distance)
      if (r > 60) {
        onEscape();
      }

      // Gravity Physics: a = -GM / r^3 * pos
      const accel = satPos.current.clone().normalize().negate().multiplyScalar(GM / (r * r));
      
      satVel.current.add(accel.multiplyScalar(dt));
      satPos.current.add(satVel.current.clone().multiplyScalar(dt));
    }

    // Update Trail Visualization (sample every frame)
    setTrail(prev => {
      const last = prev[prev.length - 1];
      // Only add point if moved enough
      if (last && last.distanceTo(satPos.current) > 0.2) {
         return [...prev.slice(-300), satPos.current.clone()];
      }
      return prev;
    });
  });

  return (
    <>
      <CentralPlanet />
      <Satellite position={satPos.current} crashed={crashed} />
      {trail.length > 1 && (
        <Line points={trail} color={crashed ? "red" : "#fbbf24"} lineWidth={1} />
      )}
      
      {crashed && (
         <Html position={satPos.current}>
           <div className="text-red-500 font-bold bg-black/80 px-2 py-1 rounded border border-red-500 text-xs">CRASH</div>
         </Html>
      )}
    </>
  );
};

// --- Main Component ---

const OrbitalLab: React.FC<OrbitalLabProps> = ({ onExit }) => {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2.2); // Approx circular orbit speed for r=4, mu=20
  const [angle, setAngle] = useState(0); // Degrees offset from tangent
  const [resetCount, setResetCount] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'ORBITING' | 'CRASH' | 'ESCAPE'>('IDLE');

  // --- Trajectory Calculation Logic ---
  const trajectoryStats = useMemo(() => {
    // Physics mapping: Sim Radius 4 = 1 AU (Earth)
    const r0 = INITIAL_RADIUS;
    const v0 = speed;
    const rads = (angle * Math.PI) / 180;
    
    // Specific Mechanical Energy: E = v^2/2 - mu/r
    const specificEnergy = (v0 * v0) / 2 - GM / r0;
    
    // Specific Angular Momentum: h = r x v
    // v_tangential = v0 * cos(angle)
    const h = r0 * v0 * Math.cos(rads);

    // Semi-major axis: a = -mu / 2E
    // If E >= 0, orbit is parabolic or hyperbolic (Escape)
    let rMax = 0;
    let targetText = "";
    let maxAU = 0;

    if (specificEnergy >= 0) {
      targetText = "Interstellar Space (Escape)";
      rMax = Infinity;
      maxAU = Infinity;
    } else {
      const a = -GM / (2 * specificEnergy);
      // Eccentricity: e = sqrt(1 + 2Eh^2/mu^2)
      const e = Math.sqrt(1 + (2 * specificEnergy * h * h) / (GM * GM));
      
      // Aphelion distance (max distance from focus)
      rMax = a * (1 + e);
      
      // Convert Sim Units to AU. (4 sim units = 1 AU)
      maxAU = rMax / 4;

      if (maxAU < 1.1) targetText = "Low Earth Orbit";
      else if (maxAU < 1.4) targetText = "High Earth Orbit";
      else if (maxAU < 1.8) targetText = "Reaching Mars";
      else if (maxAU < 3.0) targetText = "Asteroid Belt";
      else if (maxAU < 6.0) targetText = "Reaching Jupiter";
      else if (maxAU < 12.0) targetText = "Reaching Saturn";
      else if (maxAU < 25.0) targetText = "Reaching Uranus";
      else targetText = "Reaching Neptune/Pluto";
      
      // Check for immediate crash trajectory (Perigee < Planet Radius)
      const rMin = a * (1 - e);
      if (rMin < PLANET_RADIUS) {
         // If we are launching outwards, we might hit it on return, but if launching inwards...
         // This simple check isn't perfect for launch angle but good enough estimate
      }
    }

    return { maxAU, targetText, energy: specificEnergy };
  }, [speed, angle]);


  const handlePlay = () => {
    if (running) return;
    setRunning(true);
    setStatus('ORBITING');
  };

  const handleReset = () => {
    setRunning(false);
    setResetCount(p => p + 1);
    setStatus('IDLE');
  };

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden flex">
      
      {/* Left: 3D View */}
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

        {/* Status Indicator Overlay */}
        <div className="absolute top-8 right-8 z-10">
           {status === 'IDLE' && <div className="bg-gray-800/80 text-gray-300 px-4 py-2 rounded border border-gray-600">Ready to Launch</div>}
           {status === 'ORBITING' && <div className="bg-blue-900/80 text-blue-200 px-4 py-2 rounded border border-blue-500 animate-pulse">Simulation Running...</div>}
           {status === 'CRASH' && <div className="bg-red-900/80 text-red-200 px-4 py-2 rounded border border-red-500 font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Impact Detected</div>}
           {status === 'ESCAPE' && <div className="bg-yellow-900/80 text-yellow-200 px-4 py-2 rounded border border-yellow-500 font-bold flex items-center gap-2"><Rocket className="w-4 h-4"/> Escaping Gravity Well</div>}
        </div>

        <Canvas camera={{ position: [0, 14, 0], fov: 45 }}>
          <color attach="background" args={['#020617']} />
          <Stars radius={100} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <SimulationScene 
            running={running} 
            initialSpeed={speed} 
            angle={angle} 
            resetTrigger={resetCount}
            onCrash={() => setStatus('CRASH')}
            onEscape={() => setStatus('ESCAPE')}
          />
          
          <OrbitControls minDistance={5} maxDistance={50} />
        </Canvas>
      </div>

      {/* Right: Controls */}
      <div className="w-80 bg-slate-900 border-l border-cyan-500/30 p-6 flex flex-col gap-6 z-20 shadow-xl">
        
        <div>
          <h2 className="text-2xl font-bold text-white brand-font flex items-center gap-2">
            <Globe className="text-blue-400" /> Orbital Lab
          </h2>
          <p className="text-gray-400 text-sm mt-1">Injection Simulator</p>
        </div>

        {/* Controls */}
        <div className="space-y-6">
           <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between mb-2">
                <label className="text-cyan-400 text-sm font-bold">Injection Velocity</label>
                <span className="text-white font-mono">{speed.toFixed(2)} <span className="text-xs text-gray-500">km/s</span></span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="3.5" 
                step="0.1"
                value={speed}
                onChange={(e) => {
                   setSpeed(parseFloat(e.target.value));
                   handleReset();
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                 <span>Drop (1.0)</span>
                 <span>Hold (2.2)</span>
                 <span>Escape (3.2)</span>
              </div>
           </div>

           <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between mb-2">
                <label className="text-purple-400 text-sm font-bold">Injection Angle</label>
                <span className="text-white font-mono">{angle}°</span>
              </div>
              <input 
                type="range" 
                min="-45" 
                max="45" 
                step="1"
                value={angle}
                onChange={(e) => {
                  setAngle(parseInt(e.target.value));
                  handleReset();
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[10px] text-gray-500 mt-1 text-center">0° = Parallel to surface</p>
           </div>

           {/* Mission Projection Panel */}
           <div className="bg-black/40 p-4 rounded border border-blue-500/30">
              <h3 className="text-cyan-500 text-xs font-bold uppercase flex items-center gap-2 mb-3 border-b border-blue-900/50 pb-2">
                <Target className="w-3 h-3" /> Mission Projection
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase">Projected Aphelion</p>
                  <p className="text-white font-mono text-lg">
                    {trajectoryStats.maxAU === Infinity ? '∞' : trajectoryStats.maxAU.toFixed(2)} <span className="text-sm text-gray-500">AU</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase">Potential Reach</p>
                  <p className={`font-bold text-sm ${trajectoryStats.maxAU === Infinity ? 'text-yellow-400' : 'text-green-400'}`}>
                     {trajectoryStats.targetText}
                  </p>
                </div>
              </div>
           </div>

           {/* Buttons */}
           <div className="flex gap-2 pt-2">
             <button 
               onClick={handlePlay}
               disabled={running && status !== 'IDLE'}
               className={`flex-1 py-3 rounded font-bold flex items-center justify-center gap-2 transition-colors ${running ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
             >
               <Play className="w-4 h-4" /> LAUNCH
             </button>
             <button 
               onClick={handleReset}
               className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded transition-colors"
             >
               <RotateCcw className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrbitalLab;
