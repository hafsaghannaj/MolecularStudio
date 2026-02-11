import React from 'react';
import { useStore } from '../../store';
import { CollapsiblePanel } from '../UI/CollapsiblePanel';

const PRESET_MATERIALS = [
  { name: 'Default Atom', color: '#4fc3f7', roughness: 0.3, metalness: 0.1 },
  { name: 'Metallic Bond', color: '#90a4ae', roughness: 0.2, metalness: 0.8 },
  { name: 'Glass Surface', color: '#e0f7fa', roughness: 0.05, metalness: 0.0 },
  { name: 'Protein Ribbon', color: '#66bb6a', roughness: 0.5, metalness: 0.0 },
  { name: 'DNA Helix', color: '#ff7043', roughness: 0.4, metalness: 0.1 },
  { name: 'Lipid Membrane', color: '#ffca28', roughness: 0.6, metalness: 0.0 },
];

export function MaterialsPanel() {
  return (
    <div>
      <CollapsiblePanel title="Material Assets">
        <div style={{ display: 'grid', gap: 4 }}>
          {PRESET_MATERIALS.map((mat) => (
            <div
              key={mat.name}
              className="scene-item"
              style={{ gap: 8 }}
            >
              <div
                className="color-swatch"
                style={{ background: mat.color, width: 18, height: 18 }}
              />
              <span className="name" style={{ fontSize: 11 }}>{mat.name}</span>
            </div>
          ))}
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Library" defaultOpen={false}>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '4px 0' }}>
          Drag materials onto molecules to apply. Custom materials can be saved here.
        </div>
      </CollapsiblePanel>
    </div>
  );
}
