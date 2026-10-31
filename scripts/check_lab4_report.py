"""Structural verification and contact sheets for the current Lab4 review PDF.

Run build_lab4_report.py, render with pdftoppm to output/pdf/lab4-review-qa/page-NN.png,
then run this script. Contact sheets must still be inspected by a human/agent.
This is not a substitute for visual verification or final-main execution.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'output/pdf'
meta = json.loads((OUT/'lab4-report-build.json').read_text(encoding='utf-8'))
reader = PdfReader(OUT/'report_lab04_67070503444.pdf')
assert len(reader.pages) == meta['pages']
assert len(reader.outline) == 9
assert len(meta['section_pages']) == 9
texts = [page.extract_text() or '' for page in reader.pages]
assert all(len(text.strip()) > 60 for text in texts), 'Unexpected blank page'
assert 'REVIEW COPY' in texts[0]
for index in range(1,10):
    page = meta['section_pages']['part'+str(index)]
    assert 'Answer Part '+str(index) in texts[page-1], (index,page)
toc = texts[1]
for index in range(1,10):
    assert 'Answer Part '+str(index) in toc
    assert str(meta['section_pages']['part'+str(index)]) in toc
assert len(reader.pages[1].get('/Annots', [])) >= 9, 'Missing linked contents'
uris = []
internal = 0
for page in reader.pages:
    for annotation in page.get('/Annots', []):
        a = annotation.get_object()
        action = a.get('/A', {})
        if action.get('/URI'):
            uri = str(action['/URI'])
            assert uri.startswith('https://github.com/'), uri
            uris.append(uri)
        if a.get('/Dest') or action.get('/S') == '/GoTo':
            internal += 1
assert internal >= 9
QA = OUT/'lab4-review-qa'
pages = sorted(QA.glob('page-*.png'))
assert len(pages) == len(reader.pages), 'Render every current page; remove stale render files from an earlier build only after validating targets.'
for offset in range(0,len(pages),4):
    sheet = Image.new('RGB',(1200,1700),'#e7ece9')
    draw = ImageDraw.Draw(sheet)
    for index,path in enumerate(pages[offset:offset+4]):
        image = Image.open(path).convert('RGB')
        image.thumbnail((575,805))
        x = 12+(index%2)*600
        y = 28+(index//2)*850
        draw.text((x,y-18),path.stem,fill='#19332a')
        sheet.paste(image,(x,y))
    sheet.save(QA/f'sheet-{offset//4+1:02}.png')
result = {'pages':len(reader.pages),'externalLinkAnnotations':len(uris),
          'internalLinks':internal,'outlineEntries':9,'section_pages':meta['section_pages'],
          'status':'structure checked; every-page visual inspection is a separate required step'}
(OUT/'lab4-report-check.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
