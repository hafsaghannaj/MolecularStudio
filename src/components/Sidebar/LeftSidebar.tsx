import React from 'react';
import { useStore } from '../../store';
import { SceneHierarchy } from './SceneHierarchy';
import { MaterialsPanel } from './MaterialsPanel';
import { EnvironmentPanel } from './EnvironmentPanel';
import { CollapsiblePanel } from '../UI/CollapsiblePanel';

export function LeftSidebar() {
  const open = useStore((s) => s.leftSidebarOpen);
  const activePanel = useStore((s) => s.activeLeftPanel);
  const setPanel = useStore((s) => s.setActiveLeftPanel);

  if (!open) return null;

  return (
    <div className="panel" style={{ width: 'var(--panel-width)', flexShrink: 0 }}>
      <div className="tab-bar">
        <div
          className={`tab ${activePanel === 'scene' ? 'active' : ''}`}
          onClick={() => setPanel('scene')}
        >
          Scene
        </div>
        <div
          className={`tab ${activePanel === 'materials' ? 'active' : ''}`}
          onClick={() => setPanel('materials')}
        >
          Materials
        </div>
        <div
          className={`tab ${activePanel === 'environment' ? 'active' : ''}`}
          onClick={() => setPanel('environment')}
        >
          Environ
        </div>
      </div>

      {activePanel === 'scene' && (
        <CollapsiblePanel title="Scene Outliner">
          <SceneHierarchy />
        </CollapsiblePanel>
      )}
      {activePanel === 'materials' && <MaterialsPanel />}
      {activePanel === 'environment' && <EnvironmentPanel />}
    </div>
  );
}
