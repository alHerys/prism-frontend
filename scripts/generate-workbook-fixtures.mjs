// Source workbook builder; run with the bundled artifact-tool runtime.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const root = path.resolve(process.argv[2] || 'frontend');
const registryPath = path.join(root, 'src/infrastructure/local/fixtures/file-registry.json');
const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
const previews = '/private/tmp/prism-fixture-previews';
await fs.mkdir(previews, { recursive: true });
for (const descriptor of registry.filter(d => d.kind !== 'FORM_A5')) {
  const wb = Workbook.create();
  const sheet = wb.worksheets.add('Harga');
  const isOffer = descriptor.kind === 'OFFER';
  const columns = ['Kode', 'Uraian pekerjaan', 'Kategori', 'Satuan', isOffer ? 'Harga satuan material dan jasa' : 'Harga OE', 'Ringkasan total'];
  sheet.mergeCells('A1:F1');
  sheet.getRange('A1').values = [[descriptor.kind === 'HISTORICAL_OE' ? 'Owner Estimate · Pemeliharaan tangki · '+descriptor.period : (isOffer ? 'Penawaran · '+descriptor.vendorName : 'Owner Estimate · Fasilitas terminal')]];
  sheet.mergeCells('A2:F2');
  sheet.getRange('A2').values = [['Pengadaan: PRC-KAL-2026-001 | Fungsi: Operasi Terminal | Rupiah per satuan']];
  sheet.getRange('A4:F4').values = [columns];
  sheet.getRange(`A5:F${4+descriptor.rows.length}`).values = descriptor.rows.map(r => [r.id,r.description,r.category==='MATERIAL'?'Material':'Jasa',r.unit,Number(isOffer?r.offer:r.oe),isOffer ? Number(r.offer) : null]);
  sheet.getRange(`A1:F${4+descriptor.rows.length}`).format.font = {name:'Arial',size:11,color:'#1E293B'};
  sheet.getRange('A1:F1').format = {fill:'#006CB8',font:{name:'Arial',size:16,bold:true,color:'#FFFFFF'},rowHeight:34};
  sheet.getRange('A2:F2').format.rowHeight = 28;
  sheet.getRange('A4:F4').format = {fill:'#E8F1F8',font:{name:'Arial',bold:true,color:'#1E293B'},rowHeight:32};
  sheet.getRange('A:A').format.columnWidth = 18;
  sheet.getRange('B:B').format.columnWidth = 35;
  sheet.getRange('C:D').format.columnWidth = 16;
  sheet.getRange('E:E').format.columnWidth = 40;
  sheet.getRange('F:F').format.columnWidth = 23;
  sheet.getRange(`A5:F${4+descriptor.rows.length}`).format.rowHeight = 28;
  sheet.getRange(`E5:F${4+descriptor.rows.length}`).setNumberFormat('"Rp "#,##0');
  sheet.getRange(`A4:F${4+descriptor.rows.length}`).format.borders = {preset:'all',style:'thin',color:'#E2E8F0'};
  const preview = await wb.render({sheetName:'Harga',range:`A1:F${5+descriptor.rows.length}`,scale:1,format:'png'});
  await fs.writeFile(path.join(previews,descriptor.id+'.png'),new Uint8Array(await preview.arrayBuffer()));
  const xlsx = await SpreadsheetFile.exportXlsx(wb);
  await xlsx.save(path.join(root,'public/files',descriptor.name));
}
for (const d of registry) d.sha256 = createHash('sha256').update(await fs.readFile(path.join(root,'public',d.path))).digest('hex');
await fs.writeFile(registryPath,JSON.stringify(registry,null,2)+'\n');
console.log('Created 6 workbooks; all 8 source fingerprints registered.');
