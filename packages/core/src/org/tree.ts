import type { Entity, EntityId } from '@stratus/schema';

export interface EntityNode extends Entity {
  children: EntityNode[];
}

export function buildEntityTree(entities: Entity[], architectureId: string): EntityNode[] {
  const scoped = entities.filter((e) => e.architectureId === architectureId);
  const byId = new Map<EntityId, EntityNode>();
  for (const e of scoped) {
    byId.set(e.id, { ...e, children: [] });
  }
  const roots: EntityNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (nodes: EntityNode[]) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export function flattenTree(nodes: EntityNode[]): EntityNode[] {
  const out: EntityNode[] = [];
  const walk = (n: EntityNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

/** Depth-first post-order: children before parent (merge order). */
export function postOrder(nodes: EntityNode[]): EntityNode[] {
  const out: EntityNode[] = [];
  const walk = (n: EntityNode) => {
    n.children.forEach(walk);
    out.push(n);
  };
  nodes.forEach(walk);
  return out;
}

export function findEntityByCode(entities: Entity[], code: string): Entity | undefined {
  return entities.find((e) => e.code === code);
}

export function cumulativeOwnership(node: EntityNode): number {
  let pct = node.ownershipPct;
  // ownership is relative to parent; product of path is not tracked here without parent links
  // For MVP, ownershipPct on each node is "parent's stake in this entity".
  return pct;
}
