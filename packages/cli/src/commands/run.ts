import { Command } from 'commander';
import { resolve } from 'path';
import { AetherRuntime } from '@aether/core';
import { OpenAIAdapter } from '@aether/adapters';

export const runCommand = new Command('run')
  .description('Run a mission against the compiled Knowledge Graph to produce a CEC and model payload')
  .requiredOption('--mission <text>', 'the natural language mission or SDD task objective')
  .option('-g, --graph <path>', 'path to the compiled graph JSON', './.aether/graph.json')
  .option('-m, --model <name>', 'target model name', 'gpt-4o')
  .option('-b, --budget <count>', 'context compression budget (max non-mandatory nodes)', '10')
  .action(async (options) => {
    try {
      const graphPath = resolve(options.graph);
      console.log(`Loading graph: ${graphPath}`);

      const runtime = new AetherRuntime({ graphPath });
      console.log(`Resolving mission objective: "${options.mission}"`);

      const cec = await runtime.compileMission({
        raw: options.mission,
        budget: parseInt(options.budget, 10),
      });

      console.log(`\n\x1b[32mSuccessfully assembled CEC [${cec.header.id}]\x1b[0m`);
      console.log(`Stats:`);
      console.log(`  - Compression ratio: ${cec.header.compressionRatio.toFixed(2)}x`);
      console.log(`  - Selected constraints: ${cec.constraints.length}`);
      console.log(`  - Selected patterns: ${cec.patterns.length}`);
      console.log(`  - Selected dependencies: ${cec.dependencies.length}`);
      console.log(`  - Quality gates: ${cec.qualityGates.length}`);
      console.log(`  - Expected outputs: ${cec.expectedOutputs.length}`);

      console.log(`\nAdapting to target: ${options.model}...`);
      const adapter = new OpenAIAdapter();
      const envelope = await adapter.render(cec, { model: options.model });

      console.log(`\n\x1b[34m=== SYSTEM PROMPT ===\x1b[0m`);
      console.log(envelope.systemPrompt);
      console.log(`\x1b[34m=====================\x1b[0m`);

      console.log(`\n\x1b[34m=== USER PROMPT ===\x1b[0m`);
      console.log(envelope.userPrompt);
      console.log(`\x1b[34m===================\x1b[0m`);

      console.log(`\nMetadata:`);
      console.log(`  - CEC digest: ${envelope.metadata.cecId}`);
      console.log(`  - Target model: ${envelope.metadata.model}`);
      console.log(`  - Estimated prompt tokens: ${envelope.metadata.estimatedTokens}`);
    } catch (err: any) {
      console.error(`\x1b[31mExecution failed: ${err.message}\x1b[0m`);
      process.exit(1);
    }
  });
