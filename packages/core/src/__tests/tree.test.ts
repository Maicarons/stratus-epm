import { describe, expect, it } from 'vitest';
import { buildEntityTree, postOrder, flattenTree } from '../org/tree.js';
import type { Entity } from '@stratus/schema';

const entities: Entity[] = [
  { id: '1', code: 'P', name: 'Parent', parentId: null, ownershipPct: 1, consolidateMethod: 'full', functionalCurrency: 'CNY', architectureId: 'a1', isConsolidationNode: true, activeFrom: '2020-01-01' },
  { id: '2', code: 'C1', name: 'Child1', parentId: '1', ownershipPct: 1, consolidateMethod: 'full', functionalCurrency: 'CNY', architectureId: 'a1', isConsolidationNode: false, activeFrom: '2020-01-01' },
  { id: '3', code: 'C2', name: 'Child2', parentId: '2', ownershipPct: 0.8, consolidateMethod: 'full', functionalCurrency: 'CNY', architectureId: 'a1', isConsolidationNode: false, activeFrom: '2020-01-01' },
];

describe('entity tree', () => {
  it('builds hierarchy', () => {
    const tree = buildEntityTree(entities, 'a1');
    expect(tree).toHaveLength(1);
    expect(tree[0].code).toBe('P');
    expect(tree[0].children[0].code).toBe('C1');
  });

  it('post-order children first', () => {
    const order = postOrder(buildEntityTree(entities, 'a1')).map((n) => n.code);
    expect(order[order.length - 1]).toBe('P');
    expect(order.indexOf('C2')).toBeLessThan(order.indexOf('C1'));
  });

  it('flatten length', () => {
    expect(flattenTree(buildEntityTree(entities, 'a1'))).toHaveLength(3);
  });
});
