import { ArrowDown } from '@phosphor-icons/react/dist/csr/ArrowDown';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { FunnelSimple } from '@phosphor-icons/react/dist/csr/FunnelSimple';
import { X } from '@phosphor-icons/react/dist/csr/X';
import * as Dialog from '@radix-ui/react-dialog';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SelectField } from './select-field';
import { tableRows } from './table-state';
import type { TableColumn } from './table-state';
import './data-table.css';

export function DataTable<T>({ rows, columns, children, label, className = '', empty }: {
  rows: readonly T[]; columns: readonly TableColumn<T>[]; label: string;
  children: (row: T, originalIndex: number) => ReactNode; className?: string; empty?: ReactNode;
}) {
  const [sort, setSort] = useState<number>();
  const [ascending, setAscending] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState('10');
  const [position, setPosition] = useState({ top: 0, left: 0, width: 280, maxHeight: 400 });
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const shown = tableRows(rows, columns, query, filters, sort, ascending);
  const pages = Math.max(1, Math.ceil(shown.length / Number(size)));
  const current = Math.min(page, pages);
  const visible = shown.slice((current - 1) * Number(size), current * Number(size));
  const filtered = !!query || Object.values(filters).some(Boolean);
  const reset = () => { setQuery(''); setFilters({}); setSort(undefined); setAscending(true); setPage(1); };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(280, innerWidth - 32);
      const below = innerHeight - rect.bottom - 16;
      const top = below < 400 && rect.top > below ? Math.max(16, rect.top - 408) : rect.bottom + 8;
      setPosition({ top, left: Math.max(16, Math.min(rect.right - width, innerWidth - width - 16)), width, maxHeight: Math.max(64, innerHeight - top - 16) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);
  const menu = <Dialog.Root open={open} onOpenChange={setOpen} modal={false}>
    <Dialog.Trigger asChild><button ref={trigger} type="button" className="data-table-filter-trigger" data-filtered={filtered} aria-label={`Filter dan urutkan ${label}`}><FunnelSimple size={17} aria-hidden="true" /><span>Filter</span></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Content className="data-table-filter-menu" style={position}>
      <div className="data-table-filter-heading"><Dialog.Title>Filter dan urutkan {label}</Dialog.Title><Dialog.Close asChild><button type="button" aria-label={`Tutup filter ${label}`}><X size={17} aria-hidden="true" /></button></Dialog.Close></div>
      <Dialog.Description className="sr-only">Pilihan langsung diterapkan pada tampilan baris tabel.</Dialog.Description>
      <fieldset><legend>Urutkan berdasarkan</legend>
        <label><input type="radio" name={`${id}-sort`} checked={sort === undefined} onChange={() => { setSort(undefined); setPage(1); }} />Urutan awal</label>
        {columns.map((column, index) => column.value && <label key={index}><input type="radio" name={`${id}-sort`} checked={sort === index} onChange={() => { setSort(index); setPage(1); }} />{column.label}</label>)}
      </fieldset>
      <fieldset><legend>Arah urutan</legend>{[true, false].map(value => <label key={String(value)}><input type="radio" name={`${id}-direction`} checked={ascending === value} disabled={sort === undefined} onChange={() => { setAscending(value); setPage(1); }} />{value ? 'Menaik' : 'Menurun'}</label>)}</fieldset>
      <div className="data-table-query"><label htmlFor={`${id}-query`}>Cari di tabel</label><input id={`${id}-query`} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></div>
      {columns.map((column, index) => column.filter && <fieldset key={index}><legend>{column.label}</legend><label><input type="radio" name={`${id}-filter-${index}`} checked={!filters[index]} onChange={() => { setFilters(old => ({ ...old, [index]: '' })); setPage(1); }} />Semua</label>{[...new Set(rows.map(row => column.filter!(row)))].filter(Boolean).sort().map(option => <label key={option}><input type="radio" name={`${id}-filter-${index}`} checked={filters[index] === option} onChange={() => { setFilters(old => ({ ...old, [index]: option })); setPage(1); }} />{option}</label>)}</fieldset>)}
      <p className="data-table-count" role="status">{shown.length} dari {rows.length} baris</p><button type="button" className="btn small" onClick={reset}>Reset tabel</button>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
  return <div className="data-table">
    <table className={`table ${className}`} aria-label={label}><thead><tr>{columns.map((column, index) => <th key={index} scope="col" className={column.className} aria-sort={sort === index ? ascending ? 'ascending' : 'descending' : undefined}><div className="data-table-heading">
      {column.value ? <button type="button" className="table-sort" data-active={sort === index} onClick={() => { setAscending(sort === index ? !ascending : true); setSort(index); setPage(1); }}>{column.label}{sort === index && (ascending ? <ArrowUp size={15} aria-hidden="true" /> : <ArrowDown size={15} aria-hidden="true" />)}</button> : <span>{column.label}</span>}
      {index === columns.length - 1 && menu}
    </div></th>)}</tr></thead><tbody>{visible.map(({ row, index }) => children(row, index))}{!visible.length && <tr><td colSpan={columns.length}>{!rows.length && empty ? empty : <div className="data-table-empty">{rows.length ? 'Tidak ada baris sesuai filter.' : 'Belum ada baris.'}{filtered && <button type="button" className="inline-link" onClick={reset}>Reset tabel</button>}</div>}</td></tr>}</tbody></table>
    {rows.length > 10 && <div className="table-pagination"><label className="page-size">Tampilkan <SelectField ariaLabel={`Jumlah baris ${label} per halaman`} value={size} onValueChange={value => { setSize(value); setPage(1); }} items={['10','25','50'].map(value => ({ value, label: value }))} /></label><div className="pagination-controls"><button type="button" className="btn small" disabled={current === 1} onClick={() => setPage(current - 1)}><CaretLeft /> Sebelumnya</button><span className="page-number" aria-label={`Halaman ${current} dari ${pages}`}>{current}</span><button type="button" className="btn small" disabled={current === pages} onClick={() => setPage(current + 1)}>Selanjutnya <CaretRight /></button></div></div>}
  </div>;
}
