import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { useStore } from '../../store';
import { MoleculeRenderer } from './MoleculeRenderer';

function SceneLights() {
  const lights = useStore((s) => s.lights);
  const ambientIntensity = useStore((s) => s.viewSettings.ambientIntensity);
  const ambientColor = useStore((s) => s.viewSettings.ambientColor);

  return (
    <>
      <ambientLight intensity={ambientIntensity / 100} color={ambientColor} />
      {lights
        .filter((l) => l.visible)
        .map((light) => {
          switch (light.type) {
            case 'directional':
              return (
                <directionalLight
                  key={light.id}
                  position={light.position}
                  color={light.color}
                  intensity={light.intensity}
                  castShadow
                />
              );
            case 'point':
              return (
                <pointLight
                  key={light.id}
                  position={light.position}
                  color={light.color}
                  intensity={light.intensity}
                  distance={100}
                />
              );
            default:
              return null;
          }
        })}
    </>
  );
}

function SceneGrid() {
  const viewSettings = useStore((s) => s.viewSettings);
  if (!viewSettings.showGrid) return null;

  const rotation: [number, number, number] =
    viewSettings.gridPlane === 'XY'
      ? [0, 0, 0]
      : viewSettings.gridPlane === 'YZ'
      ? [0, 0, Math.PI / 2]
      : [0, 0, 0]; // XZ is default

  return (
    <Grid
      args={[100, 100]}
      rotation={rotation}
      position={[0, -5, 0]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#2a2a4a"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#3a3a6a"
      fadeDistance={60}
      infiniteGrid
    />
  );
}

function CameraSetup() {
  const projection = useStore((s) => s.viewSettings.projection);

  if (projection === 'orthographic') {
    return <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={15} />;
  }
  return <PerspectiveCamera makeDefault position={[20, 15, 20]} fov={50} />;
}

function FogSetup() {
  const { showFog, fogColor, fogNear, fogFar } = useStore((s) => s.viewSettings);
  if (!showFog) return null;
  return <fog attach="fog" args={[fogColor, fogNear, fogFar]} />;
}

export function Viewport() {
  const molecules = useStore((s) => s.molecules);
  const backgroundColor = useStore((s) => s.viewSettings.backgroundColor);
  const showHelpers = useStore((s) => s.viewSettings.showHelpers);
  const clearSelection = useStore((s) => s.clearSelection);
  const activeMoleculeId = useStore((s) => s.activeMoleculeId);
  const measurementMode = useStore((s) => s.measurementMode);

  return (
    <div className="viewport-container">
      <Canvas
        style={{ background: backgroundColor }}
        onPointerMissed={clearSelection}
        shadows
      >
        <CameraSetup />
        <FogSetup />
        <SceneLights />
        <SceneGrid />

        <Suspense fallback={null}>
          {molecules.map((mol) => (
            <MoleculeRenderer key={mol.id} molecule={mol} />
          ))}
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={0.8}
          zoomSpeed={1.2}
          panSpeed={0.8}
        />

        {showHelpers && (
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport labelColor="white" axisHeadScale={1} />
          </GizmoHelper>
        )}
      </Canvas>

      {/* Viewport overlay */}
      <div className="viewport-overlay">
        <div className="viewport-badge">
          {molecules.length > 0
            ? `${molecules.reduce((s, m) => s + m.atoms.length, 0)} atoms`
            : 'No molecule'}
        </div>
        {activeMoleculeId && (
          <div className="viewport-badge">
            {molecules.find((m) => m.id === activeMoleculeId)?.name || ''}
          </div>
        )}
        {measurementMode !== 'none' && (
          <div className="viewport-badge" style={{ color: 'var(--accent)' }}>
            Measuring: {measurementMode}
          </div>
        )}
      </div>
    </div>
  );
}
