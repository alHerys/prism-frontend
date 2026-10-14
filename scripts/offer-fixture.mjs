// Independently authored synthetic detail; the legacy unit-price sheet stays intact.
export function addOfferDetail(workbook) {
  const sheet = workbook.worksheets.add('Rincian Penawaran');
  for (const range of ['A9:A10', 'B9:K10', 'L9:M10', 'N9:O9', 'P9:Q9']) sheet.mergeCells(range);
  const headers = { A9: 'NO.', B9: 'URAIAN PEKERJAAN', L9: 'VOLUME', N9: 'HARGA SATUAN', P9: 'JUMLAH HARGA', N10: 'MATERIAL', O10: 'JASA', P10: 'MATERIAL', Q10: 'JASA' };
  for (const [cell, text] of Object.entries(headers)) sheet.getRange(cell).values = [[text]];
  sheet.getRange('A9:Q28').format.font = { name: 'Arial', size: 11 };
  sheet.getRange('A9:Q28').format.borders = { preset: 'all', style: 'dotted', color: '#647269' };
  sheet.getRange('A9:Q10').format = { fill: '#99DFF3', font: { name: 'Arial', bold: true }, rowHeight: 22 };
  sheet.getRange('A:A').format.columnWidth = 8;
  sheet.getRange('B:B').format.columnWidth = 12;
  sheet.getRange('C:K').format.columnWidth = 8;
  sheet.getRange('L:O').format.columnWidth = 12;
  sheet.getRange('P:Q').format.columnWidth = 22;
  sheet.getRange('P11:Q27').setNumberFormat('#,##0;(#,##0);"-"');
  const rows = [
    [11, 'I', '', 'Pekerjaan Persiapan', null, null, 'category'],
    [12, '1.1', '', 'Mobilisasi dan demobilisasi', null, 55000, 'job'],
    [13, '1.2', '', 'Pengadaan pipa baja 4 inci', 250000, null, 'job'],
    [14, '', '-', 'Pipa termasuk sambungan dan perlindungan selama pengiriman.', null, null],
    [15, '', '1.2.1', 'Pemeriksaan spesifikasi material', 0, null],
    [16, '1.3', '', 'Pemasangan pipa', null, 110000, 'job'],
    [17, '', '-', 'Persiapan area dan pemeriksaan sambungan.', null, null],
    [18, '1.4', '', 'Katup gate 4 inci', 680000, null, 'job'],
    [19, '', '', '', null, null],
    [20, '', '', 'SUBTOTAL', 930000, 165000, 'subtotal'],
    [21, 'II', '', 'Pekerjaan Finishing', null, null, 'category'],
    [22, 'A', '', 'Pengujian dan serah terima', null, null, 'subcategory'],
    [23, '2.1', '', 'Pengujian sambungan', null, 0, 'job'],
    [24, '', '', 'SUBTOTAL', 0, 0, 'subtotal'],
    [25, '', '', 'TOTAL SUB JUMLAH I-II', 930000, 165000, 'total'],
    [26, '', '', 'TOTAL SUB JUMLAH', null, 1095000, 'total'],
    [27, '', '', 'TERBILANG: SATU JUTA SEMBILAN PULUH LIMA RIBU RUPIAH', null, null, 'total'],
  ];
  for (const [r, no, marker, description, material, services, kind] of rows) {
    if (no) sheet.getRange(`A${r}`).values = [[no]];
    if (marker) sheet.getRange(`B${r}`).values = [[marker]];
    if (description) sheet.getRange(`${marker ? 'C' : 'B'}${r}`).values = [[description]];
    if (material !== null) sheet.getRange(`P${r}`).values = [[material]];
    if (services !== null) sheet.getRange(`Q${r}`).values = [[services]];
    const fill = { category: '#D1D1D1', subcategory: '#C1EFCB', subtotal: '#FFFF00' }[kind];
    if (fill) sheet.getRange(`A${r}:Q${r}`).format.fill = fill;
    if (kind) sheet.getRange(`A${r}:C${r}`).format.font = { name: 'Arial', bold: true };
    if (kind === 'category') sheet.getRange(`B${r}`).format.font = { name: 'Arial', bold: true, underline: 'single' };
    if (kind === 'subtotal' || kind === 'total') sheet.getRange(`P${r}:Q${r}`).format.font = { name: 'Arial', bold: true };
  }
  sheet.getRange('L28').values = [['Dibuat oleh']];
}
