import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import SolarSystem3D from './components/SolarSystem3D';
import SatelliteLab from './components/SatelliteLab';
import { ViewState } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);

  const renderView = () => {
    switch (view) {
      case ViewState.LANDING:
        return <LandingPage onStart={() => setView(ViewState.SOLAR_SYSTEM)} />;
      
      case ViewState.SOLAR_SYSTEM: // Maps to SOLAR_2D in UI flow logic, but let's stick to type
        // We handle 2D/3D mode internally in the component or via state if we want granular control
        // For now, the sketch implies Landing -> 2D -> 3D. 
        // We can split SOLAR_SYSTEM into two states in the Enum if strictly following sketch, 
        // but to keep 'types.ts' clean we can use a local state or just reuse logic.
        // Let's adhere to the previous implementation's flow but clean imports.
        return (
          <SolarSystemWrapper 
            initialMode="2D"
            onExit={() => setView(ViewState.LANDING)}
            onSatelliteLab={() => setView(ViewState.SATELLITE_LAB)}
          />
        );
      
      case ViewState.SATELLITE_LAB:
        return <SatelliteLab onHome={() => setView(ViewState.SOLAR_SYSTEM)} />;
      
      default:
        return <LandingPage onStart={() => setView(ViewState.SOLAR_SYSTEM)} />;
    }
  };

  return (
    <main className="w-full h-screen bg-black text-white">
      {renderView()}
    </main>
  );
};

// Wrapper to handle the internal 2D -> 3D transition without polluting global ViewState excessively
// or we can map ViewState.SOLAR_SYSTEM to the 3D component which handles its own mode.
interface WrapperProps {
  initialMode: '2D' | '3D';
  onExit: () => void;
  onSatelliteLab: () => void;
}

const SolarSystemWrapper: React.FC<WrapperProps> = ({ initialMode, onExit, onSatelliteLab }) => {
  const [mode, setMode] = useState<'2D' | '3D'>(initialMode);

  if (mode === '2D') {
    return (
      <SolarSystem3D 
        mode="2D" 
        onNext={() => setMode('3D')} 
        onPrev={onExit}
      />
    );
  }

  return (
    <SolarSystem3D 
      mode="3D" 
      onNext={onSatelliteLab} 
      onPrev={() => setMode('2D')}
    />
  );
};

export default App;