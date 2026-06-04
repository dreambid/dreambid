import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src/data');

export function readData<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T[];
}

export function readSingleData<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export function writeData<T>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function findById<T extends { id: string }>(filename: string, id: string): T | undefined {
  return readData<T>(filename).find((item) => item.id === id);
}

export function insertItem<T extends { id: string }>(filename: string, item: T): T {
  const items = readData<T>(filename);
  items.push(item);
  writeData(filename, items);
  return item;
}

export function updateItem<T extends { id: string }>(
  filename: string,
  id: string,
  updates: Partial<T>
): T | null {
  const items = readData<T>(filename);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  writeData(filename, items);
  return items[index];
}

export function deleteItem<T extends { id: string }>(filename: string, id: string): boolean {
  const items = readData<T>(filename);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  writeData(filename, filtered);
  return true;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
