import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Deep Space Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#000000_100%)]"></div>
      
      {/* Stars Layer 1 (Small) */}
      <div className="absolute inset-0 z-0 opacity-60" 
           style={{
             backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
             backgroundSize: '50px 50px',
             backgroundPosition: '0 0'
           }}>
      </div>
       {/* Stars Layer 2 (Larger) */}
       <div className="absolute inset-0 z-0 opacity-40" 
           style={{
             backgroundImage: 'radial-gradient(white 2px, transparent 2px)',
             backgroundSize: '120px 120px',
             backgroundPosition: '20px 20px'
           }}>
      </div>

      {/* Atmospheric Glow from Top */}
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>

      {/* Realistic Moon at Bottom */}
      <div className="absolute -bottom-[55vh] left-1/2 transform -translate-x-1/2 w-[130vh] h-[130vh] z-10 rounded-full shadow-[0_-20px_100px_rgba(200,225,255,0.08)] overflow-hidden pointer-events-none">
        {/* Moon Texture Base */}
        <div className="absolute inset-0 bg-gray-300 rounded-full">
           {/* Texture */}
           <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg')] bg-cover bg-center contrast-125 brightness-90 grayscale"></div>
           
           {/* Inner Shadow for Spherical look */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.1),_transparent_50%,_black_90%)]"></div>
           <div className="absolute inset-0 shadow-[inset_0_20px_80px_rgba(0,0,0,0.9)] rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center -mt-48 space-y-10">
        <div className="space-y-4 animate-in fade-in zoom-in duration-1000">
          <h2 className="text-cyan-400 text-lg tracking-[0.8em] uppercase font-bold">Welcome to</h2>
          <h1 className="text-6xl md:text-9xl font-black text-white brand-font tracking-tighter drop-shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            AEROVERSE
          </h1>
        </div>

        <p className="text-gray-400 text-lg max-w-lg font-light tracking-wider border-b border-cyan-500/30 pb-4">
           Virtual Engineering Lab <span className="text-cyan-500 mx-2">|</span> Solar System Simulation
        </p>

        <button 
          onClick={onStart}
          className="group mt-4 px-12 py-4 bg-transparent border border-cyan-500/50 text-cyan-400 font-bold text-lg uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all duration-500 flex items-center gap-3 backdrop-blur-md rounded-sm shadow-[0_0_20px_rgba(0,255,255,0.1)]"
        >
          Click to Start
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;