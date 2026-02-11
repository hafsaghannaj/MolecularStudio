import { create } from 'zustand';
import type {
  Molecule,
  VisualizationStyle,
  SimulationSettings,
  Measurement,
  SceneObject,
  ForceField,
} from './core/molecular/types';
import { DEFAULT_SIMULATION_SETTINGS } from './core/molecular/types';

export interface ViewSettings {
  projection: 'perspective' | 'orthographic';
  renderMode: 'default' | 'wireframe';
  showGrid: boolean;
  gridPlane: 'XZ' | 'XY' | 'YZ';
  showHelpers: boolean;
  backgroundColor: string;
  showFog: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  ambientColor: string;
  postProcessing: boolean;
  bloom: boolean;
  ssao: boolean;
}

export interface LightConfig {
  id: string;
  type: 'directional' | 'point' | 'ambient';
  color: string;
  intensity: number;
  position: [number, number, number];
  visible: boolean;
  name: string;
}

export interface AppState {
  // Molecules
  molecules: Molecule[];
  activeMoleculeId: string | null;
  loadMolecule: (mol: Molecule) => void;
  removeMolecule: (id: string) => void;
  updateMolecule: (id: string, mol: Partial<Molecule>) => void;
  setActiveMolecule: (id: string | null) => void;

  // Selection
  selectedAtomIndices: number[];
  selectionMode: 'atom' | 'residue' | 'chain' | 'molecule';
  selectAtom: (index: number, multi: boolean) => void;
  clearSelection: () => void;
  setSelectionMode: (mode: 'atom' | 'residue' | 'chain' | 'molecule') => void;

  // Visualization
  visualizationStyle: VisualizationStyle;
  setVisualizationStyle: (style: VisualizationStyle) => void;
  colorScheme: 'element' | 'chain' | 'residue' | 'bfactor' | 'charge';
  setColorScheme: (scheme: 'element' | 'chain' | 'residue' | 'bfactor' | 'charge') => void;

  // View
  viewSettings: ViewSettings;
  updateViewSettings: (settings: Partial<ViewSettings>) => void;

  // Lights
  lights: LightConfig[];
  addLight: (light: LightConfig) => void;
  updateLight: (id: string, updates: Partial<LightConfig>) => void;
  removeLight: (id: string) => void;

  // Scene
  sceneObjects: SceneObject[];
  setSceneObjects: (objects: SceneObject[]) => void;
  selectedSceneObjectId: string | null;
  setSelectedSceneObject: (id: string | null) => void;

  // Simulation
  simulationSettings: SimulationSettings;
  updateSimulationSettings: (settings: Partial<SimulationSettings>) => void;
  isSimulating: boolean;
  simulationProgress: number;
  setSimulating: (running: boolean) => void;
  setSimulationProgress: (progress: number) => void;

  // Measurements
  measurements: Measurement[];
  addMeasurement: (m: Measurement) => void;
  removeMeasurement: (id: string) => void;
  measurementMode: 'none' | 'distance' | 'angle' | 'dihedral';
  setMeasurementMode: (mode: 'none' | 'distance' | 'angle' | 'dihedral') => void;

  // UI
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  activeLeftPanel: 'scene' | 'materials' | 'environment';
  setActiveLeftPanel: (panel: 'scene' | 'materials' | 'environment') => void;
  activeRightPanel: 'properties' | 'simulation' | 'analysis';
  setActiveRightPanel: (panel: 'properties' | 'simulation' | 'analysis') => void;

