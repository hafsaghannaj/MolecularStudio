import React from 'react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { LeftSidebar } from './components/Sidebar/LeftSidebar';
import { Viewport } from './components/Viewport/Viewport';
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel';

export default function App() {
  return (
    <div className="app-layout">
      <Toolbar />
      <div className="app-body">
        <LeftSidebar />
        <Viewport />
        <PropertiesPanel />
      </div>
    </div>
  );
}
