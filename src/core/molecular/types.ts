import * as THREE from 'three';

export interface Atom {
  id: number;
  element: string;
  name: string;
  position: THREE.Vector3;
  residueName: string;
  residueId: number;
  chainId: string;
  occupancy: number;
  bFactor: number;
  charge: number;
  radius: number;
  color: string;
  selected: boolean;
}

export interface Bond {
  id: number;
  atomIndex1: number;
  atomIndex2: number;
  order: number; // 1=single, 2=double, 3=triple
}

export interface Residue {
  id: number;
  name: string;
  chainId: string;
  atoms: number[];
}

export interface Chain {
  id: string;
  residues: number[];
}

export interface Molecule {
  id: string;
  name: string;
  atoms: Atom[];
  bonds: Bond[];
  residues: Residue[];
  chains: Chain[];
  metadata: Record<string, string>;
}

export type VisualizationStyle =
  | 'ball-and-stick'
  | 'spacefill'
  | 'wireframe'
  | 'ribbon'
  | 'cartoon'
  | 'surface'
  | 'licorice';

export type ForceField = 'AMBER' | 'CHARMM' | 'OPLS' | 'UFF';

export interface SimulationSettings {
  forceField: ForceField;
  temperature: number;       // Kelvin
  pressure: number;          // atm
  timestep: number;          // fs
  totalSteps: number;
  solvate: boolean;
  solventModel: 'TIP3P' | 'SPC' | 'TIP4P';
  boxPadding: number;        // Angstroms
  ionConcentration: number;  // mol/L
  minimizationSteps: number;
  ensemble: 'NVT' | 'NPT' | 'NVE';
}

export interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'dihedral';
  atomIndices: number[];
  value: number;
  unit: string;
  visible: boolean;
}

export interface SceneObject {
  id: string;
  name: string;
  type: 'molecule' | 'light' | 'camera' | 'measurement' | 'group';
  visible: boolean;
  locked: boolean;
  children?: SceneObject[];
  moleculeId?: string;
}

export const ELEMENT_DATA: Record<string, { color: string; radius: number; mass: number }> = {
  H:  { color: '#FFFFFF', radius: 0.31, mass: 1.008 },
  He: { color: '#D9FFFF', radius: 0.28, mass: 4.003 },
  Li: { color: '#CC80FF', radius: 1.28, mass: 6.941 },
  Be: { color: '#C2FF00', radius: 0.96, mass: 9.012 },
  B:  { color: '#FFB5B5', radius: 0.84, mass: 10.81 },
  C:  { color: '#909090', radius: 0.76, mass: 12.01 },
  N:  { color: '#3050F8', radius: 0.71, mass: 14.01 },
  O:  { color: '#FF0D0D', radius: 0.66, mass: 16.00 },
  F:  { color: '#90E050', radius: 0.57, mass: 19.00 },
  Ne: { color: '#B3E3F5', radius: 0.58, mass: 20.18 },
  Na: { color: '#AB5CF2', radius: 1.66, mass: 22.99 },
  Mg: { color: '#8AFF00', radius: 1.41, mass: 24.31 },
  Al: { color: '#BFA6A6', radius: 1.21, mass: 26.98 },
  Si: { color: '#F0C8A0', radius: 1.11, mass: 28.09 },
  P:  { color: '#FF8000', radius: 1.07, mass: 30.97 },
  S:  { color: '#FFFF30', radius: 1.05, mass: 32.07 },
  Cl: { color: '#1FF01F', radius: 1.02, mass: 35.45 },
  Ar: { color: '#80D1E3', radius: 1.06, mass: 39.95 },
  K:  { color: '#8F40D4', radius: 2.03, mass: 39.10 },
  Ca: { color: '#3DFF00', radius: 1.76, mass: 40.08 },
  Fe: { color: '#E06633', radius: 1.32, mass: 55.85 },
  Co: { color: '#F090A0', radius: 1.26, mass: 58.93 },
  Ni: { color: '#50D050', radius: 1.24, mass: 58.69 },
  Cu: { color: '#C88033', radius: 1.32, mass: 63.55 },
  Zn: { color: '#7D80B0', radius: 1.22, mass: 65.38 },
  Br: { color: '#A62929', radius: 1.20, mass: 79.90 },
  I:  { color: '#940094', radius: 1.39, mass: 126.9 },
};

export const DEFAULT_SIMULATION_SETTINGS: SimulationSettings = {
  forceField: 'AMBER',
  temperature: 300,
  pressure: 1.0,
  timestep: 2.0,
  totalSteps: 100000,
  solvate: true,
  solventModel: 'TIP3P',
  boxPadding: 10.0,
  ionConcentration: 0.15,
  minimizationSteps: 5000,
  ensemble: 'NPT',
};
