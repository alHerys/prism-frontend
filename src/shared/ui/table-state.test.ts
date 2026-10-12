import { expect, it } from 'vitest';
import { compareTableValues, tableRows } from './table-state';
import type { TableColumn } from './table-state';
it('orders full precision decimals, equivalent representations and missing values', () => {
  expect(compareTableValues('9007199254740993.000000000000000001', '9007199254740993.000000000000000002', 'decimal')).toBeLessThan(0);
  expect(compareTableValues('999.99', '1000', 'decimal')).toBeLessThan(0);
  expect(compareTableValues('.5', '000.5000', 'decimal')).toBe(0);
  expect(compareTableValues('-0.001', '-0.0001', 'decimal')).toBeLessThan(0);
  expect(compareTableValues(undefined, '1', 'decimal')).toBeGreaterThan(0);
});
it('combines search with categorical filters without mutating rows or losing original edit indexes', () => {
  const rows = Object.freeze([{ id: 'a', price: '10', category: 'Material' }, { id: 'b', price: '2', category: 'Jasa' }, { id: 'c', price: '2.00', category: 'Jasa' }]);
  const columns: TableColumn<(typeof rows)[number]>[] = [{ label: 'Harga', value: row => row.price, type: 'decimal' }, { label: 'Kategori', value: row => row.category, filter: row => row.category }];
  expect(tableRows(rows, columns, '', {}, 0, true).map(row => row.index)).toEqual([1,2,0]);
  expect(tableRows(rows, columns, '2', { 1: 'Jasa' }, 0, false).map(row => row.row.id)).toEqual(['b','c']);
  expect(tableRows(rows, columns, '10', { 1: 'Jasa' }, undefined, true)).toEqual([]);
  expect(rows.map(row => row.id)).toEqual(['a','b','c']);
});
