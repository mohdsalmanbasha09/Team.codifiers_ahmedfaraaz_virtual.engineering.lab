
import { CelestialBodyData, SatelliteData } from './types';

// Note: These scales are "visual" scales, not 1:1 realistic scales, to make the system viewable on a screen.
export const SOLAR_SYSTEM_DATA: CelestialBodyData[] = [
  { 
    id: 'sun', 
    name: 'Sun', 
    color: '#FDB813', 
    radius: 5, 
    distance: 0, 
    speed: 0, 
    description: 'The star at the center of our Solar System.', 
    type: 'star' 
  },
  { 
    id: 'mercury', 
    name: 'Mercury', 
    color: '#A5A5A5', 
    radius: 0.8, 
    distance: 10, 
    speed: 4.7, 
    description: 'The smallest planet, closest to the Sun.', 
    type: 'planet' 
  },
  { 
    id: 'venus', 
    name: 'Venus', 
    color: '#E3BB76', 
    radius: 1.5, 
    distance: 15, 
    speed: 3.5, 
    description: 'Second planet from the Sun. Hot and dense atmosphere.', 
    type: 'planet' 
  },
  { 
    id: 'earth', 
    name: 'Earth', 
    color: '#22A6B3', 
    radius: 1.6, 
    distance: 22, 
    speed: 3.0, 
    description: 'Our home planet.', 
    type: 'planet', 
    moons: 1 
  },
  { 
    id: 'mars', 
    name: 'Mars', 
    color: '#EB4D4B', 
    radius: 1.2, 
    distance: 30, 
    speed: 2.4, 
    description: 'The Red Planet. Target for colonization.', 
    type: 'planet', 
    moons: 2 
  },
  { 
    id: 'jupiter', 
    name: 'Jupiter', 
    color: '#D35400', 
    radius: 3.5, 
    distance: 45, 
    speed: 1.3, 
    description: 'The largest planet. A gas giant.', 
    type: 'planet', 
    moons: 79 
  },
  { 
    id: 'saturn', 
    name: 'Saturn', 
    color: '#F1C40F', 
    radius: 3.0, 
    distance: 60, 
    speed: 0.9, 
    description: 'Known for its prominent ring system.', 
    type: 'planet', 
    moons: 82 
  },
  { 
    id: 'uranus', 
    name: 'Uranus', 
    color: '#74B9FF', 
    radius: 2.2, 
    distance: 75, 
    speed: 0.6, 
    description: 'An ice giant with a tilted axis.', 
    type: 'planet', 
    moons: 27 
  },
  { 
    id: 'neptune', 
    name: 'Neptune', 
    color: '#0984E3', 
    radius: 2.1, 
    distance: 90, 
    speed: 0.5, 
    description: 'The furthest known major planet.', 
    type: 'planet', 
    moons: 14 
  },
];

export const SATELLITE_EXAMPLES: SatelliteData[] = [
  {
    id: 'net-sat-1',
    name: 'AeroLink V2 (Network)',
    type: 'Network',
    description: 'High-bandwidth orbital relay satellite designed for deep space communication meshes.',
    specs: {
      mass: '450 kg',
      power: '2.5 kW (Solar)',
      orbit: 'Geostationary',
    }
  },
  {
    id: 'rover-1',
    name: 'Exo-Crawler MK4 (Rover)',
    type: 'Rover',
    description: 'Autonomous surface exploration unit equipped with spectroscopy and drilling modules.',
    specs: {
      mass: '890 kg',
      power: 'RTG Nuclear Battery',
      orbit: 'Surface',
    }
  }
];
