/**
 * @aether/cli — Project Aether CLI
 *
 * Entry point for the `aether` binary.
 *
 * Commands:
 *   aether compile <source-dir>   Compile knowledge sources → Knowledge Graph
 *   aether run --mission "..."    Run a mission → CEC → model call
 *   aether inspect                Inspect compiled graph stats
 *   aether verify                 Verify a CEC against all 10 invariants
 *   aether cache <list|clear>     Manage the CEC cache
 *   aether serve                  Start the REST API server
 *   aether kdl validate <file>    Validate a KDL file
 */

import { Command } from 'commander';
import { compileCommand } from './commands/compile.js';
import { runCommand } from './commands/run.js';

const program = new Command();

program
  .name('aether')
  .description('Project Aether — The Knowledge Computing Platform')
  .version('0.1.0', '-v, --version', 'output the current version');

program.addCommand(compileCommand);
program.addCommand(runCommand);

program.parse();
