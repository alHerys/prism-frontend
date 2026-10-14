// Independently authored synthetic review data, unrelated to confidential sources.
export async function addOEDetail(workbook) {
  const sheet = workbook.worksheets.add('Rincian OE');
  sheet.mergeCells('A1:Q1'); sheet.getRange('A1').values = [['Owner Estimate · Penggantian Jalur Pipa']];
  for (const range of ['A9:A11','B9:K11','L9:M11','N9:O9','P9:Q9','N10:N11','O10:O11','P10:P11','Q10:Q11']) sheet.mergeCells(range);
  for (const [cell,text] of Object.entries({A9:'NO.',B9:'URAIAN PEKERJAAN',L9:'VOLUME',N9:'HARGA SATUAN',P9:'JUMLAH HARGA',N10:'MATERIAL',O10:'JASA',P10:'MATERIAL',Q10:'JASA'})) sheet.getRange(cell).values=[[text]];
  sheet.getRange('A1:Q27').format.font={name:'Arial',size:11,color:'#17231E'};
  sheet.getRange('A:A').format.columnWidth=8; sheet.getRange('B:B').format.columnWidth=8;
  sheet.getRange('C:K').format.columnWidth=8;
  sheet.getRange('L:O').format.columnWidth=12; sheet.getRange('P:Q').format.columnWidth=22;
  sheet.getRange('A9:Q27').format.borders={preset:'all',style:'thin',color:'#6B756F'};
  sheet.getRange('A9:Q11').format={fill:'#C5D9F1',font:{name:'Arial',size:11,bold:true},rowHeight:20};
  sheet.getRange('A12:Q27').format.rowHeight=26;
  sheet.getRange('P12:Q27').setNumberFormat('"Rp "#,##0.00');
  const entries=[
    [12,'I','Pekerjaan Persiapan',null,null,'CATEGORY',0],
    [13,'1.1','Mobilisasi dan demobilisasi',null,'75000','ITEM',1],
    [14,'1.2','Pengadaan pipa baja 4 inci','200000',null,'ITEM',1],
    [15,'','Pipa termasuk sambungan dan perlindungan selama pengiriman.',null,null,'NOTE',2],
    [16,'1.3','Pemasangan pipa',null,'150000','ITEM',1],
    [17,'','Mencakup persiapan area, pemasangan dan pemeriksaan sambungan.',null,null,'NOTE',2],
    [18,'1.4','Katup gate 4 inci','850000',null,'ITEM',1],
    [19,'','SUBTOTAL','1050000','225000','SUBTOTAL',1],
    [20,'II','Pekerjaan Finishing',null,null,'CATEGORY',0],
    [21,'1.1','Pengujian sambungan',null,'0','ITEM',1],
    [22,'','SUBTOTAL','0','0','SUBTOTAL',1],
    [23,'','TOTAL SUB JUMLAH I-II','1050000','225000','TOTAL',0],
    [24,'','TOTAL SUB JUMLAH',null,'1275000','TOTAL',0],
    [25,'','TERBILANG: SATU JUTA DUA RATUS TUJUH PULUH LIMA RIBU RUPIAH',null,null,'NOTE',0],
  ];
  const rows=[]; let parent; let numbered;
  for (const [r,no,description,material,services,kind,level] of entries) {
    const descriptionCell=level===2?'C':'B';
    if(no) sheet.getRange(`A${r}`).values=[[no]];
    if(level===2) sheet.getRange(`B${r}`).values=[['-']];
    sheet.getRange(`${descriptionCell}${r}`).values=[[description]];
    sheet.mergeCells(`${descriptionCell}${r}:K${r}`);
    if(material!==null) sheet.getRange(`P${r}`).values=[[Number(material)]];
    if(services!==null) sheet.getRange(`Q${r}`).values=[[Number(services)]];
    if(kind==='CATEGORY') sheet.getRange(`A${r}:Q${r}`).format={fill:'#E2EFDA',font:{name:'Arial',bold:true}};
    if(kind==='SUBTOTAL') sheet.getRange(`A${r}:Q${r}`).format={fill:'#FCE4D6',font:{name:'Arial',bold:true}};
    if(kind==='TOTAL') sheet.getRange(`A${r}:Q${r}`).format.font={name:'Arial',bold:true};
    const id=`Rincian OE:r${r}`;
    const scope=kind==='NOTE'&&level===0?'NONE':kind==='TOTAL'&&material===null?'COMBINED':'SPLIT';
    const amount=(value,column)=>({state:value===null?'BLANK':'VALUE',value,cell:`${column}${r}`});
    rows.push({
      id, sourceRow: r,
      ...(level > 0 ? { parentId: kind === 'SUBTOTAL' ? parent : level === 2 ? numbered : parent } : {}),
      level, number: no,
      ...(no ? { numberSource: { cell: `A${r}`, position: 'NO' } } : {}),
      ...(level === 2 ? { bullet: { value: '-', cell: `B${r}` } } : {}),
      description, descriptionCells: [`${descriptionCell}${r}`], descriptionUnavailable: false,
      kind, scope, material: amount(material, 'P'), services: amount(services, 'Q'),
      ...(scope === 'COMBINED' ? { combined: amount(services, 'Q') } : {}),
    });
    if(kind==='CATEGORY')parent=id;
    if(no&&kind==='ITEM')numbered=id;
  }
  return {id:'Rincian OE',name:'Rincian OE',rows,warnings:[]};
}
