import path from 'path';

const pkgPath = path.resolve(__dirname, '../packages');
const distPath = path.resolve(__dirname, '../dist');

export const resolvePkgPath = (pkgName: string, isDist = false) => {
  const resolvedPath = path.resolve(isDist ? distPath : pkgPath, pkgName);
  console.log('resolvePkgPath', resolvedPath);
  return resolvedPath;
};
