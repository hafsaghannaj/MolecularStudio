import React from 'react';
import { useStore } from '../../store';

const ICONS: Record<string, string> = {
  molecule: '\u2B22',   // hexagon
  light: '\u2600',      // sun
  camera: '\u25CE',     // bullseye
  measurement: '\u2194', // arrow
  group: '\u25A1',      // square
};

export function SceneHierarchy() {
  const sceneObjects = useStore((s) => s.sceneObjects);
  const selectedId = useStore((s) => s.selectedSceneObjectId);
  const setSelected = useStore((s) => s.setSelectedSceneObject);
  const setSceneObjects = useStore((s) => s.setSceneObjects);

  const toggleVisibility = (id: string) => {
    setSceneObjects(
      sceneObjects.map((o) =>
        o.id === id ? { ...o, visible: !o.visible } : o
      )
    );
  };

  return (
    <div>
      {sceneObjects.map((obj) => (
        <div
          key={obj.id}
          className={`scene-item ${selectedId === obj.id ? 'active' : ''}`}
          onClick={() => setSelected(obj.id)}
        >
          <span className="icon">{ICONS[obj.type] || '\u25CF'}</span>
          <span className="name">{obj.name}</span>
          <span
            className="visibility"
            onClick={(e) => {
              e.stopPropagation();
              toggleVisibility(obj.id);
            }}
          >
            {obj.visible ? '\u25C9' : '\u25CB'}
          </span>
        </div>
      ))}
      {sceneObjects.length === 0 && (
        <div style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: 11 }}>
          No objects in scene. Import a molecule to get started.
        </div>
      )}
    </div>
  );
}
