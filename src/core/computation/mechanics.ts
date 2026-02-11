import * as THREE from 'three';
import type { Atom, Bond, Molecule, Measurement } from '../molecular/types';

// Lennard-Jones parameters (simplified, sigma in Angstroms, epsilon in kcal/mol)
const LJ_PARAMS: Record<string, { sigma: number; epsilon: number }> = {
  H:  { sigma: 2.5,  epsilon: 0.02 },
  C:  { sigma: 3.4,  epsilon: 0.086 },
  N:  { sigma: 3.25, epsilon: 0.17 },
  O:  { sigma: 3.0,  epsilon: 0.21 },
  S:  { sigma: 3.55, epsilon: 0.25 },
  P:  { sigma: 3.74, epsilon: 0.20 },
  Fe: { sigma: 2.91, epsilon: 0.013 },
};

function getLJParams(element: string) {
  return LJ_PARAMS[element] || { sigma: 3.0, epsilon: 0.1 };
}

export function calculateBondEnergy(atom1: Atom, atom2: Atom, bond: Bond): number {
  const distance = atom1.position.distanceTo(atom2.position);
  const eqLength = atom1.radius + atom2.radius;
  const k = 300 * bond.order; // force constant kcal/mol/A^2
  return 0.5 * k * Math.pow(distance - eqLength, 2);
}

export function calculateVdWEnergy(atom1: Atom, atom2: Atom): number {
  const r = atom1.position.distanceTo(atom2.position);
  if (r < 0.1) return 0;
  const p1 = getLJParams(atom1.element);
  const p2 = getLJParams(atom2.element);
  const sigma = (p1.sigma + p2.sigma) / 2;
  const epsilon = Math.sqrt(p1.epsilon * p2.epsilon);
  const ratio = sigma / r;
  return 4 * epsilon * (Math.pow(ratio, 12) - Math.pow(ratio, 6));
}

export function calculateTotalEnergy(molecule: Molecule): {
  bond: number;
  vdw: number;
  total: number;
} {
  let bondEnergy = 0;
  let vdwEnergy = 0;

  // Bond energy
  for (const bond of molecule.bonds) {
    bondEnergy += calculateBondEnergy(
      molecule.atoms[bond.atomIndex1],
      molecule.atoms[bond.atomIndex2],
      bond
    );
  }

  // VdW energy (non-bonded pairs)
  const bondedPairs = new Set<string>();
  for (const bond of molecule.bonds) {
    bondedPairs.add(`${bond.atomIndex1}-${bond.atomIndex2}`);
    bondedPairs.add(`${bond.atomIndex2}-${bond.atomIndex1}`);
  }

  for (let i = 0; i < molecule.atoms.length; i++) {
    for (let j = i + 1; j < molecule.atoms.length; j++) {
      if (!bondedPairs.has(`${i}-${j}`)) {
        vdwEnergy += calculateVdWEnergy(molecule.atoms[i], molecule.atoms[j]);
      }
    }
  }

  return { bond: bondEnergy, vdw: vdwEnergy, total: bondEnergy + vdwEnergy };
}

export function minimizeEnergy(
  molecule: Molecule,
  steps: number = 100,
  stepSize: number = 0.01
): Molecule {
  const result = {
    ...molecule,
    atoms: molecule.atoms.map(a => ({
      ...a,
      position: a.position.clone(),
    })),
  };

  for (let step = 0; step < steps; step++) {
    const forces: THREE.Vector3[] = result.atoms.map(() => new THREE.Vector3());

    // Bond forces
    for (const bond of result.bonds) {
      const a1 = result.atoms[bond.atomIndex1];
      const a2 = result.atoms[bond.atomIndex2];
      const dir = new THREE.Vector3().subVectors(a2.position, a1.position);
      const dist = dir.length();
      if (dist < 0.01) continue;
      dir.normalize();

      const eqLength = a1.radius + a2.radius;
      const k = 300 * bond.order;
      const forceMag = k * (dist - eqLength);

      forces[bond.atomIndex1].addScaledVector(dir, forceMag);
      forces[bond.atomIndex2].addScaledVector(dir, -forceMag);
    }

    // Apply forces
    for (let i = 0; i < result.atoms.length; i++) {
      const maxForce = 10;
      const f = forces[i];
      const mag = f.length();
      if (mag > maxForce) f.multiplyScalar(maxForce / mag);
      result.atoms[i].position.addScaledVector(f, stepSize);
    }
  }

  return result;
}

export function measureDistance(a1: Atom, a2: Atom): number {
  return a1.position.distanceTo(a2.position);
}

export function measureAngle(a1: Atom, a2: Atom, a3: Atom): number {
  const v1 = new THREE.Vector3().subVectors(a1.position, a2.position).normalize();
  const v2 = new THREE.Vector3().subVectors(a3.position, a2.position).normalize();
  return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(v1.dot(v2), -1, 1)));
}

export function measureDihedral(a1: Atom, a2: Atom, a3: Atom, a4: Atom): number {
  const b1 = new THREE.Vector3().subVectors(a2.position, a1.position);
  const b2 = new THREE.Vector3().subVectors(a3.position, a2.position);
  const b3 = new THREE.Vector3().subVectors(a4.position, a3.position);

  const n1 = new THREE.Vector3().crossVectors(b1, b2).normalize();
  const n2 = new THREE.Vector3().crossVectors(b2, b3).normalize();

  const m1 = new THREE.Vector3().crossVectors(n1, b2.clone().normalize());

  const x = n1.dot(n2);
  const y = m1.dot(n2);

  return THREE.MathUtils.radToDeg(Math.atan2(y, x));
}

export function createMeasurement(
  molecule: Molecule,
  atomIndices: number[],
  type: 'distance' | 'angle' | 'dihedral'
): Measurement {
  let value = 0;
  let unit = '';
  const atoms = atomIndices.map(i => molecule.atoms[i]);

  switch (type) {
    case 'distance':
      value = measureDistance(atoms[0], atoms[1]);
      unit = '\u00C5'; // Angstrom
      break;
    case 'angle':
      value = measureAngle(atoms[0], atoms[1], atoms[2]);
      unit = '\u00B0'; // degrees
      break;
    case 'dihedral':
      value = measureDihedral(atoms[0], atoms[1], atoms[2], atoms[3]);
      unit = '\u00B0';
      break;
  }

  return {
    id: crypto.randomUUID(),
    type,
    atomIndices,
    value: parseFloat(value.toFixed(2)),
    unit,
    visible: true,
  };
}
