import React from 'react';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, color, onChange }: ColorPickerProps) {
  return (
    <div className="form-row">
      <span className="form-label">{label}</span>
      <div className="color-picker-row">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="color-swatch"
          style={{ background: color }}
        />
        <span className="color-hex">{color.replace('#', '').toUpperCase()}</span>
      </div>
    </div>
  );
}
