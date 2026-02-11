import React from 'react';
import { useStore } from '../../store';
import { CollapsiblePanel } from '../UI/CollapsiblePanel';
import { Toggle } from '../UI/Toggle';
import { Slider } from '../UI/Slider';
import type { VisualizationStyle, ForceField } from '../../core/molecular/types';
import { calculateTotalEnergy, minimizeEnergy } from '../../core/computation/mechanics';

const VIZ_STYLES: { value: VisualizationStyle; label: string }[] = [
  { value: 'ball-and-stick', label: 'Ball & Stick' },
  { value: 'spacefill', label: 'Spacefill (CPK)' },
  { value: 'wireframe', label: 'Wireframe' },
  { value: 'licorice', label: 'Licorice' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'surface', label: 'Surface' },
];

export function PropertiesPanel() {
  const open = useStore((s) => s.rightSidebarOpen);
  const activePanel = useStore((s) => s.activeRightPanel);
  const setPanel = useStore((s) => s.setActiveRightPanel);
  const molecules = useStore((s) => s.molecules);
  const activeMoleculeId = useStore((s) => s.activeMoleculeId);
  const selectedAtomIndices = useStore((s) => s.selectedAtomIndices);
  const vizStyle = useStore((s) => s.visualizationStyle);
  const setVizStyle = useStore((s) => s.setVisualizationStyle);
  const colorScheme = useStore((s) => s.colorScheme);
  const setColorScheme = useStore((s) => s.setColorScheme);
  const simSettings = useStore((s) => s.simulationSettings);
  const updateSim = useStore((s) => s.updateSimulationSettings);
  const isSimulating = useStore((s) => s.isSimulating);
  const simProgress = useStore((s) => s.simulationProgress);
  const setSimulating = useStore((s) => s.setSimulating);
  const setSimulationProgress = useStore((s) => s.setSimulationProgress);
  const measurements = useStore((s) => s.measurements);
  const removeMeasurement = useStore((s) => s.removeMeasurement);
  const updateMolecule = useStore((s) => s.updateMolecule);
  const selectionMode = useStore((s) => s.selectionMode);
  const setSelectionMode = useStore((s) => s.setSelectionMode);

  if (!open) return null;

  const activeMol = molecules.find((m) => m.id === activeMoleculeId);
  const selectedAtom =
    activeMol && selectedAtomIndices.length === 1
      ? activeMol.atoms[selectedAtomIndices[0]]
      : null;

  const handleMinimize = () => {
    if (!activeMol) return;
    setSimulating(true);
    setSimulationProgress(0);

    // Run in steps to show progress
    let step = 0;
    const totalSteps = 10;
    let mol = activeMol;
    const interval = setInterval(() => {
      mol = minimizeEnergy(mol, 50, 0.005);
      step++;
      setSimulationProgress((step / totalSteps) * 100);
      if (step >= totalSteps) {
        clearInterval(interval);
        updateMolecule(activeMol.id, { atoms: mol.atoms });
        setSimulating(false);
      }
    }, 100);
  };

  const energy = activeMol ? calculateTotalEnergy(activeMol) : null;

  return (
    <div className="panel panel-right" style={{ width: 'var(--panel-width)', flexShrink: 0 }}>
      <div className="tab-bar">
        <div
          className={`tab ${activePanel === 'properties' ? 'active' : ''}`}
          onClick={() => setPanel('properties')}
        >
          Properties
        </div>
        <div
          className={`tab ${activePanel === 'simulation' ? 'active' : ''}`}
          onClick={() => setPanel('simulation')}
        >
          Simulation
        </div>
        <div
          className={`tab ${activePanel === 'analysis' ? 'active' : ''}`}
          onClick={() => setPanel('analysis')}
        >
          Analysis
        </div>
      </div>

      {activePanel === 'properties' && (
        <>
          {/* Visualization Style */}
          <CollapsiblePanel title="Visualization Style">
            <div style={{ display: 'grid', gap: 2 }}>
              {VIZ_STYLES.map((s) => (
                <div
                  key={s.value}
                  className={`scene-item ${vizStyle === s.value ? 'active' : ''}`}
                  onClick={() => setVizStyle(s.value)}
                >
                  <span className="name">{s.label}</span>
                </div>
              ))}
            </div>
          </CollapsiblePanel>

          {/* Color Scheme */}
          <CollapsiblePanel title="Color Scheme">
            <div className="form-row">
              <span className="form-label">Scheme</span>
              <select
                className="form-select"
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value as typeof colorScheme)}
              >
                <option value="element">By Element</option>
                <option value="chain">By Chain</option>
                <option value="residue">By Residue</option>
                <option value="bfactor">By B-Factor</option>
                <option value="charge">By Charge</option>
              </select>
            </div>
          </CollapsiblePanel>

          {/* Selection */}
          <CollapsiblePanel title="Selection Mode">
            <div className="form-row">
              <span className="form-label">Select by</span>
              <select
                className="form-select"
                value={selectionMode}
                onChange={(e) => setSelectionMode(e.target.value as typeof selectionMode)}
              >
                <option value="atom">Atom</option>
                <option value="residue">Residue</option>
                <option value="chain">Chain</option>
                <option value="molecule">Molecule</option>
              </select>
            </div>
          </CollapsiblePanel>

          {/* Selected Atom Properties */}
          <CollapsiblePanel title="Atom Properties">
            {selectedAtom ? (
              <div style={{ fontSize: 11 }}>
                <div className="form-row">
                  <span className="form-label">Element</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedAtom.element}</span>
                </div>
                <div className="form-row">
                  <span className="form-label">Name</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedAtom.name}</span>
                </div>
                <div className="form-row">
                  <span className="form-label">Residue</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedAtom.residueName} {selectedAtom.residueId}
                  </span>
                </div>
                <div className="form-row">
                  <span className="form-label">Chain</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedAtom.chainId}</span>
                </div>
                <div className="form-row">
                  <span className="form-label">Position</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    ({selectedAtom.position.x.toFixed(2)}, {selectedAtom.position.y.toFixed(2)},{' '}
                    {selectedAtom.position.z.toFixed(2)})
                  </span>
                </div>
                <div className="form-row">
                  <span className="form-label">B-Factor</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedAtom.bFactor.toFixed(2)}
                  </span>
                </div>
                <div className="form-row">
                  <span className="form-label">Occupancy</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedAtom.occupancy.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '4px 0' }}>
                {activeMol
                  ? 'Click an atom in the viewport to view its properties.'
                  : 'No molecule loaded.'}
              </div>
            )}
          </CollapsiblePanel>

          {/* Molecule Info */}
          {activeMol && (
            <CollapsiblePanel title="Molecule Info">
              <div style={{ fontSize: 11 }}>
                <div className="form-row">
                  <span className="form-label">Name</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{activeMol.name}</span>
                </div>
                <div className="form-row">
                  <span className="form-label">Atoms</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{activeMol.atoms.length}</span>
                </div>
                <div className="form-row">
                  <span className="form-label">Bonds</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{activeMol.bonds.length}</span>
                </div>
                <div className="form-row">
                  <span className="form-label">Residues</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {activeMol.residues.length}
                  </span>
                </div>
                <div className="form-row">
                  <span className="form-label">Chains</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{activeMol.chains.length}</span>
                </div>
              </div>
            </CollapsiblePanel>
          )}
        </>
      )}

      {activePanel === 'simulation' && (
        <>
          <CollapsiblePanel title="Force Field">
            <div className="form-row">
              <span className="form-label">Force Field</span>
              <select
                className="form-select"
                value={simSettings.forceField}
                onChange={(e) =>
                  updateSim({ forceField: e.target.value as ForceField })
                }
              >
                <option value="AMBER">AMBER</option>
                <option value="CHARMM">CHARMM</option>
                <option value="OPLS">OPLS</option>
                <option value="UFF">UFF (Universal)</option>
              </select>
            </div>
            <div className="form-row">
              <span className="form-label">Ensemble</span>
              <select
                className="form-select"
                value={simSettings.ensemble}
                onChange={(e) =>
                  updateSim({ ensemble: e.target.value as 'NVT' | 'NPT' | 'NVE' })
                }
              >
                <option value="NVT">NVT</option>
                <option value="NPT">NPT</option>
                <option value="NVE">NVE</option>
              </select>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Parameters">
            <Slider
              label="Temperature"
              value={simSettings.temperature}
              min={0}
              max={1000}
              step={10}
              unit=" K"
              onChange={(v) => updateSim({ temperature: v })}
            />
            <Slider
              label="Pressure"
              value={simSettings.pressure}
              min={0}
              max={10}
              step={0.1}
              unit=" atm"
              onChange={(v) => updateSim({ pressure: v })}
            />
            <Slider
              label="Timestep"
              value={simSettings.timestep}
              min={0.5}
              max={4}
              step={0.5}
              unit=" fs"
              onChange={(v) => updateSim({ timestep: v })}
            />
            <div className="form-row">
              <span className="form-label">Total Steps</span>
              <input
                className="form-input"
                type="number"
                value={simSettings.totalSteps}
                onChange={(e) => updateSim({ totalSteps: parseInt(e.target.value) || 0 })}
              />
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Solvation">
            <Toggle
              label="Solvate"
              checked={simSettings.solvate}
              onChange={(v) => updateSim({ solvate: v })}
            />
            {simSettings.solvate && (
              <>
                <div className="form-row">
                  <span className="form-label">Solvent</span>
                  <select
                    className="form-select"
                    value={simSettings.solventModel}
                    onChange={(e) =>
                      updateSim({
                        solventModel: e.target.value as 'TIP3P' | 'SPC' | 'TIP4P',
                      })
                    }
                  >
                    <option value="TIP3P">TIP3P</option>
                    <option value="SPC">SPC</option>
                    <option value="TIP4P">TIP4P</option>
                  </select>
                </div>
                <Slider
                  label="Box Padding"
                  value={simSettings.boxPadding}
                  min={5}
                  max={30}
                  step={1}
                  unit=" \u00C5"
                  onChange={(v) => updateSim({ boxPadding: v })}
                />
                <Slider
                  label="Ion Conc."
                  value={simSettings.ionConcentration}
                  min={0}
                  max={1}
                  step={0.01}
                  unit=" M"
                  onChange={(v) => updateSim({ ionConcentration: v })}
                />
              </>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel title="Energy Minimization">
            <Slider
              label="Min. Steps"
              value={simSettings.minimizationSteps}
              min={100}
              max={50000}
              step={100}
              onChange={(v) => updateSim({ minimizationSteps: v })}
            />
            <div style={{ padding: '8px 0', display: 'flex', gap: 8 }}>
              <button
                className="btn btn-accent"
                onClick={handleMinimize}
                disabled={!activeMol || isSimulating}
                style={{ flex: 1 }}
              >
                {isSimulating ? 'Minimizing...' : 'Run Minimization'}
              </button>
            </div>
            {isSimulating && (
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${simProgress}%` }}
                />
              </div>
            )}
            {energy && !isSimulating && (
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <div className="form-row">
                  <span className="form-label">Bond E</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {energy.bond.toFixed(2)} kcal/mol
                  </span>
                </div>
                <div className="form-row">
                  <span className="form-label">VdW E</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {energy.vdw.toFixed(2)} kcal/mol
                  </span>
                </div>
                <div className="form-row">
                  <span className="form-label">Total E</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    {energy.total.toFixed(2)} kcal/mol
                  </span>
                </div>
              </div>
            )}
          </CollapsiblePanel>
        </>
      )}

      {activePanel === 'analysis' && (
        <>
          <CollapsiblePanel title="Measurements">
            {measurements.length > 0 ? (
              <div style={{ display: 'grid', gap: 4 }}>
                {measurements.map((m) => (
                  <div key={m.id} className="form-row" style={{ fontSize: 11 }}>
                    <span style={{ textTransform: 'capitalize' }}>{m.type}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {m.value} {m.unit}
                    </span>
                    <button
                      className="btn btn-sm"
                      onClick={() => removeMeasurement(m.id)}
                      style={{ padding: '1px 4px', fontSize: 10 }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '4px 0' }}>
                Use the toolbar measurement tools to measure distances, angles, and
                dihedrals.
              </div>
            )}
          </CollapsiblePanel>

          {activeMol && (
            <CollapsiblePanel title="Composition">
              <div style={{ fontSize: 11 }}>
                {Object.entries(
                  activeMol.atoms.reduce<Record<string, number>>((acc, a) => {
                    acc[a.element] = (acc[a.element] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .map(([el, count]) => (
                    <div key={el} className="form-row">
                      <span className="form-label">{el}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{count}</span>
                    </div>
                  ))}
              </div>
            </CollapsiblePanel>
          )}
        </>
      )}
    </div>
  );
}