  // Collaboration
  collaborationEnabled: boolean;
  toggleCollaboration: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Molecules
  molecules: [],
  activeMoleculeId: null,
  loadMolecule: (mol) =>
    set((s) => ({
      molecules: [...s.molecules, mol],
      activeMoleculeId: mol.id,
      sceneObjects: [
        ...s.sceneObjects,
        {
          id: mol.id,
          name: mol.name,
          type: 'molecule' as const,
          visible: true,
          locked: false,
          moleculeId: mol.id,
        },
      ],
    })),
  removeMolecule: (id) =>
    set((s) => ({
      molecules: s.molecules.filter((m) => m.id !== id),
      activeMoleculeId: s.activeMoleculeId === id ? null : s.activeMoleculeId,
      sceneObjects: s.sceneObjects.filter((o) => o.moleculeId !== id),
    })),
  updateMolecule: (id, updates) =>
    set((s) => ({
      molecules: s.molecules.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  setActiveMolecule: (id) => set({ activeMoleculeId: id }),

  // Selection
  selectedAtomIndices: [],
  selectionMode: 'atom',
  selectAtom: (index, multi) =>
    set((s) => ({
      selectedAtomIndices: multi
        ? s.selectedAtomIndices.includes(index)
          ? s.selectedAtomIndices.filter((i) => i !== index)
          : [...s.selectedAtomIndices, index]
        : [index],
    })),
  clearSelection: () => set({ selectedAtomIndices: [] }),
  setSelectionMode: (mode) => set({ selectionMode: mode }),

  // Visualization
  visualizationStyle: 'ball-and-stick',
  setVisualizationStyle: (style) => set({ visualizationStyle: style }),
  colorScheme: 'element',
  setColorScheme: (scheme) => set({ colorScheme: scheme }),

  // View
  viewSettings: {
    projection: 'perspective',
    renderMode: 'default',
    showGrid: true,
    gridPlane: 'XZ',
    showHelpers: false,
    backgroundColor: '#1a1a2e',
    showFog: false,
    fogColor: '#1a1a2e',
    fogNear: 50,
    fogFar: 200,
    ambientIntensity: 50,
    ambientColor: '#B7B7B7',
    postProcessing: false,
    bloom: false,
    ssao: false,
  },
  updateViewSettings: (settings) =>
    set((s) => ({ viewSettings: { ...s.viewSettings, ...settings } })),

  // Lights
  lights: [
    {
      id: 'dir-1',
      type: 'directional',
      color: '#ffffff',
      intensity: 1.0,
      position: [10, 20, 10],
      visible: true,
      name: 'Directional Light',
    },
    {
      id: 'point-1',
      type: 'point',
      color: '#ffffff',
      intensity: 0.8,
      position: [-10, 15, -10],
      visible: true,
      name: 'Point Light',
    },
    {
      id: 'ambient-1',
      type: 'ambient',
      color: '#B7B7B7',
      intensity: 0.5,
      position: [0, 0, 0],
      visible: true,
      name: 'Ambient Light',
    },
  ],
  addLight: (light) => set((s) => ({ lights: [...s.lights, light] })),
  updateLight: (id, updates) =>
    set((s) => ({
      lights: s.lights.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  removeLight: (id) => set((s) => ({ lights: s.lights.filter((l) => l.id !== id) })),

  // Scene
  sceneObjects: [
    { id: 'camera-1', name: 'Camera', type: 'camera', visible: true, locked: false },
    { id: 'dir-1', name: 'Directional Light', type: 'light', visible: true, locked: false },
    { id: 'point-1', name: 'Point Light', type: 'light', visible: true, locked: false },
    { id: 'ambient-1', name: 'Ambient Light', type: 'light', visible: true, locked: false },
  ],
  setSceneObjects: (objects) => set({ sceneObjects: objects }),
  selectedSceneObjectId: null,
  setSelectedSceneObject: (id) => set({ selectedSceneObjectId: id }),

  // Simulation
  simulationSettings: DEFAULT_SIMULATION_SETTINGS,
  updateSimulationSettings: (settings) =>
    set((s) => ({ simulationSettings: { ...s.simulationSettings, ...settings } })),
  isSimulating: false,
  simulationProgress: 0,
  setSimulating: (running) => set({ isSimulating: running }),
  setSimulationProgress: (progress) => set({ simulationProgress: progress }),

  // Measurements
  measurements: [],
  addMeasurement: (m) => set((s) => ({ measurements: [...s.measurements, m] })),
  removeMeasurement: (id) =>
    set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),
  measurementMode: 'none',
  setMeasurementMode: (mode) => set({ measurementMode: mode }),

  // UI
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  activeLeftPanel: 'scene',
  setActiveLeftPanel: (panel) => set({ activeLeftPanel: panel }),
  activeRightPanel: 'properties',
  setActiveRightPanel: (panel) => set({ activeRightPanel: panel }),

  // Collaboration
  collaborationEnabled: false,
  toggleCollaboration: () =>
    set((s) => ({ collaborationEnabled: !s.collaborationEnabled })),
}));
