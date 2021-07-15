#!/usr/bin/env node

/* eslint-disable import/no-commonjs, no-console */

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

console.log(`Compiling definitions...`);

shell.exec(`tsc -p tsconfig.declaration.json --outDir es/`);

// replace block ts-ignore comments with line ones to support TS < 3.9
shell.sed(
  '-i',
  /\/\*\* @ts-ignore \*\//g,
  '// @ts-ignore',
  path.join(__dirname, '../../es/**/*.d.ts')
);

console.log();
console.log(`Validating definitions...`);

const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');

const publicExports = [
  // 'components' -> does not contains index.d.ts yet
  'connectors',
  // 'lib', -> Api extractor "import * as ___ from ___;" is not supported yet for local files
  // 'middleware',
  'helpers',
  'types',
  'widgets', //  -> It does not compile as WidgetFactory is not imported in all files
  'lib/routers',
];

fs.writeFileSync(
  path.join(__dirname, '../../', 'es/index.d.ts'),
  [
    `export { default } from './index.es';`,
    ...publicExports
      .map(publicExport => `./${publicExport}`)
      .map(exportedFile => {
        return `export * from '${exportedFile}';`;
      }),
  ].join('\r\n')
);

const extractorConfig = ExtractorConfig.loadFileAndPrepare(
  path.resolve(path.join(__dirname, '../../', 'api-extractor.json'))
);

const result = Extractor.invoke(extractorConfig, {
  localBuild: true,
  showVerboseMessages: true,
});

if (!result.succeeded) {
  console.error(
    `API Extractor completed with ${result.errorCount} errors` +
      ` and ${result.warningCount} warnings`
  );

  // eslint-disable-next-line no-process-exit
  process.exit(1);
}
