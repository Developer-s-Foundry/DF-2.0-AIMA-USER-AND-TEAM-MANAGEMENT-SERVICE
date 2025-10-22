import fs from "fs";
import path from "path";
import mongoose, { Model, Schema, Document } from "mongoose";

/** Represents each registered Mongoose model entry. */
export interface ModelRegistryEntry<
  TDoc extends Document = any,
  TModel extends Model<TDoc> = Model<TDoc>
> {
  model: TModel;
  schema?: Schema;
  interface?: unknown;
}

/** Global model registry */
export const models: Record<string, ModelRegistryEntry<any, any>> = {};

const modelsDir = __dirname;

/* --------------------------- Utility: Safe require --------------------------- */
const safeRequire = (filePath: string): Record<string, any> | null => {
  try {
    // Avoid cache issues during hot reloads in dev
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : JSON.stringify(err, null, 2);
    console.warn(`⚠️ Could not load module at ${filePath}: ${msg}`);
    return null;
  }
};

/* ------------------------ Utility: Directory recursion ----------------------- */
const scanDirectories = (baseDir: string): string[] => {
  const entries = fs.readdirSync(baseDir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry);
    const stat = fs.statSync(fullPath);

    if (entry === "index.ts" || entry === "index.js") continue;

    if (stat.isDirectory()) {
      files.push(...scanDirectories(fullPath));
    } else if (/\.(ts|js)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
};

/* -------------------------- Utility: Register module ------------------------- */
const registerModule = (filePath: string): void => {
  const mod = safeRequire(filePath);
  if (!mod) return;

  // --- Find Model ---
  const modelEntry = Object.entries(mod).find(([key, value]) => {
    return key.endsWith("Model") && typeof value === "function";
  });

  if (!modelEntry) return;

  const [exportedName, model] = modelEntry;
  const baseName = exportedName.replace(/Model$/, "");

  const entry: Partial<ModelRegistryEntry> = { model: model as Model<any> };

  // --- Find Schema ---
  const schemaEntry = Object.entries(mod).find(([key]) =>
    key.endsWith("Schema")
  );
  if (schemaEntry) entry.schema = schemaEntry[1] as Schema;

  // --- Find Interface ---
  const ifaceEntry = Object.entries(mod).find(([key]) => key.startsWith("I"));
  if (ifaceEntry) entry.interface = ifaceEntry[1];

  // --- Avoid double-registration ---
  if (!models[baseName]) {
    models[baseName] = entry as ModelRegistryEntry;
    console.log(`Registered model: ${baseName}`);
  }
};

/* ------------------------------ Main bootstrap ------------------------------ */
try {
  const allFiles = scanDirectories(modelsDir);
  allFiles.forEach(registerModule);
  console.log(` Loaded ${Object.keys(models).length} models successfully.`);
} catch (err) {
  console.error("Model registry bootstrap failed:", err);
}

/* -------------------------- Accessor helper methods ------------------------- */

/** Returns a model if found, or `null` if missing. */
export const getModel = <
  TDoc extends Document = any,
  TModel extends Model<TDoc> = Model<TDoc>
>(
  name: string
): TModel | null => (models[name]?.model as TModel) || null;

/**
 * Returns a model but **throws** if it doesn’t exist.
 * Makes controller imports runtime-safe and supports strong generics.
 */
export function requireModel<
  TDoc extends Document = any,
  TModel extends Model<TDoc> = Model<TDoc>
>(name: string): TModel {
  const model = getModel<TDoc, TModel>(name);
  if (!model) throw new Error(`Model '${name}' not found in registry.`);
  return model;
}

/** Returns schema if available. */
export const getSchema = (name: string): Schema | null =>
  models[name]?.schema || null;

/** Returns associated TypeScript interface if available. */
export const getInterface = (name: string): unknown => models[name]?.interface;
