import {build} from 'esbuild';
await build({entryPoints:['scripts/native-entry.mjs'],outfile:'dist/native-bridge.mjs',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
console.log('Native share/filesystem bridge bundled.');
