import alias from '@rollup/plugin-alias';
import { getPackageJson, resolvePkgPath, getBaseRollupPlugins } from '../utils.js';
import path from 'path';

const { name, module, peerDependencies } = getPackageJson('react-dom');
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

export default [
  // react-dom
  {
    input: path.resolve(pkgPath, module),
    output: [
      {
        file: path.resolve(pkgDistPath, 'index.js'),
        name: 'ReactDOM',
        format: 'umd'
      },
      {
        file: path.resolve(pkgDistPath, 'client.js'),
        name: 'client',
        format: 'umd'
      }
    ],
    external: [...Object.keys(peerDependencies)],
    plugins: [
      ...getBaseRollupPlugins(),
      alias({
        entries: {
          HostConfig: `${pkgPath}/src/HostConfig.ts`
        }
      })
    ]
  },
  // react-test-utils
  {
    input: path.resolve(pkgPath, 'test-utils.ts'),
    output: [
      {
        file: path.resolve(pkgDistPath, 'test-utils.js'),
        name: 'testUtils',
        format: 'umd'
      }
    ],
    external: ['react-dom', 'react'],
    plugins: getBaseRollupPlugins()
  }
];
