import { Command } from 'commander';
import { readdir, readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { KnowledgeCompiler, createDefaultConfig } from '@aether/core';
import type { SourceDocument } from '@aether/core';

export const compileCommand = new Command('compile')
  .description('Compile knowledge sources from a directory into a serialized Knowledge Graph')
  .argument('<source-dir>', 'directory containing markdown/KDL knowledge sources')
  .option('-o, --output <path>', 'path to write the compiled graph database', './.aether/graph.db')
  .option('--strict', 'fail compilation on any warning or error', false)
  .action(async (sourceDir, options) => {
    try {
      const resolvedDir = resolve(sourceDir);
      console.log(`Scanning directory: ${resolvedDir}`);

      const docs: SourceDocument[] = [];
      await scanDir(resolvedDir, docs);

      if (docs.length === 0) {
        console.warn(`No source files (.md) found in ${resolvedDir}`);
        process.exit(0);
      }

      console.log(`Found ${docs.length} source documents. Compiling...`);

      const config = createDefaultConfig({
        outputGraphPath: resolve(options.output),
        strict: options.strict,
      });

      const compiler = new KnowledgeCompiler(config);
      const unit = await compiler.compile(docs);

      // Print diagnostics
      for (const diag of unit.diagnostics) {
        const prefix = `[${diag.severity}] (${diag.code})`;
        if (diag.severity === 'Error') {
          console.error(`\x1b[31m${prefix} ${diag.message} at ${diag.file}:${diag.line}\x1b[0m`);
        } else {
          console.warn(`\x1b[33m${prefix} ${diag.message}\x1b[0m`);
        }
      }

      const errors = unit.diagnostics.filter((d) => d.severity === 'Error');
      if (errors.length > 0 && options.strict) {
        console.error(`\x1b[31mStrict mode enabled. Compilation failed with ${errors.length} errors.\x1b[0m`);
        process.exit(1);
      }

      console.log(`\x1b[32mSuccessfully compiled Knowledge Graph to: ${config.outputGraphPath}\x1b[0m`);
      console.log(`Stats:`);
      for (const res of unit.passResults) {
        console.log(`  - Pass ${res.passId} (${res.passName}): created ${res.stats.nodesCreated} nodes, ${res.stats.edgesCreated} edges in ${res.durationMs}ms`);
      }
    } catch (err: any) {
      console.error(`\x1b[31mCompilation failed: ${err.message}\x1b[0m`);
      process.exit(1);
    }
  });

async function scanDir(dir: string, docs: SourceDocument[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanDir(fullPath, docs);
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.kdl'))) {
      const content = await readFile(fullPath, 'utf8');
      const fileStats = await stat(fullPath);
      const isMd = entry.name.endsWith('.md');
      docs.push({
        id: `doc:${entry.name.replace(/\.(md|kdl)$/, '').toLowerCase()}`,
        path: fullPath,
        content,
        format: isMd ? 'markdown' : 'kdl',
        lastModified: fileStats.mtime.toISOString(),
      });
    }
  }
}
