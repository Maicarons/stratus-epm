import { createDemoDataset } from '@stratus/core';
import type { Dataset } from '@stratus/schema';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const dataFile = join(dataDir, 'stratus.json');

export function ensureDataDir() {
  mkdirSync(dataDir, { recursive: true });
}

export function loadDataset(): Dataset {
  ensureDataDir();
  if (!existsSync(dataFile)) {
    const demo = createDemoDataset();
    writeFileSync(dataFile, JSON.stringify(demo, null, 2), 'utf8');
    return demo;
  }
  return JSON.parse(readFileSync(dataFile, 'utf8')) as Dataset;
}

export function saveDataset(dataset: Dataset) {
  ensureDataDir();
  writeFileSync(dataFile, JSON.stringify(dataset, null, 2), 'utf8');
}

export function resetDataset(): Dataset {
  const demo = createDemoDataset();
  saveDataset(demo);
  return demo;
}

export function seedAndPrint() {
  const ds = resetDataset();
  console.log('Seeded demo group 华衡集团');
  console.log(` entities=${ds.entities.length} facts=${ds.facts.length} rules=${ds.eliminationRules.length}`);
  console.log(` data file: ${dataFile}`);
}
