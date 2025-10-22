import fs from "fs";
import path from "path";
import mongoose, { Model, Schema } from "mongoose";

export interface ModelRegistryEntry {
  model: Model<any>;
  schema?: Schema;
  interface?: unknown;
}

export const models: Record<string, ModelRegistryEntry> = {};

const modelsDir = __dirname;

/* Utility: safely import a file, ignoring missing modules or syntax issues.
 */
const safeRequire = (filePath: string): Record<string, any> | null => {
  try {
    return require(filePath);
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : JSON.stringify(err, null, 2);
    console.warn(`Could not load module at ${filePath}: ${msg}`);
    return null;
  }
};

/* Utility: Recursively scan directories to find all model-related files.
 */
const scanDirectories = (baseDir: string): string[] => {
  const entries = fs.readdirSync(baseDir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry);
    const stat = fs.statSync(fullPath);

    // Skip self
    if (entry === "index.ts" || entry === "index.js") continue;

    if (stat.isDirectory()) {
      files.push(...scanDirectories(fullPath));
    } else if (/\.(ts|js)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
};

/* Utility: Register a module if it exports a Mongoose model.
 */
const registerModule = (filePath: string): void => {
  const mod = safeRequire(filePath);
  if (!mod) return;

  const entry: Partial<ModelRegistryEntry> = {};

  // --- Detect exported Model ---
  const modelEntry = Object.entries(mod).find(([key, value]) =>
    key.endsWith("Model")
  );
  if (modelEntry) {
    const [name, model] = modelEntry;
    entry.model = model as Model<any>;
    const baseName = name.replace("Model", "");
    models[baseName] = entry as ModelRegistryEntry;
    console.log(`Registered model: ${name}`);
  }

  // --- Detect exported Schema ---
  const schemaEntry = Object.entries(mod).find(([key]) =>
    key.endsWith("Schema")
  );
  if (schemaEntry && entry.model) {
    entry.schema = schemaEntry[1] as Schema;
  }

  // --- Detect exported Interface ---
  const ifaceEntry = Object.entries(mod).find(
    ([key]) => key.endsWith("Interface") || key.startsWith("I")
  );
  if (ifaceEntry && entry.model) {
    entry.interface = ifaceEntry[1];
  }
};

/* Main: Scan and register all models under /models directory.
 */
const allFiles = scanDirectories(modelsDir);

for (const file of allFiles) {
  registerModule(file);
}

/* Optional: Accessor helpers for anywhere in the app.
 */
export const getModel = <T = any>(name: string): Model<T> | null => {
  return (models[name]?.model as Model<T>) || null;
};

export const getSchema = (name: string): Schema | null => {
  return models[name]?.schema || null;
};

export const getInterface = (name: string): unknown => {
  return models[name]?.interface;
};

console.log(`Loaded ${Object.keys(models).length} models successfully.`);
