
export enum ViewState {
  LANDING = 'LANDING',
  SOLAR_SYSTEM = 'SOLAR_SYSTEM',
  SATELLITE_LAB = 'SATELLITE_LAB',
}

export interface CelestialBodyData {
  id: string;
  name: string;
  color: string;
  radius: number; // Relative visual size
  distance: number; // Distance from Sun
  speed: number; // Orbital speed factor
  description: string;
  moons?: number;
  type: 'star' | 'planet' | 'dwarf';
}

export interface PlanetEngineeringInfo {
  gravity: string;
  temperature: string;
  atmosphere: string;
  engineeringChallenge: string;
}

export interface SatelliteData {
  id: string;
  name: string;
  type: 'Network' | 'Rover';
  description: string;
  specs: {
    mass: string;
    power: string;
    orbit: string;
  };
}
