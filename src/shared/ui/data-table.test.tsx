import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DataTable } from './data-table';
afterEach(cleanup);
it('isolates table controls, preserves row identity and supports reset after an empty search', () => {
  const rows = [{ id: 'large', price: '12', kind: 'Material' }, { id: 'small', price: '2', kind: 'Jasa' }];
  const columns = [{ label: 'Harga', value: (row: (typeof rows)[number]) => row.price, type: 'decimal' as const }, { label: 'Jenis', value: (row: (typeof rows)[number]) => row.kind, filter: (row: (typeof rows)[number]) => row.kind }];
  render(<><DataTable rows={rows} columns={columns} label="Satu">{(row, index) => <tr key={row.id}><td>{row.price}</td><td>{row.id}:{index}</td></tr>}</DataTable><DataTable rows={rows} columns={columns} label="Dua">{row => <tr key={row.id}><td>{row.price}</td><td>{row.id}</td></tr>}</DataTable></>);
  const first = screen.getByRole('table', { name: 'Satu' });
  fireEvent.click(within(first).getByRole('button', { name: 'Harga' }));
  expect(within(first).getAllByRole('row')[1]).toHaveTextContent('small:1');
  expect(within(screen.getByRole('table', { name: 'Dua' })).getAllByRole('row')[1]).toHaveTextContent('large');
  fireEvent.click(screen.getByRole('button', { name: 'Filter dan urutkan Satu' }));
  fireEvent.change(screen.getByLabelText('Cari di tabel'), { target: { value: 'missing' } });
  expect(within(first).getByText('Tidak ada baris sesuai filter.')).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset tabel' }));
  expect(within(first).getAllByRole('row')[1]).toHaveTextContent('large:0');
});
it('pages a long collection and resets to the first page when sorting', () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({ id: index, count: index }));
  render(<DataTable rows={rows} columns={[{ label: 'Jumlah', value: row => row.count }]} label="Paginasi">{row => <tr key={row.id}><td>{row.count}</td></tr>}</DataTable>);
  expect(screen.getAllByRole('row')).toHaveLength(11);
  fireEvent.click(screen.getByRole('button', { name: 'Selanjutnya' }));
  expect(screen.getAllByRole('row')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Jumlah' }));
  expect(screen.getByLabelText('Halaman 1 dari 2')).toBeInTheDocument();
  expect(screen.getAllByRole('row')[1]).toHaveTextContent('0');
});

it('accepts external search, removes its menu input and returns to page one', () => {
  const rows = Array.from({ length: 12 }, (_, id) => ({ id, name: `item-${id}` }));
  const onQueryChange = vi.fn();
  const table = (query: string) => <DataTable rows={rows} columns={[{ label: 'Nama', value: row => row.name }]} label="Eksternal" search={{ query, onQueryChange }}>{row => <tr key={row.id}><td>{row.name}</td></tr>}</DataTable>;
  const { rerender } = render(table(''));
  fireEvent.click(screen.getByRole('button', { name: 'Selanjutnya' }));
  rerender(table('item-'));
  expect(screen.getByLabelText('Halaman 1 dari 2')).toBeInTheDocument();
  rerender(table('item-11'));
  expect(screen.getAllByRole('row')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Filter dan urutkan Eksternal' }));
  expect(screen.queryByLabelText('Cari di tabel')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reset tabel' }));
  expect(onQueryChange).toHaveBeenCalledWith('');
});
