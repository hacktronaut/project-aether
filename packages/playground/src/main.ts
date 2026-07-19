import './style.css';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';

let graphData: any = null;
let network: Network | null = null;
let nodesDataSet: DataSet<any> | null = null;
let edgesDataSet: DataSet<any> | null = null;

const outputEl = document.getElementById('output') as HTMLDivElement;
const missionForm = document.getElementById('mission-form') as HTMLFormElement;
const missionInput = document.getElementById('mission-input') as HTMLInputElement;

function log(message: string, type: 'system' | 'mission' | 'result' | 'json' = 'system') {
  const div = document.createElement('div');
  div.className = `log ${type}`;
  div.textContent = message;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

async function loadGraph() {
  try {
    log('Fetching pre-compiled Knowledge Graph (graph.json)...');
    const res = await fetch('graph.json'); // Assumes graph.json is in public folder
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    graphData = await res.json();
    log(`Graph loaded successfully. Nodes: ${Object.keys(graphData.nodes).length}, Edges: ${graphData.edges.length}`);
    
    renderGraph();
  } catch (err: any) {
    log(`Failed to load graph: ${err.message}`, 'system');
  }
}

function renderGraph() {
  const container = document.getElementById('network-container');
  if (!container || !graphData) return;

  const visNodes = Object.values(graphData.nodes).map((n: any) => ({
    id: n.id,
    label: n.name,
    title: `[${n.type}]\nPriority: ${n.priority}\nScope: ${n.scope.join(',')}`,
    color: {
      background: '#161b22',
      border: '#30363d',
      highlight: { background: '#58a6ff', border: '#58a6ff' }
    },
    font: { color: '#c9d1d9' },
    shape: 'box'
  }));

  const visEdges = graphData.edges.map((e: any) => ({
    id: e.id,
    from: e.source,
    to: e.target,
    label: e.type,
    font: { color: '#8b949e', size: 10, align: 'middle' },
    color: { color: '#30363d', highlight: '#58a6ff' },
    arrows: 'to'
  }));

  nodesDataSet = new DataSet(visNodes);
  edgesDataSet = new DataSet(visEdges);

  const data = { nodes: nodesDataSet, edges: edgesDataSet };
  const options = {
    physics: {
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.3,
        springLength: 150
      }
    }
  };

  network = new Network(container, data, options);
}

// Minimal Browser implementation of AetherRuntime
function executeMission(missionStr: string) {
  log(`❯ aether run --mission "${missionStr}"`, 'mission');
  
  if (!graphData) {
    log('Graph not loaded.', 'system');
    return;
  }

  // 1. Resolve Anchor Nodes
  const lowerMission = missionStr.toLowerCase();
  const anchorNodes: string[] = [];
  
  const allNodes = Object.values(graphData.nodes) as any[];
  for (const node of allNodes) {
    const scopes = node.rawProperties?.scope?.toLowerCase().split(',').map((s: string) => s.trim()) || [];
    const nameWords = node.name.toLowerCase().split(' ');
    
    if (
      lowerMission.includes(node.name.toLowerCase()) || 
      scopes.some((scope: string) => scope.length > 2 && lowerMission.includes(scope)) ||
      nameWords.some((word: string) => word.length > 3 && lowerMission.includes(word))
    ) {
      anchorNodes.push(node.id);
    }
  }

  // Add global rules
  for (const node of allNodes) {
    const scopes = node.rawProperties?.scope?.toLowerCase().split(',').map((s: string) => s.trim()) || [];
    if (scopes.includes('global')) {
      if (!anchorNodes.includes(node.id)) anchorNodes.push(node.id);
    }
  }

  if (anchorNodes.length === 0) {
    log('No relevant knowledge found for this mission context.', 'result');
    return;
  }

  // 2. BFS Traversal
  const visited = new Set<string>();
  const queue = [...anchorNodes];
  anchorNodes.forEach(id => visited.add(id));

  const edgeList = graphData.edges as any[];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const outgoing = edgeList.filter(e => e.source === current);
    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  // Highlight active nodes in graph
  if (nodesDataSet && network) {
    const allIds = nodesDataSet.getIds();
    const updates = allIds.map(id => {
      const isActive = visited.has(id as string);
      return {
        id,
        color: {
          background: isActive ? '#0d419d' : '#161b22',
          border: isActive ? '#58a6ff' : '#30363d',
        },
        font: {
          color: isActive ? '#ffffff' : '#8b949e'
        }
      };
    });
    nodesDataSet.update(updates);
    
    // Fit view to active nodes
    network.fit({ nodes: Array.from(visited), animation: true });
  }

  // 3. Assemble mock CEC
  const cecConstraints = Array.from(visited).map(id => {
    const node = allNodes.find((n: any) => n.id === id);
    if (!node) return null;
    return {
      id: node.id,
      type: node.type,
      directive: node.name + (node.description ? ': ' + node.description : ''),
      priority: node.priority
    };
  }).filter(Boolean);

  const cec = {
    header: { version: '0.1.0', compressionRatio: visited.size / allNodes.length },
    mission: { objective: missionStr },
    constraints: cecConstraints
  };

  log(`Compiled Execution Context (CEC) Generated [Compression Ratio: ${(cec.header.compressionRatio * 100).toFixed(1)}%]`, 'result');
  log(JSON.stringify(cec, null, 2), 'json');
}

missionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = missionInput.value.trim();
  if (val) {
    executeMission(val);
    missionInput.value = '';
  }
});

// Init
loadGraph();
