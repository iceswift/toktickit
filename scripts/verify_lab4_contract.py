"""Read-only Phase 1 contract/report checks; not product test results."""
from pathlib import Path
from html.parser import HTMLParser
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs' / 'lab-04'
required = ['specification.md', 'api-spec.md', 'ui-spec.md', 'tests.md',
            'reviewer.md', 'ai-use.md', 'evidence-matrix.md', 'report.html']
for name in required:
    assert (DOCS / name).is_file(), f'Missing {name}'
spec = (DOCS / 'specification.md').read_text(encoding='utf-8')
plan = (DOCS / 'tests.md').read_text(encoding='utf-8')
assert {f'AC-{i:02}' for i in range(1, 14)} <= set(re.findall(r'AC-\d{2}', spec))
assert {f'AC-{i:02}' for i in range(1, 14)} <= set(re.findall(r'AC-\d{2}', plan))
assert 'not yet exist' in plan

# Contract regression check: mixed baseline prefixes are deliberate. These are
# source/contract checks only, not evidence that proposed endpoints run.
api = (DOCS / 'api-spec.md').read_text(encoding='utf-8')
baseline = (ROOT / 'server' / 'src' / 'app.ts').read_text(encoding='utf-8')
client_api = (ROOT / 'client' / 'src' / 'api.ts').read_text(encoding='utf-8')
for path in ['/api/tickets', '/api/attachments', '/staff/tickets', '/auth/login']:
    assert path in baseline and path in client_api, f'Baseline route drift: {path}'
for path in [
    'GET /api/tickets/:id/actions', 'GET /api/tickets/dashboard',
    'GET /api/tickets/:id/actions/:actionId/events',
    'GET /api/tickets/:id/workflow-events',
    'GET /api/tickets?statusGroup=open',
    'GET /staff/tickets/:id/actions', 'GET /staff/dashboard',
    'GET /staff/actions?performedBy=me',
]:
    assert path in api, f'Missing resolved HTTP path: {path}'
for name, content in [('api-spec.md', api), ('specification.md', spec)]:
    assert not re.search(r'(?<![\w/])/tickets(?:[/?\s|`]|$)', content), (
        f'Ambiguous bare Requester HTTP path in {name}'
    )

class ReportCheck(HTMLParser):
    ids = set()
    refs = []
    images = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'a' and 'href' in attrs:
            self.refs.append(attrs['href'])
        if tag == 'img':
            assert attrs.get('alt'), 'Missing image alternative text'
            self.images.append(attrs['src'])

parser = ReportCheck()
parser.feed((DOCS / 'report.html').read_text(encoding='utf-8'))
assert {f'part{i}' for i in range(1, 10)} <= parser.ids
for ref in parser.refs + parser.images:
    if ref.startswith('#'):
        assert ref[1:] in parser.ids, f'Broken anchor {ref}'
    elif '://' not in ref:
        assert (DOCS / ref).resolve().is_file(), f'Broken local reference {ref}'
print('PASS: required documents, AC-01..13 mapping, nine Parts, anchors and local assets.')
print('Scope: structural contract/report checks only; no product tests executed.')
print('PASS: mixed baseline HTTP prefixes and resolved Requester/Staff paths.')
