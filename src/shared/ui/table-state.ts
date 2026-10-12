export type TableValue = string | number | null | undefined;
export interface TableColumn<T> {
  label: string;
  value?: (row: T) => TableValue;
  type?: 'decimal';
  filter?: (row: T) => string;
  className?: string;
}

// Presentation comparison only: never round money through floating-point numbers.
export function compareTableValues(a: TableValue, b: TableValue, type?: 'decimal') {
  if (a == null || a === '') return b == null || b === '' ? 0 : 1;
  if (b == null || b === '') return -1;
  if (type === 'decimal') {
    const parse = (value: TableValue) => {
      const text = String(value).trim();
      if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return undefined;
      const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
      const integer = whole.replace(/^0+/, '') || '0';
      const decimal = fraction.replace(/0+$/, '');
      return { integer, decimal, negative: text.startsWith('-') && (integer !== '0' || decimal !== '') };
    };
    const left = parse(a), right = parse(b);
    if (left && right) {
      if (left.negative !== right.negative) return left.negative ? -1 : 1;
      const length = Math.max(left.decimal.length, right.decimal.length);
      const order = left.integer.length - right.integer.length
        || left.integer.localeCompare(right.integer)
        || left.decimal.padEnd(length, '0').localeCompare(right.decimal.padEnd(length, '0'));
      return left.negative ? -order : order;
    }
  }
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' });
}

export function tableRows<T>(rows: readonly T[], columns: readonly TableColumn<T>[], query: string, filters: Record<number, string>, sort: number | undefined, ascending: boolean) {
  const text = query.trim().toLocaleLowerCase('id');
  const shown = rows.map((row, index) => ({ row, index })).filter(({ row }) =>
    (!text || columns.some(column => `${column.value?.(row) ?? ''} ${column.filter?.(row) ?? ''}`.toLocaleLowerCase('id').includes(text)))
    && columns.every((column, index) => !filters[index] || column.filter?.(row) === filters[index]),
  );
  const column = sort === undefined ? undefined : columns[sort];
  if (column?.value) shown.sort((a, b) => compareTableValues(column.value!(a.row), column.value!(b.row), column.type) * (ascending ? 1 : -1) || a.index - b.index);
  return shown;
}
