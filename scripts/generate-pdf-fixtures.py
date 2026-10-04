"""Generate independent synthetic procurement source PDFs and fixture metadata.

Uses the bundled reportlab runtime; no originals or backend files are touched.
Run the workbook builder afterwards to finish hashes for all source assets.
"""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/files'
OUT.mkdir(parents=True, exist_ok=True)

vendors = [
    ('nusa', 'PT Nusa Teknik Mandiri', {'hpb':'1000000000','hpj':'300000000','knb':'25000000','tkdn_barang':'.4','tkdn_jasa':'.3'}),
    ('borneo', 'PT Borneo Teknik Nusantara', {'hpb':'1040000000','hpj':'320000000','knb':'18000000','tkdn_barang':'.5','tkdn_jasa':'.35'}),
]
labels = {'hpb':'Harga Penawaran Barang','hpj':'Harga Penawaran Jasa','knb':'Komponen Bukan Biaya','tkdn_barang':'TKDN Barang','tkdn_jasa':'TKDN Jasa'}
def display(key, value):
    if key.startswith('tkdn'): return str(int(float(value)*100)) + '%'
    return 'Rp ' + f'{int(value):,}'.replace(',', '.')

registry = []
for slug, vendor, values in vendors:
    filename = f'Form-A5-{slug.title()}.pdf'
    c = canvas.Canvas(str(OUT / filename), pagesize=A4, invariant=1)
    c.setTitle(f'Form A5 - {vendor}')
    c.setFillColor(HexColor('#006CB8')); c.rect(0, 760, 595, 82, fill=1, stroke=0)
    c.setFillColor(HexColor('#FFFFFF')); c.setFont('Helvetica-Bold', 21)
    c.drawString(42, 793, 'FORM A5')
    c.setFont('Helvetica', 10); c.drawString(42, 774, 'Komitmen Tingkat Komponen Dalam Negeri')
    c.setFillColor(HexColor('#1E293B')); c.setFont('Helvetica-Bold', 12)
    c.drawString(42, 717, vendor)
    c.setFont('Helvetica', 10)
    c.drawString(42, 693, 'Pemeliharaan jalur pipa dan fasilitas terminal')
    c.drawString(42, 674, 'Nomor pengadaan: PRC-KAL-2026-001 | Tanggal: 1 Oktober 2026')
    y = 618; sources = []
    for key in ['hpb','hpj','tkdn_barang','tkdn_jasa','knb']:
        c.setFillColor(HexColor('#F6F8FA')); c.rect(42, y-17, 511, 44, fill=1, stroke=0)
        c.setFillColor(HexColor('#1E293B')); c.setFont('Helvetica', 10)
        c.drawString(54,y,labels[key]); c.setFont('Helvetica-Bold', 11)
        c.drawRightString(540,y,display(key,values[key]))
        sources.append({'field':key,'location':'Halaman 1 · '+labels[key], 'quote':labels[key]+': '+display(key,values[key])})
        y -= 60
    c.setFont('Helvetica', 10)
    c.drawString(42, 240, 'Pernyataan komitmen penyedia untuk pemeriksaan evaluator.')
    c.drawString(42, 221, 'Komponen harga dan TKDN ditetapkan secara terpisah pada tabel di atas.')
    c.line(370, 130, 553, 130); c.drawString(391,112,'Penanggung jawab penyedia')
    c.setFillColor(HexColor('#526174')); c.setFont('Helvetica', 8)
    c.drawString(42,42,'Form A5 | Komitmen TKDN'); c.drawRightString(553,42,'1 / 1')
    c.save()
    registry.append({'id':'a5-'+slug,'name':filename,'path':'/files/'+filename,'kind':'FORM_A5','scenario':'normal' if slug=='nusa' else 'correction','vendorName':vendor,'values':values,'sources':sources,'warnings':[] if slug=='nusa' else ['Periksa kembali TKDN jasa pada bukti sumber.'],'groups':[]})

price_rows = [
    {'id':'pipe','description':'Pipa baja 4 inci','category':'MATERIAL','unit':'m','oe':'100000','offer':'125000','source':'Harga · E5/F5'},
    {'id':'install','description':'Pemasangan pipa','category':'SERVICE','unit':'m','oe':'50000','offer':'55000','source':'Harga · E6/F6'},
    {'id':'valve','description':'Katup gate 4 inci','category':'MATERIAL','unit':'unit','oe':'850000','offer':'680000','source':'Harga · E7/F7'},
]
for id_, filename, kind, vendor in [('oe-terminal','OE-Terminal.xlsx','OE',None),('bid-nusa','Penawaran-Nusa.xlsx','OFFER',vendors[0][1]),('bid-borneo','Penawaran-Borneo.xlsx','OFFER',vendors[1][1])]:
    registry.append({'id':id_,'name':filename,'path':'/files/'+filename,'kind':kind,'scenario':'ambiguous' if id_=='bid-borneo' else 'normal','vendorName':vendor,'rows':price_rows,'sources':[{'field':r['id'],'location':r['source'],'quote':r['description']+' · '+r['unit']} for r in price_rows],'warnings':['Dua kelompok harga tersedia; pilih sumber secara eksplisit.'] if id_=='bid-borneo' else [],'groups':['Harga satuan material dan jasa','Ringkasan total'] if id_=='bid-borneo' else ['Harga satuan material dan jasa']})
for year, price in [('2024','85000'),('2025','90000'),('2026','95000')]:
    filename = 'OE-Historis-'+year+'.xlsx'
    registry.append({'id':'history-'+year,'name':filename,'path':'/files/'+filename,'kind':'HISTORICAL_OE','scenario':'insufficient' if year=='2024' else 'normal','period':year,'rows':[{'id':'painting-'+year,'description':'Pengecatan tangki','category':'SERVICE','unit':'m²','oe':price,'offer':'','source':'Harga · E5'}],'sources':[{'field':'painting-'+year,'location':'Harga · E5','quote':'Pengecatan tangki · m² · Rp '+f'{int(price):,}'.replace(',','.')}],'warnings':[],'groups':[]})
(ROOT/'src/infrastructure/local/fixtures/file-registry.json').write_text(json.dumps(registry,indent=2,ensure_ascii=False)+'\n')
print('Created 2 PDF assets and metadata for 8 source files.')
