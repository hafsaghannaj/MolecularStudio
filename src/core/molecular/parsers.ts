import * as THREE from 'three';
import { Atom, Bond, Molecule, Residue, Chain, ELEMENT_DATA } from './types';

function getElementData(element: string) {
  return ELEMENT_DATA[element] || { color: '#FF69B4', radius: 1.0, mass: 1.0 };
}

export function parsePDB(content: string, name: string = 'molecule'): Molecule {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const residueMap = new Map<string, Residue>();
  const chainMap = new Map<string, Chain>();
  const metadata: Record<string, string> = {};
  let atomId = 0;
  let bondId = 0;

  const lines = content.split('\n');

  for (const line of lines) {
    const recordType = line.substring(0, 6).trim();

    if (recordType === 'HEADER') {
      metadata['header'] = line.substring(10, 50).trim();
    } else if (recordType === 'TITLE') {
      metadata['title'] = (metadata['title'] || '') + line.substring(10).trim() + ' ';
    } else if (recordType === 'ATOM' || recordType === 'HETATM') {
      const atomName = line.substring(12, 16).trim();
      const residueName = line.substring(17, 20).trim();
      const chainId = line.substring(21, 22).trim() || 'A';
      const residueId = parseInt(line.substring(22, 26).trim()) || 0;
      const x = parseFloat(line.substring(30, 38).trim()) || 0;
      const y = parseFloat(line.substring(38, 46).trim()) || 0;
      const z = parseFloat(line.substring(46, 54).trim()) || 0;
      const occupancy = parseFloat(line.substring(54, 60).trim()) || 1.0;
      const bFactor = parseFloat(line.substring(60, 66).trim()) || 0.0;
      let element = line.substring(76, 78).trim();
      if (!element) {
        element = atomName.replace(/[0-9]/g, '').substring(0, 1);
      }
      element = element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();

      const elemData = getElementData(element);

      atoms.push({
        id: atomId,
        element,
        name: atomName,
        position: new THREE.Vector3(x, y, z),
        residueName,
        residueId,
        chainId,
        occupancy,
        bFactor,
        charge: 0,
        radius: elemData.radius,
        color: elemData.color,
        selected: false,
      });

      const resKey = `${chainId}:${residueId}`;
      if (!residueMap.has(resKey)) {
        residueMap.set(resKey, { id: residueId, name: residueName, chainId, atoms: [] });
      }
      residueMap.get(resKey)!.atoms.push(atomId);

      if (!chainMap.has(chainId)) {
        chainMap.set(chainId, { id: chainId, residues: [] });
      }

      atomId++;
    } else if (recordType === 'CONECT') {
      const sourceIdx = parseInt(line.substring(6, 11).trim()) - 1;
      for (let i = 11; i < line.length; i += 5) {
        const targetStr = line.substring(i, i + 5).trim();
        if (targetStr) {
          const targetIdx = parseInt(targetStr) - 1;
          if (targetIdx > sourceIdx && targetIdx < atoms.length) {
            bonds.push({ id: bondId++, atomIndex1: sourceIdx, atomIndex2: targetIdx, order: 1 });
          }
        }
      }
    }
  }

  // Auto-generate bonds if none from CONECT records
  if (bonds.length === 0) {
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dist = atoms[i].position.distanceTo(atoms[j].position);
        const maxDist = (atoms[i].radius + atoms[j].radius) * 1.3;
        if (dist < maxDist && dist > 0.4) {
          bonds.push({ id: bondId++, atomIndex1: i, atomIndex2: j, order: 1 });
        }
      }
    }
  }

  // Build chain residue lists
  const residues = Array.from(residueMap.values());
  residueMap.forEach((res) => {
    const chain = chainMap.get(res.chainId);
    if (chain && !chain.residues.includes(res.id)) {
      chain.residues.push(res.id);
    }
  });

  return {
    id: crypto.randomUUID(),
    name,
    atoms,
    bonds,
    residues,
    chains: Array.from(chainMap.values()),
    metadata,
  };
}

export function parseSDF(content: string, name: string = 'molecule'): Molecule {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const metadata: Record<string, string> = {};
  const lines = content.split('\n');

  if (lines.length < 4) throw new Error('Invalid SDF file');

  const molName = lines[0].trim() || name;
  metadata['name'] = molName;

  const countsLine = lines[3];
  const numAtoms = parseInt(countsLine.substring(0, 3).trim());
  const numBonds = parseInt(countsLine.substring(3, 6).trim());

  // Parse atoms
  for (let i = 0; i < numAtoms; i++) {
    const line = lines[4 + i];
    const x = parseFloat(line.substring(0, 10).trim());
    const y = parseFloat(line.substring(10, 20).trim());
    const z = parseFloat(line.substring(20, 30).trim());
    const element = line.substring(31, 34).trim();
    const elemData = getElementData(element);

    atoms.push({
      id: i,
      element,
      name: `${element}${i + 1}`,
      position: new THREE.Vector3(x, y, z),
      residueName: 'LIG',
      residueId: 1,
      chainId: 'A',
      occupancy: 1.0,
      bFactor: 0.0,
      charge: 0,
      radius: elemData.radius,
      color: elemData.color,
      selected: false,
    });
  }

  // Parse bonds
  for (let i = 0; i < numBonds; i++) {
    const line = lines[4 + numAtoms + i];
    const a1 = parseInt(line.substring(0, 3).trim()) - 1;
    const a2 = parseInt(line.substring(3, 6).trim()) - 1;
    const order = parseInt(line.substring(6, 9).trim());
    bonds.push({ id: i, atomIndex1: a1, atomIndex2: a2, order });
  }

  return {
    id: crypto.randomUUID(),
    name: molName,
    atoms,
    bonds,
    residues: [{ id: 1, name: 'LIG', chainId: 'A', atoms: atoms.map((_, i) => i) }],
    chains: [{ id: 'A', residues: [1] }],
    metadata,
  };
}

