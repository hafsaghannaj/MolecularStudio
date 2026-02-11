import React, { useState } from 'react';

interface CollapsiblePanelProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsiblePanel({ title, defaultOpen = true, children }: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="panel-section">
      <div className="panel-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className={`chevron ${open ? 'open' : ''}`}>&#9654;</span>
      </div>
      {open && <div className="panel-content">{children}</div>}
    </div>
  );
}
