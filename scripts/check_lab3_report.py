"""Read-only report structure and local-image reference checks."""
from pathlib import Path
import json, re
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
reader = PdfReader(root / 'output/pdf/report_lab03_67070503444.pdf')
html_path = root / 'docs/lab-03/report.html'
content = html_path.read_text(encoding='utf8')
texts=[page.extract_text() for page in reader.pages]
build=json.loads((root/'output/pdf/report-build.json').read_text(encoding='utf8'))
toc=texts[1]
for key,page_number in build['section_pages'].items():
    part_number=int(key.removeprefix('part'))
    assert f'Answer Part {part_number}' in texts[page_number-1]
    assert str(page_number) in toc
assert not any('file:///D:' in text or '\ufffd' in text for text in texts)
missing = [source for source in re.findall(r'<img src="([^"]+)"', content)
           if not (html_path.parent/source).resolve().exists()]
info = {
    'pages': len(reader.pages),
    'outline_entries': len(reader.outline),
    'link_annotations': sum(len(page.get('/Annots', [])) for page in reader.pages),
    'missing_local_images': missing,
    'all_nine_html_anchors': all(f'id="part{i}"' in content for i in range(1,10)),
    'browser_file_path_headers_found': any('file:///' in text for text in texts),
    'toc_page_targets_checked': True,
    'replacement_character_found': any('\ufffd' in text for text in texts),
    'status': 'Structure checks only; does not certify final content or visual QA.'
}
assert not missing
assert info['outline_entries'] == 9
assert info['all_nine_html_anchors']
assert all(page.extract_text().strip() for page in reader.pages)
(root/'output/pdf/report-structure-qa.json').write_text(json.dumps(info, indent=2), encoding='utf8')
print(json.dumps(info, indent=2))
