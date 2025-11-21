
import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { VRButton } from 'three-stdlib';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CelestialBodyData, PlanetEngineeringInfo } from '../types';
import { SOLAR_SYSTEM_DATA } from '../constants';
import { getPlanetEngineeringData } from '../services/geminiService';
import { ArrowRight, ArrowLeft, Loader, X, Ruler, Moon, Rocket, Weight, Zap, Globe, Glasses } from 'lucide-react';

interface SolarSystem3DProps {
  mode: '2D' | '3D';
  onNext: () => void;
  onPrev?: () => void;
  onRocketLab?: () => void;
  onGravityLab?: () => void;
  onSolarLab?: () => void;
  onOrbitalLab?: () => void;
}

// --- VR Helper ---
const VRIntegration = () => {
  const { gl } = useThree();
  useEffect(() => {
    gl.xr.enabled = true;
    const button = VRButton.createButton(gl);
    document.body.appendChild(button);
    return () => {
      button.remove();
      gl.xr.enabled = false;
    };
  }, [gl]);
  return null;
};

// --- 3D Scene Components ---

interface SunProps {
  data: CelestialBodyData;
  onClick: () => void;
  isSelected: boolean;
  setRef: (el: THREE.Object3D | null) => void;
}

const Sun: React.FC<SunProps> = ({ data, onClick, isSelected, setRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Pulse animation for selection
  useFrame((state) => {
    if (isSelected && meshRef.current) {
      const t = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 3) * 0.02;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh 
      ref={(el) => {
        meshRef.current = el;
        setRef(el);
      }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <sphereGeometry args={[data.radius, 64, 64]} />
      <meshBasicMaterial color={data.color} />
      <pointLight distance={300} intensity={2} color="#ffffff" />
      
      {/* Glow effect (simple sprite-like mesh) */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.3} />
      </mesh>
    </mesh>
  );
};

interface PlanetProps {
  data: CelestialBodyData;
  mode: '2D' | '3D';
  onClick: (data: CelestialBodyData) => void;
  isSelected: boolean;
  setRef: (el: THREE.Object3D | null) => void;
}

const Planet: React.FC<PlanetProps> = ({ 
  data, 
  mode,
  onClick,
  isSelected,
  setRef
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Random start angle so they aren't all aligned
  const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);
  
  // Expose ref to parent
  useEffect(() => {
    if (data.id !== 'sun' && groupRef.current) {
      setRef(groupRef.current);
    }
  }, [setRef, data.id]);

  useFrame(({ clock }) => {
    if (groupRef.current && data.id !== 'sun') {
      const t = clock.getElapsedTime() * (data.speed * 0.1) + startAngle;
      const x = Math.cos(t) * data.distance;
      const z = Math.sin(t) * data.distance;
      groupRef.current.position.set(x, 0, z);
    }
  });

  if (data.id === 'sun') {
    return <Sun data={data} onClick={() => onClick(data)} isSelected={isSelected} setRef={setRef} />;
  }

  return (
    <group>
      {/* Orbit Line (Visual only) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[data.distance - 0.1, data.distance + 0.1, 128]} />
        <meshBasicMaterial color="#444" opacity={0.2} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* The Moving Planet Group */}
      <group ref={groupRef}>
        <group
          onClick={(e) => { e.stopPropagation(); onClick(data); }}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <mesh ref={meshRef}>
            <sphereGeometry args={[data.radius, 64, 64]} />
            <meshStandardMaterial 
              color={data.color} 
              metalness={0.2} 
              roughness={0.7} 
              emissive={isSelected ? data.color : '#000'}
              emissiveIntensity={isSelected ? 0.5 : 0}
            />
          </mesh>
          
          {/* Simple Ring for Saturn (Color based) */}
          {data.id === 'saturn' && (
            <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
              <ringGeometry args={[data.radius * 1.4, data.radius * 2.2, 64]} />
              <meshBasicMaterial color="#A89C83" side={THREE.DoubleSide} transparent opacity={0.6} />
            </mesh>
          )}
        </group>
        
        {/* Planet Label */}
        {(mode === '2D' || isSelected) && (
          <Html position={[0, data.radius + 1, 0]} center distanceFactor={15}>
            <div className="text-cyan-400 text-xs font-mono whitespace-nowrap bg-black/80 px-1 rounded border border-cyan-500/30 pointer-events-none select-none">
              {data.name}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

interface CameraControllerProps {
  mode: '2D' | '3D';
  selectedPlanet: CelestialBodyData | null;
  planetRefs: React.MutableRefObject<Record<string, THREE.Object3D>>;
}

const CameraController: React.FC<CameraControllerProps> = ({ mode, selectedPlanet, planetRefs }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  
  useFrame((state, delta) => {
    // If in VR mode, disable custom camera animation logic to let the headset track freely
    if (gl.xr.isPresenting) return;

    const controls = controlsRef.current;
    if (!controls) return;

    const targetPos = new THREE.Vector3(0, 0, 0);
    const cameraPos = new THREE.Vector3();

    if (selectedPlanet && planetRefs.current[selectedPlanet.id]) {
      // --- LOCKED VIEW (Focus Mode) ---
      const planetObj = planetRefs.current[selectedPlanet.id];
      
      // Get current world position of the planet
      const currentPlanetPos = new THREE.Vector3();
      planetObj.getWorldPosition(currentPlanetPos);
      
      // Update controls target to follow the planet
      targetPos.copy(currentPlanetPos);

      // Camera Placement Strategy
      const dist = selectedPlanet.radius * 4 + 8;

      if (mode === '2D') {
        // In 2D, we strictly lock top-down
        const offset = new THREE.Vector3(0, dist * 2, 0);
        cameraPos.copy(currentPlanetPos).add(offset);
        state.camera.position.lerp(cameraPos, 4 * delta);
      } else {
        // In 3D, we want to follow the planet
        const offset = new THREE.Vector3(dist, selectedPlanet.radius + 5, dist);
        cameraPos.copy(currentPlanetPos).add(offset);
        
        // Smoothly interpolate
        state.camera.position.lerp(cameraPos, 2 * delta);
      }

    } else {
      // --- OVERVIEW ---
      targetPos.set(0, 0, 0);
      
      if (mode === '2D') {
        cameraPos.set(0, 140, 0);
      } else {
        cameraPos.set(0, 60, 100);
      }
      
      state.camera.position.lerp(cameraPos, 2 * delta);
    }

    // Update controls target smoothly
    controls.target.lerp(targetPos, 4 * delta);
    controls.update();
  });

  return (
    <OrbitControls 
      ref={controlsRef} 
      makeDefault // Essential: connects controls to the canvas
      enabled={!gl.xr.isPresenting} // Disable controls in VR to avoid conflict
      enableDamping={true}
      dampingFactor={0.05}
      enableZoom={true} 
      enablePan={false} 
      // In 2D we lock to top-down. In 3D we allow full 360 degree rotation (Math.PI)
      maxPolarAngle={mode === '2D' ? 0 : Math.PI} 
      minDistance={5}
      maxDistance={200}
    />
  );
};

// --- Main Component ---

const SolarSystem3D: React.FC<SolarSystem3DProps> = ({ mode, onNext, onPrev, onRocketLab, onGravityLab, onSolarLab, onOrbitalLab }) => {
  const [selectedPlanet, setSelectedPlanet] = useState<CelestialBodyData | null>(null);
  const [engInfo, setEngInfo] = useState<PlanetEngineeringInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Store references to 3D objects for camera tracking
  const planetRefs = useRef<Record<string, THREE.Object3D>>({});

  const handlePlanetClick = async (planet: CelestialBodyData) => {
    if (selectedPlanet?.id !== planet.id) {
      setEngInfo(null); // Clear old data immediately
    }

    setSelectedPlanet(planet);
    setLoadingInfo(true);
    
    // Fetch Gemini data regardless of mode
    const info = await getPlanetEngineeringData(planet.name);
    setEngInfo(info);
    setLoadingInfo(false);
  };

  const closePanel = () => {
    setSelectedPlanet(null);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Canvas */}
      <Canvas shadows camera={{ fov: 45, near: 0.1, far: 1000 }}>
        <VRIntegration />
        <color attach="background" args={['#000000']} />
        <Stars radius={300} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.3} /> 
        <CameraController mode={mode} selectedPlanet={selectedPlanet} planetRefs={planetRefs} />

        {SOLAR_SYSTEM_DATA.map((planet) => (
          <Planet 
            key={planet.id} 
            data={planet} 
            mode={mode}
            onClick={handlePlanetClick}
            isSelected={selectedPlanet?.id === planet.id}
            setRef={(el) => { if (el) planetRefs.current[planet.id] = el; }}
          />
        ))}
      </Canvas>

      {/* --- UI OVERLAYS --- */}

      {/* Top Right Navigation */}
      <div className="absolute top-8 right-8 z-10 flex gap-4">
        {onPrev && (
           <button 
           onClick={onPrev}
           className="px-6 py-2 border border-gray-600 bg-black/50 text-white hover:bg-white/10 flex items-center gap-2 backdrop-blur-md transition-all rounded-sm"
         >
           <ArrowLeft className="w-4 h-4" />
           Previous
         </button>
        )}
        
        {onRocketLab && (
          <button
            onClick={onRocketLab}
            className="px-4 py-2 border border-orange-500 bg-orange-900/20 text-orange-400 hover:bg-orange-500/20 flex items-center gap-2 backdrop-blur-md transition-all rounded-sm"
            title="Open Rocket Thrust Experiment"
          >
            <Rocket className="w-4 h-4" />
          </button>
        )}

        {onGravityLab && (
          <button
            onClick={onGravityLab}
            className="px-4 py-2 border border-purple-500 bg-purple-900/20 text-purple-400 hover:bg-purple-500/20 flex items-center gap-2 backdrop-blur-md transition-all rounded-sm"
            title="Open Gravity Drop Experiment"
          >
            <Weight className="w-4 h-4" />
          </button>
        )}

        {onSolarLab && (
          <button
            onClick={onSolarLab}
            className="px-4 py-2 border border-yellow-500 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-500/20 flex items-center gap-2 backdrop-blur-md transition-all rounded-sm"
            title="Open Solar Power Lab"
          >
            <Zap className="w-4 h-4" />
          </button>
        )}

        {onOrbitalLab && (
          <button
            onClick={onOrbitalLab}
            className="px-4 py-2 border border-blue-500 bg-blue-900/20 text-blue-400 hover:bg-blue-500/20 flex items-center gap-2 backdrop-blur-md transition-all rounded-sm"
            title="Open Orbital Injection Lab"
          >
            <Globe className="w-4 h-4" />
          </button>
        )}

        <button 
          onClick={onNext}
          className="px-6 py-2 border border-cyan-500 bg-cyan-900/20 text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-2 backdrop-blur-md transition-all rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.15)]"
        >
          {mode === '2D' ? 'Continue' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top Left Title/Instruction */}
      <div className="absolute top-8 left-8 z-10 border-l-4 border-cyan-500 pl-4 pointer-events-none flex flex-col items-start">
        <h2 className="text-white font-bold text-xl uppercase tracking-widest brand-font">
          {mode === '2D' ? '2D Visualization' : '3D Interactive Lab'}
        </h2>
        <p className="text-gray-400 text-sm flex items-center gap-2">
          {mode === '2D' ? 'Click objects to view details. Paths shown.' : 'Interactive orbital mechanics simulation.'}
          {mode === '3D' && <span className="text-xs bg-white/10 px-2 py-0.5 rounded flex items-center gap-1 border border-white/20"><Glasses className="w-3 h-3"/> VR Ready</span>}
        </p>
      </div>

      {/* Info Panel (Popped up on Click) */}
      {selectedPlanet && (
        <div className="absolute bottom-8 left-8 z-10 w-80 bg-black/90 border border-cyan-500/50 backdrop-blur-lg p-6 text-white shadow-[0_0_30px_rgba(0,255,255,0.1)] animate-in slide-in-from-left duration-300 rounded-sm">
          <button 
            onClick={closePanel}
            className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
            <h3 className="text-2xl font-bold text-cyan-400 brand-font">{selectedPlanet.name}</h3>
            <span className="text-xs text-gray-500 uppercase font-mono">{selectedPlanet.type}</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Overview</p>
              <p className="text-sm text-gray-300 leading-relaxed">{selectedPlanet.description}</p>
            </div>

            {/* Distance & Moons Section */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/50 p-2 rounded border border-gray-700 flex flex-col justify-center">
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <Ruler className="w-3 h-3" /> Dist. from Sun
                </div>
                {/* Calculate approximate AU. Earth (dist 22) = 1 AU. */}
                <p className="font-mono text-cyan-300 text-lg">
                  {(selectedPlanet.distance / 22).toFixed(2)} <span className="text-xs">AU</span>
                </p>
              </div>
              <div className="bg-gray-800/50 p-2 rounded border border-gray-700 flex flex-col justify-center">
                 <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <Moon className="w-3 h-3" /> {selectedPlanet.id === 'sun' ? 'Planets' : 'Satellites'}
                </div>
                <p className="font-mono text-cyan-300 text-lg">
                  {selectedPlanet.id === 'sun' ? '8' : (selectedPlanet.moons || 0)}
                </p>
              </div>
            </div>

            {loadingInfo ? (
              <div className="flex items-center justify-center py-6 text-cyan-400 animate-pulse border-t border-gray-700 mt-2">
                <Loader className="w-5 h-5 animate-spin mr-2" /> Analyzing...
              </div>
            ) : engInfo ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-700">
                  <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                    <p className="text-xs text-gray-500">Gravity</p>
                    <p className="font-mono text-cyan-300">{engInfo.gravity}</p>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                    <p className="text-xs text-gray-500">Temp</p>
                    <p className="font-mono text-cyan-300">{engInfo.temperature}</p>
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded border border-gray-700 text-sm">
                  <p className="text-xs text-gray-500">Atmosphere</p>
                  <p className="text-gray-300">{engInfo.atmosphere}</p>
                </div>
                <div className="bg-cyan-900/20 p-3 rounded border border-cyan-500/30 text-sm">
                  <p className="text-xs text-cyan-500 uppercase font-bold mb-1">Engineering Challenge</p>
                  <p className="text-cyan-100 italic">"{engInfo.engineeringChallenge}"</p>
                </div>
              </>
            ) : (
               <p className="text-xs text-gray-500 pt-2">Initializing Gemini uplink...</p>
            )}
          </div>
          
          <div className="absolute -top-3 -right-3 bg-cyan-500 text-black text-xs font-bold px-2 py-1 shadow-lg uppercase tracking-wider">
            Live Data
          </div>
        </div>
      )}

      {/* Bottom Right: Project Info */}
      <div className="absolute bottom-8 right-8 z-10 bg-black/30 border border-white/10 p-4 max-w-xs backdrop-blur-sm rounded">
        <h4 className="text-gray-400 text-xs uppercase tracking-widest mb-1 font-bold">About Simulation</h4>
        <p className="text-gray-300 text-xs leading-relaxed">
          Visualizing Solar System dynamics for engineering applications.
          Scale adapted for VR/Web visibility.
        </p>
      </div>

    </div>
  );
};

export default SolarSystem3D;
