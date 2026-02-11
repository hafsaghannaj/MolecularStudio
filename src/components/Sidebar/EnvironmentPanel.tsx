import React from 'react';
import { useStore } from '../../store';
import { CollapsiblePanel } from '../UI/CollapsiblePanel';
import { Toggle } from '../UI/Toggle';
import { ColorPicker } from '../UI/ColorPicker';
import { Slider } from '../UI/Slider';

export function EnvironmentPanel() {
  const viewSettings = useStore((s) => s.viewSettings);
  const updateView = useStore((s) => s.updateViewSettings);
  const lights = useStore((s) => s.lights);
  const updateLight = useStore((s) => s.updateLight);

  return (
    <div>
      <CollapsiblePanel title="Environment Settings">
        <ColorPicker
          label="BGColor"
          color={viewSettings.backgroundColor}
          onChange={(c) => updateView({ backgroundColor: c })}
        />
        <div className="form-row">
          <span className="form-label">Grid Plane</span>
          <select
            className="form-select"
            value={viewSettings.gridPlane}
            onChange={(e) => updateView({ gridPlane: e.target.value as 'XZ' | 'XY' | 'YZ' })}
          >
            <option value="XZ">Floor (XZ)</option>
            <option value="XY">Wall (XY)</option>
            <option value="YZ">Side (YZ)</option>
          </select>
        </div>
        <Toggle
          label="Show Grid"
          checked={viewSettings.showGrid}
          onChange={(v) => updateView({ showGrid: v })}
        />
      </CollapsiblePanel>

      <CollapsiblePanel title="Ambient">
        <Slider
          label="Intensity"
          value={viewSettings.ambientIntensity}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateView({ ambientIntensity: v })}
        />
        <ColorPicker
          label="Color"
          color={viewSettings.ambientColor}
          onChange={(c) => updateView({ ambientColor: c })}
        />
      </CollapsiblePanel>

      <CollapsiblePanel title="Fog" defaultOpen={false}>
        <Toggle
          label="Enable"
          checked={viewSettings.showFog}
          onChange={(v) => updateView({ showFog: v })}
        />
        {viewSettings.showFog && (
          <>
            <ColorPicker
              label="Color"
              color={viewSettings.fogColor}
              onChange={(c) => updateView({ fogColor: c })}
            />
            <Slider
              label="Near"
              value={viewSettings.fogNear}
              min={1}
              max={100}
              onChange={(v) => updateView({ fogNear: v })}
            />
            <Slider
              label="Far"
              value={viewSettings.fogFar}
              min={50}
              max={500}
              onChange={(v) => updateView({ fogFar: v })}
            />
          </>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel title="Post-Processing" defaultOpen={false}>
        <Toggle
          label="Enable"
          checked={viewSettings.postProcessing}
          onChange={(v) => updateView({ postProcessing: v })}
        />
        {viewSettings.postProcessing && (
          <>
            <Toggle
              label="Bloom"
              checked={viewSettings.bloom}
              onChange={(v) => updateView({ bloom: v })}
            />
            <Toggle
              label="SSAO"
              checked={viewSettings.ssao}
              onChange={(v) => updateView({ ssao: v })}
            />
          </>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel title="Lights">
        {lights.map((light) => (
          <div key={light.id} style={{ marginBottom: 8 }}>
            <div className="form-row" style={{ fontWeight: 600, fontSize: 11 }}>
              <span>{light.name}</span>
              <Toggle
                checked={light.visible}
                onChange={(v) => updateLight(light.id, { visible: v })}
              />
            </div>
            {light.visible && (
              <>
                <ColorPicker
                  label="Color"
                  color={light.color}
                  onChange={(c) => updateLight(light.id, { color: c })}
                />
                <Slider
                  label="Intensity"
                  value={Math.round(light.intensity * 100)}
                  min={0}
                  max={200}
                  unit="%"
                  onChange={(v) => updateLight(light.id, { intensity: v / 100 })}
                />
              </>
            )}
          </div>
        ))}
      </CollapsiblePanel>
    </div>
  );
}
