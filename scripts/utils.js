import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

import ts from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';
import cjs from '@rollup/plugin-commonjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = path.resolve(__dirname, '../packages');
const distPath = path.resolve(__dirname, '../dist/node_modules');

export const resolvePkgPath = (pkgName, isDist = false) => {
  const resolvedPath = path.resolve(isDist ? distPath : pkgPath, pkgName);
  return resolvedPath;
};

export const getPackageJson = (pkgName) => {
  const pkgJsonPath = path.resolve(resolvePkgPath(pkgName), 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  return pkgJson;
};

export function getBaseRollupPlugins({
  alias = {
    __LOG__: false,
    preventAssignment: true
  },
  typescript = {}
} = {}) {
  return [replace(alias), cjs(), ts(typescript)];
}
