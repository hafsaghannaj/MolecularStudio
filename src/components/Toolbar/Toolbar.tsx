import React, { useRef } from 'react';
import { useStore } from '../../store';
import { parsePDB, parseSDF, parseMOL2, exportPDB } from '../../core/molecular/parsers';

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMolecule = useStore((s) => s.loadMolecule);
  const molecules = useStore((s) => s.molecules);
  const activeMoleculeId = useStore((s) => s.activeMoleculeId);
  const viewSettings = useStore((s) => s.viewSettings);
  const updateView = useStore((s) => s.updateViewSettings);
  const toggleLeftSidebar = useStore((s) => s.toggleLeftSidebar);
  const toggleRightSidebar = useStore((s) => s.toggleRightSidebar);
  const collaborationEnabled = useStore((s) => s.collaborationEnabled);
  const toggleCollaboration = useStore((s) => s.toggleCollaboration);
  const measurementMode = useStore((s) => s.measurementMode);
  const setMeasurementMode = useStore((s) => s.setMeasurementMode);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const name = file.name.replace(/\.[^.]+$/, '');
      try {
        let molecule;
        if (file.name.endsWith('.pdb')) {
          molecule = parsePDB(content, name);
        } else if (file.name.endsWith('.sdf') || file.name.endsWith('.mol')) {
          molecule = parseSDF(content, name);
        } else if (file.name.endsWith('.mol2')) {
          molecule = parseMOL2(content, name);
        } else {
          // Try PDB format as default
          molecule = parsePDB(content, name);
        }
        loadMolecule(molecule);
      } catch (err) {
        console.error('Failed to parse file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const mol = molecules.find((m) => m.id === activeMoleculeId);
    if (!mol) return;
    const pdbContent = exportPDB(mol);
    const blob = new Blob([pdbContent], { type: 'chemical/x-pdb' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mol.name}.pdb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadDemo = async () => {
    // Generate a sample water molecule
    const demoContent = `HEADER    DEMO MOLECULE - CAFFEINE
ATOM      1  N1  CAF A   1       1.320   0.530   0.000  1.00  0.00           N
ATOM      2  C2  CAF A   1       1.980   1.520   0.000  1.00  0.00           C
ATOM      3  N3  CAF A   1       1.370   2.610   0.000  1.00  0.00           N
ATOM      4  C4  CAF A   1       0.040   2.580   0.000  1.00  0.00           C
ATOM      5  C5  CAF A   1      -0.660   1.520   0.000  1.00  0.00           C
ATOM      6  C6  CAF A   1       0.000   0.380   0.000  1.00  0.00           C
ATOM      7  N7  CAF A   1      -2.010   1.780   0.000  1.00  0.00           N
ATOM      8  C8  CAF A   1      -2.170   3.000   0.000  1.00  0.00           C
ATOM      9  N9  CAF A   1      -0.880   3.510   0.000  1.00  0.00           N
ATOM     10  O2  CAF A   1       3.200   1.500   0.000  1.00  0.00           O
ATOM     11  O6  CAF A   1      -0.530  -0.750   0.000  1.00  0.00           O
ATOM     12  C10 CAF A   1       2.010  -0.630   0.000  1.00  0.00           C
ATOM     13  C11 CAF A   1       2.070   3.850   0.000  1.00  0.00           C
ATOM     14  C12 CAF A   1      -3.050   0.790   0.000  1.00  0.00           C
CONECT    1    2    6   12
CONECT    2    1    3   10
CONECT    3    2    4   13
CONECT    4    3    5    9
CONECT    5    4    6    7
CONECT    6    1    5   11
CONECT    7    5    8   14
CONECT    8    7    9
CONECT    9    4    8
END`;
    const mol = parsePDB(demoContent, 'Caffeine');
    loadMolecule(mol);
  };

  return (
    <div className="toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdb,.sdf,.mol,.mol2,.mmcif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* File operations */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={handleImport}>
          Import
        </button>
        <button
          className="toolbar-btn"
          onClick={handleExport}
          disabled={!activeMoleculeId}
          style={{ opacity: activeMoleculeId ? 1 : 0.4 }}
        >
          Export PDB
        </button>
        <button className="toolbar-btn btn-accent" onClick={handleLoadDemo}>
          Demo
        </button>
      </div>

      {/* View controls */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${viewSettings.projection === 'perspective' ? 'active' : ''}`}
          onClick={() => updateView({ projection: 'perspective' })}
        >
          Perspective
        </button>
        <button
          className={`toolbar-btn ${viewSettings.projection === 'orthographic' ? 'active' : ''}`}
          onClick={() => updateView({ projection: 'orthographic' })}
        >
          Orthographic
        </button>
        <div className="separator" />
        <button
          className={`toolbar-btn ${viewSettings.renderMode === 'wireframe' ? 'active' : ''}`}
          onClick={() =>
            updateView({
              renderMode: viewSettings.renderMode === 'wireframe' ? 'default' : 'wireframe',
            })
          }
        >
          Wireframe
        </button>
        <button
          className={`toolbar-btn ${viewSettings.showHelpers ? 'active' : ''}`}
          onClick={() => updateView({ showHelpers: !viewSettings.showHelpers })}
        >
          Helpers
        </button>
      </div>

      {/* Selection / Measurement */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${measurementMode === 'distance' ? 'active' : ''}`}
          onClick={() =>
            setMeasurementMode(measurementMode === 'distance' ? 'none' : 'distance')
          }
        >
          Distance
        </button>
        <button
          className={`toolbar-btn ${measurementMode === 'angle' ? 'active' : ''}`}
          onClick={() =>
            setMeasurementMode(measurementMode === 'angle' ? 'none' : 'angle')
          }
        >
          Angle
        </button>
        <button
          className={`toolbar-btn ${measurementMode === 'dihedral' ? 'active' : ''}`}
          onClick={() =>
            setMeasurementMode(measurementMode === 'dihedral' ? 'none' : 'dihedral')
          }
        >
          Dihedral
        </button>
      </div>

      <div className="toolbar-spacer" />

      {/* Right side controls */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${collaborationEnabled ? 'active' : ''}`}
          onClick={toggleCollaboration}
        >
          {collaborationEnabled ? 'Collab On' : 'Collab Off'}
        </button>
      </div>

      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={toggleLeftSidebar}>
          Left Panel
        </button>
        <button className="toolbar-btn" onClick={toggleRightSidebar}>
          Right Panel
        </button>
      </div>
    </div>
  );
}
