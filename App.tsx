
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import SolarSystem3D from './components/SolarSystem3D';
import SatelliteLab from './components/SatelliteLab';
import RocketLab from './components/RocketLab';
import GravityLab from './components/GravityLab';
import SolarPowerLab from './components/SolarPowerLab';
import OrbitalLab from './components/OrbitalLab';
import { ViewState } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);

  const renderView = () => {
    switch (view) {
      case ViewState.LANDING:
        return <LandingPage onStart={() => setView(ViewState.SOLAR_SYSTEM)} />;
      
      case ViewState.SOLAR_SYSTEM: 
        return (
          <SolarSystemWrapper 
            initialMode="2D"
            onExit={() => setView(ViewState.LANDING)}
            onSatelliteLab={() => setView(ViewState.SATELLITE_LAB)}
            onRocketLab={() => setView(ViewState.ROCKET_LAB)}
            onGravityLab={() => setView(ViewState.GRAVITY_LAB)}
            onSolarLab={() => setView(ViewState.SOLAR_LAB)}
            onOrbitalLab={() => setView(ViewState.ORBITAL_LAB)}
          />
        );
      
      case ViewState.SATELLITE_LAB:
        return <SatelliteLab onHome={() => setView(ViewState.SOLAR_SYSTEM)} />;

      case ViewState.ROCKET_LAB:
        return <RocketLab onExit={() => setView(ViewState.SOLAR_SYSTEM)} />;

      case ViewState.GRAVITY_LAB:
        return <GravityLab onExit={() => setView(ViewState.SOLAR_SYSTEM)} />;

      case ViewState.SOLAR_LAB:
        return <SolarPowerLab onExit={() => setView(ViewState.SOLAR_SYSTEM)} />;

      case ViewState.ORBITAL_LAB:
        return <OrbitalLab onExit={() => setView(ViewState.SOLAR_SYSTEM)} />;
      
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
interface WrapperProps {
  initialMode: '2D' | '3D';
  onExit: () => void;
  onSatelliteLab: () => void;
  onRocketLab: () => void;
  onGravityLab: () => void;
  onSolarLab: () => void;
  onOrbitalLab: () => void;
}

const SolarSystemWrapper: React.FC<WrapperProps> = ({ initialMode, onExit, onSatelliteLab, onRocketLab, onGravityLab, onSolarLab, onOrbitalLab }) => {
  const [mode, setMode] = useState<'2D' | '3D'>(initialMode);

  if (mode === '2D') {
    return (
      <SolarSystem3D 
        mode="2D" 
        onNext={() => setMode('3D')} 
        onPrev={onExit}
        onRocketLab={onRocketLab}
        onGravityLab={onGravityLab}
        onSolarLab={onSolarLab}
        onOrbitalLab={onOrbitalLab}
      />
    );
  }

  return (
    <SolarSystem3D 
      mode="3D" 
      onNext={onSatelliteLab} 
      onPrev={() => setMode('2D')}
      onRocketLab={onRocketLab}
      onGravityLab={onGravityLab}
      onSolarLab={onSolarLab}
      onOrbitalLab={onOrbitalLab}
    />
  );
};

export default App;
