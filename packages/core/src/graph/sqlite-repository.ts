import { createClient, type Client } from '@libsql/client';
import type { EnterpriseKnowledgeGraph } from '../ontology/types/graph.js';
import { InMemoryGraph } from './in-memory-graph.js';
import type { KnowledgeNode } from '../ontology/types/nodes/base.js';
import type { Edge } from '../ontology/types/edge.js';

export class SQLiteGraphRepository {
  private client: Client;

  constructor(dbPath: string) {
    this.client = createClient({
      url: `file:${dbPath}`
    });
  }

  async init(): Promise<void> {
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `);
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS edges (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `);
  }

  async saveGraph(graph: EnterpriseKnowledgeGraph): Promise<void> {
    await this.init();
    
    const statements = [];
    
    statements.push({ sql: 'DELETE FROM edges', args: [] });
    statements.push({ sql: 'DELETE FROM nodes', args: [] });

    for (const node of graph.getNodes()) {
      statements.push({
        sql: 'INSERT INTO nodes (id, type, data) VALUES (?, ?, ?)',
        args: [node.id, node.type, JSON.stringify(node)]
      });
    }

    for (const edge of graph.getEdges()) {
      statements.push({
        sql: 'INSERT INTO edges (id, type, source, target, data) VALUES (?, ?, ?, ?, ?)',
        args: [edge.id, edge.type, edge.source, edge.target, JSON.stringify(edge)]
      });
    }

    await this.client.batch(statements, 'write');
  }

  async loadGraph(graphId: string = 'sqlite-graph'): Promise<EnterpriseKnowledgeGraph> {
    await this.init();
    
    const graph = new InMemoryGraph(graphId);
    
    const nodesResult = await this.client.execute('SELECT data FROM nodes');
    for (const row of nodesResult.rows) {
      const node = JSON.parse(row[0] as string) as KnowledgeNode;
      graph.addNode(node);
    }

    const edgesResult = await this.client.execute('SELECT data FROM edges');
    for (const row of edgesResult.rows) {
      const edge = JSON.parse(row[0] as string) as Edge;
      graph.addEdge(edge);
    }

    return graph;
  }

  close(): void {
    this.client.close();
  }
}
