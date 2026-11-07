// Writes public/runtime-config.js with the API base URL the browser app should call.
// Source: ZH_API_BASE_URL from the process environment, else from the repo-root .env file.
// Without a value the file sets an empty string and the app falls back to `${location.origin}/api`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VARIABLE = 'ZH_API_BASE_URL';
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(rootDir, '.env');
const outputFile = resolve(rootDir, 'public', 'runtime-config.js');

function parseEnv(content) {
  const values = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    const separator = line.indexOf('=');
    if (separator <= 0) {
      continue;
    }
    const key = line.slice(0, separator).trim().replace(/^export\s+/, '');
    let value = line.slice(separator + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length >= 2) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    values[key] = value;
  }
  return values;
}

function readConfiguredValue() {
  if (process.env[VARIABLE] !== undefined) {
    return { value: process.env[VARIABLE].trim(), source: 'environment' };
  }
  if (existsSync(envFile)) {
    const fromFile = parseEnv(readFileSync(envFile, 'utf8'))[VARIABLE];
    if (fromFile !== undefined) {
      return { value: fromFile.trim(), source: '.env' };
    }
  }
  return { value: '', source: 'none' };
}

function isAbsoluteHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const { value, source } = readConfiguredValue();

if (value.length > 0 && !isAbsoluteHttpUrl(value)) {
  console.error(`[runtime-config] ${VARIABLE} from ${source} must be an absolute http(s) URL; got "${value}".`);
  process.exit(1);
}

if (value.length === 0) {
  console.warn(`[runtime-config] ${VARIABLE} is not set; the app will call the API on its own origin (/api).`);
}

writeFileSync(outputFile, `window.__ZH_API_BASE_URL__ = ${JSON.stringify(value)};\n`, 'utf8');
console.log(`[runtime-config] wrote public/runtime-config.js (source: ${source}).`);
