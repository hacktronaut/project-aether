export interface KdlSection {
  type: string;
  name: string;
  properties: Record<string, string>;
}

/**
 * Parses a subset of the Knowledge Definition Language (.kdl) into simple AST structures.
 * 
 * Example KDL:
 * Rule "JWT Authentication" {
 *   Scope "Backend, Security"
 *   Priority "Mandatory"
 *   Directive "All authentication endpoints must use JWT."
 * }
 */
export function parseKdl(content: string): KdlSection[] {
  const sections: KdlSection[] = [];
  
  // Basic regex to match top level blocks: Type "Name" { ... }
  const blockRegex = /([A-Za-z]+)\s+"([^"]+)"\s*\{([^}]*)\}/g;
  
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    const type = match[1] || '';
    const name = match[2] || '';
    const body = match[3] || '';

    const properties: Record<string, string> = {};
    
    // Parse properties inside the block: Key "Value"
    const propRegex = /([A-Za-z]+)\s+"([^"]+)"/g;
    let propMatch;
    while ((propMatch = propRegex.exec(body)) !== null) {
      properties[(propMatch[1] || '').toLowerCase()] = propMatch[2] || '';
    }
    
    sections.push({ type, name, properties });
  }

  return sections;
}