export function parseMOL2(content: string, name: string = 'molecule'): Molecule {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const metadata: Record<string, string> = {};

  const sections = content.split('@<TRIPOS>');
  let atomSection = '';
  let bondSection = '';
  let moleculeSection = '';

  for (const section of sections) {
    if (section.startsWith('MOLECULE')) moleculeSection = section;
    else if (section.startsWith('ATOM')) atomSection = section;
    else if (section.startsWith('BOND')) bondSection = section;
  }

  const molLines = moleculeSection.split('\n');
  const molName = molLines[1]?.trim() || name;
  metadata['name'] = molName;

  // Parse atoms
  const atomLines = atomSection.split('\n').slice(1).filter(l => l.trim());
  let atomId = 0;
  for (const line of atomLines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) continue;
    const atomName = parts[1];
    const x = parseFloat(parts[2]);
    const y = parseFloat(parts[3]);
    const z = parseFloat(parts[4]);
    const atomType = parts[5];
    const element = atomType.split('.')[0];
    const elemData = getElementData(element);

    atoms.push({
      id: atomId,
      element,
      name: atomName,
      position: new THREE.Vector3(x, y, z),
      residueName: parts[7] || 'LIG',
      residueId: parseInt(parts[6]) || 1,
      chainId: 'A',
      occupancy: 1.0,
      bFactor: 0.0,
      charge: parts[8] ? parseFloat(parts[8]) : 0,
      radius: elemData.radius,
      color: elemData.color,
      selected: false,
    });
    atomId++;
  }

  // Parse bonds
  const bondLines = bondSection.split('\n').slice(1).filter(l => l.trim());
  let bondId = 0;
  for (const line of bondLines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;
    const a1 = parseInt(parts[1]) - 1;
    const a2 = parseInt(parts[2]) - 1;
    const type = parts[3];
    const order = type === 'ar' ? 2 : type === 'am' ? 1 : parseInt(type) || 1;
    bonds.push({ id: bondId++, atomIndex1: a1, atomIndex2: a2, order });
  }

  return {
    id: crypto.randomUUID(),
    name: molName,
    atoms,
    bonds,
    residues: [{ id: 1, name: 'LIG', chainId: 'A', atoms: atoms.map((_, i) => i) }],
    chains: [{ id: 'A', residues: [1] }],
    metadata,
  };
}

export async function fetchFromPubChem(query: string): Promise<Molecule> {
  // Step 1: Search PubChem for the compound by name
  const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/cids/JSON`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`Molecule "${query}" not found on PubChem`);
  }
  const searchData = await searchRes.json();
  const cid = searchData?.IdentifierList?.CID?.[0];
  if (!cid) {
    throw new Error(`No results found for "${query}"`);
  }

  // Step 2: Fetch 3D SDF structure
  const sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`;
  const sdfRes = await fetch(sdfUrl);

  if (sdfRes.ok) {
    const sdfContent = await sdfRes.text();
    const mol = parseSDF(sdfContent, query);
    mol.metadata['source'] = 'PubChem';
    mol.metadata['cid'] = String(cid);
    return mol;
  }

  // Step 3: Fallback to 2D SDF if no 3D conformer exists
  const sdf2dUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=2d`;
  const sdf2dRes = await fetch(sdf2dUrl);
  if (!sdf2dRes.ok) {
    throw new Error(`Could not fetch structure for "${query}" (CID: ${cid})`);
  }
  const sdf2dContent = await sdf2dRes.text();
  const mol = parseSDF(sdf2dContent, query);
  mol.metadata['source'] = 'PubChem (2D)';
  mol.metadata['cid'] = String(cid);
  return mol;
}

export function exportPDB(molecule: Molecule): string {
  const lines: string[] = [];
  lines.push(`HEADER    ${molecule.name}`);

  molecule.atoms.forEach((atom, i) => {
    const serial = (i + 1).toString().padStart(5);
    const name = atom.name.padEnd(4).substring(0, 4);
    const resName = atom.residueName.padStart(3);
    const chain = atom.chainId;
    const resSeq = atom.residueId.toString().padStart(4);
    const x = atom.position.x.toFixed(3).padStart(8);
    const y = atom.position.y.toFixed(3).padStart(8);
    const z = atom.position.z.toFixed(3).padStart(8);
    const occ = atom.occupancy.toFixed(2).padStart(6);
    const bfac = atom.bFactor.toFixed(2).padStart(6);
    const elem = atom.element.padStart(2);
    lines.push(`ATOM  ${serial} ${name} ${resName} ${chain}${resSeq}    ${x}${y}${z}${occ}${bfac}          ${elem}`);
  });

  molecule.bonds.forEach((bond) => {
    const a1 = (bond.atomIndex1 + 1).toString().padStart(5);
    const a2 = (bond.atomIndex2 + 1).toString().padStart(5);
    lines.push(`CONECT${a1}${a2}`);
  });

  lines.push('END');
  return lines.join('\n');
}
