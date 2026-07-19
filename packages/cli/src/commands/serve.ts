import { Command } from 'commander';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { KnowledgeCompiler, AetherRuntime, createDefaultConfig } from '@aether/core';
import { resolve } from 'path';

export const serveCommand = new Command('serve')
  .description('Start the Aether REST API server')
  .option('-p, --port <number>', 'port to listen on', '3000')
  .option('-g, --graph <path>', 'path to the compiled graph database', './.aether/graph.db')
  .action(async (options) => {
    const server = fastify({ logger: true });
    await server.register(cors);

    server.post('/compile', async (request, reply) => {
      const config = createDefaultConfig({
        outputGraphPath: resolve(options.graph),
        strict: false
      });
      const compiler = new KnowledgeCompiler(config);
      const docs = (request.body as any).documents || [];
      const unit = await compiler.compile(docs);
      return { success: true, diagnostics: unit.diagnostics, passResults: unit.passResults };
    });

    server.post('/mission', async (request, reply) => {
      const body = request.body as any;
      if (!body.mission) {
        return reply.status(400).send({ error: 'Missing mission in request body' });
      }

      const runtime = new AetherRuntime({ graphPath: resolve(options.graph) });
      const cec = await runtime.compileMission({
        raw: body.mission,
        scope: body.scope,
        budget: body.budget
      });

      return cec;
    });

    try {
      await server.listen({ port: parseInt(options.port), host: '0.0.0.0' });
      console.log(`Aether server listening on port ${options.port}`);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  });
