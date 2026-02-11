import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useStore } from '../../store';
import type { Molecule, VisualizationStyle } from '../../core/molecular/types';

const CHAIN_COLORS = [
  '#4fc3f7', '#66bb6a', '#ef5350', '#ffa726', '#ab47bc',
  '#26c6da', '#d4e157', '#ec407a', '#8d6e63', '#78909c',
];

function getAtomColor(
  atom: { element: string; chainId: string; residueId: number; bFactor: number; charge: number; color: string },
  scheme: string
): string {
  switch (scheme) {
    case 'chain':
      return CHAIN_COLORS[atom.chainId.charCodeAt(0) % CHAIN_COLORS.length];
    case 'residue':
      return CHAIN_COLORS[atom.residueId % CHAIN_COLORS.length];
    case 'bfactor': {
      const t = Math.min(atom.bFactor / 100, 1);
      const r = Math.round(255 * t);
      const b = Math.round(255 * (1 - t));
      return `rgb(${r}, 50, ${b})`;
    }
    case 'charge': {
      const t = (atom.charge + 1) / 2;
      const r = Math.round(255 * Math.max(0, t));
      const bb = Math.round(255 * Math.max(0, 1 - t));
      return `rgb(${r}, 100, ${bb})`;
    }
    default:
      return atom.color;
  }
}

interface MoleculeRendererProps {
  molecule: Molecule;
}

export function MoleculeRenderer({ molecule }: MoleculeRendererProps) {
  const vizStyle = useStore((s) => s.visualizationStyle);
  const colorScheme = useStore((s) => s.colorScheme);
  const selectedAtomIndices = useStore((s) => s.selectedAtomIndices);
  const selectAtom = useStore((s) => s.selectAtom);
  const renderMode = useStore((s) => s.viewSettings.renderMode);

  const handleAtomClick = (e: ThreeEvent<MouseEvent>, index: number) => {
    e.stopPropagation();
    selectAtom(index, e.shiftKey);
  };

  const atomScale = vizStyle === 'spacefill' ? 1.5 : vizStyle === 'wireframe' ? 0.15 : 0.4;
  const bondRadius = vizStyle === 'licorice' ? 0.15 : vizStyle === 'wireframe' ? 0.03 : 0.08;
  const showBonds = vizStyle !== 'spacefill' && vizStyle !== 'surface';

  // Center molecule
  const center = useMemo(() => {
    if (molecule.atoms.length === 0) return new THREE.Vector3();
    const c = new THREE.Vector3();
    molecule.atoms.forEach((a) => c.add(a.position));
    c.divideScalar(molecule.atoms.length);
    return c;
  }, [molecule.atoms]);

  return (
    <group position={[-center.x, -center.y, -center.z]}>
      {/* Atoms */}
      {molecule.atoms.map((atom, i) => {
        const color = getAtomColor(atom, colorScheme);
        const isSelected = selectedAtomIndices.includes(i);

        return (
          <mesh
            key={`atom-${i}`}
            position={[atom.position.x, atom.position.y, atom.position.z]}
            onClick={(e) => handleAtomClick(e, i)}
          >
            <sphereGeometry args={[atom.radius * atomScale, 16, 12]} />
            <meshStandardMaterial
              color={isSelected ? '#ffff00' : color}
              wireframe={renderMode === 'wireframe'}
              emissive={isSelected ? '#444400' : '#000000'}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
        );
      })}

      {/* Bonds */}
      {showBonds &&
        molecule.bonds.map((bond, i) => {
          const a1 = molecule.atoms[bond.atomIndex1];
          const a2 = molecule.atoms[bond.atomIndex2];
          if (!a1 || !a2) return null;

          const start = a1.position;
          const end = a2.position;
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
          const dir = new THREE.Vector3().subVectors(end, start);
          const length = dir.length();
          dir.normalize();

          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

          if (bond.order === 1) {
            return (
              <mesh
                key={`bond-${i}`}
                position={[mid.x, mid.y, mid.z]}
                quaternion={quaternion}
              >
                <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
                <meshStandardMaterial
                  color="#607d8b"
                  wireframe={renderMode === 'wireframe'}
                  roughness={0.6}
                />
              </mesh>
            );
          }

          // Double/triple bonds: offset cylinders
          const offsets: THREE.Vector3[] = [];
          const perp = new THREE.Vector3(1, 0, 0);
          if (Math.abs(dir.dot(perp)) > 0.9) perp.set(0, 0, 1);
          const offsetDir = new THREE.Vector3().crossVectors(dir, perp).normalize();

          const spread = bondRadius * 2.5;
          for (let o = 0; o < bond.order; o++) {
            const t = (o - (bond.order - 1) / 2) * spread;
            offsets.push(offsetDir.clone().multiplyScalar(t));
          }

          return (
            <group key={`bond-${i}`}>
              {offsets.map((offset, oi) => (
                <mesh
                  key={oi}
                  position={[mid.x + offset.x, mid.y + offset.y, mid.z + offset.z]}
                  quaternion={quaternion}
                >
                  <cylinderGeometry args={[bondRadius * 0.7, bondRadius * 0.7, length, 8]} />
                  <meshStandardMaterial
                    color="#607d8b"
                    wireframe={renderMode === 'wireframe'}
                    roughness={0.6}
                  />
                </mesh>
              ))}
            </group>
          );
        })}
    </group>
  );
}
