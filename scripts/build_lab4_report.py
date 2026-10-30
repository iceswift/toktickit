"""Reproducible nine-Part review report. Never invent a released-main checkpoint.

Run with the bundled Python (ReportLab, Pillow, pypdf, uharfbuzz). The HTML and
PDF share the same content model; source documents and original screenshots stay
unchanged. Generated viewport crops carry source hashes and explicit crop bounds.
Final-main logs/release facts are a later observed gate, not a mode-switch claim.
"""
from pathlib import Path
import hashlib
import html
import json
import re
import textwrap
from urllib.parse import quote

from PIL import Image as PILImage, ImageChops
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
DOCS = ROOT / 'docs/lab-04'
REF = 'docs/lab4-release-report'
STATUS = 'REVIEW COPY - release, fresh main verification and final Done board pending'
GREEN = '#176b4d'
WIDTH = A4[0] - 88
sections = []


def section(title, lead):
    item = {'title': title, 'items': [('p', lead)]}
    sections.append(item)
    return item


def add(s, kind, *values):
    s['items'].append((kind, *values))


def figure(s, path, caption, viewport=False):
    assert (ROOT / path).is_file(), path
    add(s, 'figure', path, caption, viewport)


P7 = 'artifacts/lab-04/phase7/screenshots/'
P8 = 'artifacts/lab-04/phase8/'
G = 'artifacts/lab-04/github/'
P4 = 'artifacts/lab-04/phase4/screenshots/'
P5 = 'artifacts/lab-04/phase5/screenshots/'
P6 = 'artifacts/lab-04/phase6/screenshots/'

s = section('Answer Part 1 - Git Use with Engineering Workflow',
    'Repository: [iceswift/toktickit](https://github.com/iceswift/toktickit). '
    'Author iceswift; accepted integration reviewer and merger Richyboy170. '
    'Phases 1-7 are accepted at lab4-staging b887994. Issue75 is Started on '
    'docs/lab4-release-report. This is an inspectable review copy, NOT the final '
    'submission: it does not claim a Lab4 release into main or an all-Done board.')
add(s, 'md', 'docs/lab-04/reviewer.md')
figure(s, G+'phase2-pr78-version-review-reply.png',
    'Actual substantive version/history feedback and author correction in PR78; '
    'not a fabricated review conversation. The linked discussion retains full text.')
figure(s, G+'phase7-pr83-approved-merged.png',
    'Latest accepted feature PR83: Richyboy170 approved and merged; author acknowledgement linked above.')
figure(s, G+'phase8-issue75-started.png',
    'Current checkpoint, NOT final Kanban: report/release Issue75 remains Started. '
    'A final all-eight-Issue Done capture is required only after all release gates hold.')
add(s, 'log', P8+'staging-history.txt',
    'Actual feature-to-staging graph, excluding released Lab3 baseline5398f2d. '
    'Lab4 staging-to-main release has not happened at this checkpoint.')
add(s, 'md', 'README.md')
add(s, 'md', '.gitignore')

s = section('Answer Part 2 - Spec DD',
    'Original engineering contract753ddeb predates implementation. Corrected '
    'Requester HTTP prefixes fa8e550 were reviewed before PR77 integration. '
    'The current rendering below consolidates the approved FR/BR/AC, role and '
    'status matrices, query predicates, migration decisions and truthful DoD. '
    'Student-approved design choices are distinguished from instructor requirements.')
add(s, 'md', 'docs/lab-04/specification.md')

s = section('Answer Part 3 - Test DD and Traceability',
    'Accepted Phase7 local results: backend272/29files, client90/19files, '
    'browser37 scenarios, both builds and dependency audits passed. These are '
    'feature-tree results, NOT fresh main or CI results. Phase8 reruns cover the '
    'small favicon correction and preserved browser regressions. Complete '
    'FROM-MAIN output remains a hard final-submission gate after reviewer release.')
add(s, 'md', 'docs/lab-04/tests.md')
for path, title in [
    (P8+'server-tests-compact.txt',
     'Complete Phase8 local server output (unit, API, authorization, migration, concurrency, performance).'),
    (P8+'client-tests.txt', 'Complete Phase8 local client run; not final main.'),
    (P8+'e2e-tests.txt', 'Complete Phase8 local browser regression; not final main.'),
    (P8+'client-build.txt', 'Phase8 local client production build.'),
    (P8+'server-build.txt', 'Phase8 local server production build.'),
]:
    add(s, 'log', path, title)
add(s, 'p', 'Test counts include preserved earlier labs; they are not all new Lab4 '
    'tests. Repeated focused runs are not added to the unique-case total. Earlier '
    'failures remain in the evidence bundle. No configured GitHub checks means '
    'no CI result, not a CI Pass. Raw source logs are linked alongside every rendered output.')

s = section('Answer Part 4 - AI Use with Reflection',
    'The student supplied GPT-6.1 Sol (medium) and explicitly confirmed the exact '
    'Lab4 reflection on30October2026. Ten authentic selected prompts are rendered '
    'without inventing original English dialogue. AI implementation/test assistance '
    'is disclosed rather than portrayed as student-only work.')
add(s, 'md', 'docs/lab-04/ai-use.md')

s = section('Answer Part 5 - Working IT Staff Dashboard UI',
    'Backend snapshots calculate operational status, IT Priority, unassigned/open '
    'ownership queues, recent/urgent Tickets and current-user performed Actions. '
    'Performed-by is separate from assignee. All19 card/list populations were '
    'compared with independent real DB fixture predicates in Phase6; matching '
    'drill-down is executable API/browser coverage, not a manually typed metric.')
figure(s, P7+'staff-dashboard-tablet.png',
    'Actual loaded Staff Dashboard at768x1024, with deterministic fixture counts, '
    'identity, grouped metrics and destinations. Full long original retained.', viewport=True)
figure(s, P6+'my-actions.png',
    'Actual My Actions drill-down uses authenticated performedBy, not assignedTo; '
    'rows link back to the corresponding Staff Ticket Detail.', viewport=True)
for name, cap in [
    ('staff-real-empty-panel.png', 'Real new synthetic Staff account with zero personal Actions and owned open Tickets. '
     'The global queue is populated; this is NOT a claim that the entire database is empty.'),
    ('staff-controlled-loading.png', 'Genuine request held in browser before release: loading state and disabled Refresh. '
     'Delay is controlled evidence, not a backend latency measurement.'),
    ('staff-injected-503.png', 'Explicitly injected HTTP503: safe failure and Retry, stale metrics removed.'),
    ('staff-injected-403.png', 'Explicitly injected HTTP403: safe forbidden feedback with no retained metrics. '
     'Real role authorization remains separately tested at API level.'),
    ('staff-recovered.png', 'Route injection removed; Retry receives actual HTTP200 and restores the real Dashboard.'),
]:
    figure(s, P8+'screenshots/'+name, cap, viewport=name=='staff-recovered.png')
add(s, 'p', 'Supplemental CLI capture script and structured output: '
    '[capture script](../../scripts/capture_lab4_staff_states.js), '
    '[observations](../../artifacts/lab-04/phase8/staff-capture-output.txt). '
    'Synthetic isolated database on127.0.0.1:55484; working Docker database untouched.')

s = section('Answer Part 6 - Working Actions Taken UI',
    'Actions belong to one Ticket. The authenticated recorded/performed-by actor '
    'is immutable and distinct from active Staff/Admin assignee. Create starts '
    'Planned; In Progress, Completed and Cancelled transitions follow the approved '
    'matrix. Completion requires a Result; follow-up requires a Note. Updates '
    'append immutable history and increment Ticket/Action versions atomically.')
for path, caption in [
    (P7+'action-validation-tablet-panel.png', 'Actual labelled Action form: near-field required/conditional validation; actor is read-only.'),
    (P4+'lifecycle-history.png', 'Actual Action lifecycle with completion/cancellation and append-only change events; history remains visible.'),
    (P4+'multiple-staff.png', 'Real multiple staff working on one Ticket, separate actor and assignee; not limited to Ticket Owner.'),
    (P4+'inactive-assignee.png', 'Actual inactive-assignee validation; input retained and no unsafe assignment saved.'),
    (P4+'injected-lost-response.png', 'Controlled lost-response recovery: durable logical retry key prevents a second Action. Injection explicitly labelled.'),
    (P4+'stale-draft.png', 'Real stale-version conflict: preserve draft and require deliberate refresh/reconciliation, never silently overwrite.'),
    (P4+'requester-read-only.png', 'Owned Requester sees shared Actions read-only and no Staff mutation controls.'),
]:
    figure(s, path, caption, viewport='panel' not in path and 'lifecycle' not in path)
add(s, 'p', 'Real API tests cover spoofed actor, wrong/inactive assignee, invalid '
    'time/text, cross-owner404, wrong-role403, terminal state rejection, same-key '
    'replay/different-payload409, event ordering, rollback and races. See the '
    'complete output in Part3; disabled UI buttons alone are not authorization proof.')

s = section('Answer Part 7 - Working Ticket Workflow',
    'The approved eight-status matrix is preserved. Resolve requires at least one '
    'Completed Action, no Planned/In-Progress Action and no outstanding follow-up. '
    'Cancellation requires unfinished Actions to be explicitly cancelled first. '
    'Requester indication stays advisory. Staff/Admin formal transitions are '
    'versioned, transactional and recorded in immutable ordered history.')
for name, caption in [
    ('no-completed-gate.png', 'Real gate: no Completed work blocks Resolve.'),
    ('open-actions-gate.png', 'Real gate: unfinished Action blocks Resolve even when another Action is Completed.'),
    ('follow-up-gate.png', 'Real gate: outstanding follow-up blocks Resolve.'),
    ('resolved.png', 'Actual successful Resolve after satisfying all predicates, with recorded actor/time/history.'),
    ('closed-history.png', 'Actual Resolved-to-Closed transition and ordered history.'),
    ('administrator-reopened.png', 'Actual Administrator reopen with append-only prior history preserved.'),
    ('requester-indication.png', 'Requester indication is visible but does not perform a formal Ticket transition.'),
    ('injected-save-failure.png', 'Explicit injected save failure retains the intended transition for safe recovery.'),
]:
    figure(s, P5+name, caption, viewport=True)
add(s, 'p', 'All8x8 transition pairs are exercised for permitted roles; unlisted '
    'transitions, stale versions and Action-vs-Resolve races are rejected. History '
    'cannot be overwritten/deleted through application routes. Full event/negative '
    'assertions are in Part3, not inferred solely from the screenshots.')

s = section('Answer Part 8 - Working Requester Dashboard and Final Regression UI',
    'Requester metrics use session-owned Tickets: Open, Waiting for Requester and '
    'recently resolved within the defined Bangkok calendar window, plus attention '
    'and recents. Last-resolved legacy nulls remain unknown, not invented. '
    'Card filters match the destination list; refresh obtains a new snapshot.')
for path, caption in [
    (P7+'requester-dashboard-tablet.png', 'Actual owned Requester Dashboard: counts, attention and recent items with detail/list destinations.'),
    (P6+'requester-drilldown.png', 'Real card drill-down with matching owned-list predicate and clearable source context.'),
    (P6+'zero-requester.png', 'Real new synthetic Requester: numeric zero counts and empty lists; not an injected success payload.'),
    (P8+'regression/requester-shared-no-private-notes.png', 'Current Lab4 regression: owned Public Comment and advisory indication. Focused shared panels; private-Note absence is checked across the full DOM/API, not inferred from this crop alone.'),
    (P8+'regression/staff-comments-private-notes.png', 'Current Lab4 Staff regression: Public Comments and clearly separated private Internal Notes.'),
    (P8+'regression/admin-priority-correction.png', 'Current Lab4 Administrator regression: permitted IT Priority correction without Staff-only owner/comment/Note operations.'),
    (P7+'change-password-tablet.png', 'Preserved first-login password-change gate; existing authentication/role regression remains executable.'),
]:
    figure(s, path, caption, viewport=True)
add(s, 'p', 'The complete37-scenario browser run preserves Lab2 create/search/detail '
    'and Attachment upload/removal/blocked-download404, plus Lab3 login/password, '
    'Staff/Admin and private-Note boundaries. Actual source assertions, not new '
    'screenshots of every unchanged baseline operation, establish regression '
    'coverage. Final-main execution is still pending release; this heading follows '
    'the handout and does not mean the preview itself is a final release.')

s = section('Answer Part 9 - Zen Green UI, Responsive, Accessibility, and Final Polish',
    'Current reusable UI specification and completed, qualified inspection follow. '
    'Desktop1440x900, tablet768x1024 and mobile390x844 full originals are retained. '
    'The following viewport extracts establish layout; earlier sections show '
    'readable functional panels. Long content below each extract is intentionally '
    'omitted here, never represented as a full-page screenshot. Full originals are '
    'linked, and whole-document overflow assertions cover the long screens.')
add(s, 'md', 'docs/lab-04/ui-spec.md')
for screen, title in [('staff-dashboard', 'Staff Dashboard'), ('requester-dashboard', 'Requester Dashboard'),
                      ('action-validation', 'Actions Taken validation'), ('workflow-confirm', 'Ticket workflow confirmation')]:
    add(s, 'responsive', screen, title)


def clean(text):
    text = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', text).replace('\ufeff', '')
    for old, new in [('—', '-'), ('–', '-'), ('‑', '-'), ('→', '->'), ('×', 'x'), ('✓', 'PASS')]:
        text = text.replace(old, new)
    return text


def link_url(target, source=None):
    if re.match(r'https?://', target):
        return target
    path = ((ROOT/source).parent/target).resolve() if source else (DOCS/target).resolve()
    assert path.is_relative_to(ROOT) and path.is_file(), (source, target)
    return 'https://github.com/iceswift/toktickit/blob/'+REF+'/'+quote(path.relative_to(ROOT).as_posix())


def inline(text, source=None):
    text = html.escape(clean(text))
    def repl(match):
        return '<a href="'+html.escape(link_url(html.unescape(match[2]), source), quote=True)+'" color="'+GREEN+'">'+match[1]+'</a>'
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', repl, text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    return re.sub(r'`([^`]+)`', r'\1', text)


def blocks(text):
    lines = clean(text).splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
        elif line.startswith('```'):
            value = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                value.append(lines[i]); i += 1
            yield 'code', '\n'.join(value)
            i += 1
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = [x.strip() for x in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[: -]+', x or '-') for x in row):
                    rows.append(row)
                i += 1
            if rows:
                assert all(len(row) == len(rows[0]) for row in rows), rows
                yield 'table', rows
        elif line.startswith('#'):
            yield 'heading', line.lstrip('# '); i += 1
        else:
            value = [line]; i += 1
            while i < len(lines) and lines[i].strip() and not lines[i].strip().startswith(('#', '|', '```', '- ')):
                value.append(lines[i].strip()); i += 1
            yield 'p', ' '.join(value)


pdfmetrics.registerFont(TTFont('Tahoma', 'C:/Windows/Fonts/tahoma.ttf', shapable=True))
pdfmetrics.registerFont(TTFont('TahomaBold', 'C:/Windows/Fonts/tahomabd.ttf', shapable=True))
pdfmetrics.registerFontFamily('Tahoma', normal='Tahoma', bold='TahomaBold', italic='Tahoma', boldItalic='TahomaBold')
styles = {
    'body': ParagraphStyle('body', fontName='Tahoma', fontSize=9.2, leading=14, spaceAfter=7, shaping=True),
    'title': ParagraphStyle('title', fontName='TahomaBold', fontSize=30, leading=38, textColor=colors.HexColor(GREEN), spaceAfter=20),
    'section': ParagraphStyle('section', fontName='TahomaBold', fontSize=17, leading=23, textColor=colors.HexColor(GREEN), spaceAfter=14),
    'sub': ParagraphStyle('sub', fontName='TahomaBold', fontSize=10.5, leading=15, spaceBefore=9, spaceAfter=7, keepWithNext=True),
    'caption': ParagraphStyle('caption', fontName='Tahoma', fontSize=8, leading=11.5, textColor=colors.HexColor('#52685d'), spaceAfter=10, shaping=True),
    'cell': ParagraphStyle('cell', fontName='Tahoma', fontSize=8, leading=11.5, shaping=True),
    'code': ParagraphStyle('code', fontName='Courier', fontSize=7.2, leading=9.5),
}

# Do not emit a review PDF from a running, truncated or failed test log. These
# markers establish local results only, not the missing final-main gate.
for filename, markers in {
    'server-tests-compact.txt': ['29 passed (29)', '272 passed (272)'],
    'client-tests.txt': ['19 passed (19)', '90 passed (90)'],
    'e2e-tests.txt': ['37 passed'],
    'client-build.txt': ['built in'],
}.items():
    text = (ROOT/P8/filename).read_text(encoding='utf-8-sig')
    assert all(marker in text for marker in markers), 'Incomplete/failed local output: '+filename


class ReportDoc(BaseDocTemplate):
    def __init__(self, path):
        super().__init__(str(path), pagesize=A4, leftMargin=44, rightMargin=44,
                         topMargin=43, bottomMargin=42, title='TokTickIT Lab4 - 67070503444 - Review Copy', author='iceswift')
        self.section_pages = {}
        frame = Frame(44, 42, WIDTH, A4[1]-85, id='body', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='main', frames=frame, onPage=self.footer))

    def footer(self, canvas, doc):
        canvas.saveState()
        canvas.setFont('Tahoma', 7)
        canvas.setFillColor(colors.HexColor('#52685d'))
        canvas.drawString(44, 23, 'TokTickIT Lab 4 | 67070503444 | REVIEW COPY')
        canvas.drawRightString(A4[0]-44, 23, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and hasattr(flowable, 'section_key'):
            key = flowable.section_key
            label = flowable.getPlainText()
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(label, key, 0)
            self.section_pages[key] = self.page
            self.notify('TOCEntry', (0, label, self.page, key))


def para(text, style='body', source=None):
    return Paragraph(inline(text, source), styles[style])


story = [Spacer(1, 100), para('CPE334 Software Engineering Laboratory', 'sub'),
         para('TokTickIT\nLab 4 Report', 'title'), para('Actions Taken, final Ticket workflow and role dashboards'),
         Spacer(1, 25), para('Student ID: 67070503444 | GitHub: iceswift'),
         para('Evidence checkpoint: 30 October 2026 (Asia/Bangkok)'), para(STATUS),
         para('Accepted integration: b887994. Model and personal reflection confirmed. '
              'Release review, FROM-MAIN tests and final all-Done board are explicitly pending.'), PageBreak(),
         para('Contents', 'section')]
toc = TableOfContents()
toc.levelStyles = [ParagraphStyle('toc', fontName='Tahoma', fontSize=10, leading=17, spaceAfter=12)]
story.extend([toc, PageBreak()])
html_sections = []
figure_number = 0
provenance = []


def code_block(value):
    # Every source line is retained; only ANSI/color/box glyph presentation changes.
    for line in clean(value).splitlines():
        line = ''.join('|' if '\u2500' <= ch <= '\u257f' else ch for ch in line)
        for part in textwrap.wrap(line.expandtabs(4), width=110, replace_whitespace=False, drop_whitespace=False) or [' ']:
            story.append(Paragraph(html.escape(part).replace(' ', '&#160;'), styles['code']))
    story.append(Spacer(1, 8))


for index, sec in enumerate(sections, 1):
    if index > 1:
        story.append(PageBreak())
    heading = para(sec['title'], 'section')
    heading.section_key = 'part'+str(index)
    story.append(heading)
    hp = ['<section id="part'+str(index)+'"><h2>'+html.escape(sec['title'])+'</h2>']
    for item in sec['items']:
        kind = item[0]
        if kind == 'p':
            story.append(para(item[1])); hp.append('<p>'+inline(item[1])+'</p>')
        elif kind in ('md', 'log'):
            path = ROOT/item[1]
            assert path.is_file(), path
            title = 'Rendered '+item[1] if kind == 'md' else item[2]
            story.append(para(title, 'sub'))
            source_url = 'https://github.com/iceswift/toktickit/blob/'+REF+'/'+quote(item[1])
            story.append(para('[Exact source / complete raw output]('+source_url+')', 'caption'))
            hp.extend(['<h3>'+html.escape(title)+'</h3>', '<p><a href="'+source_url+'">Exact source / complete raw output</a></p>'])
            content = path.read_text(encoding='utf-8-sig')
            for bk, value in (blocks(content) if kind == 'md' and path.name != '.gitignore' else [('code', content)]):
                if bk == 'heading':
                    story.append(para(value, 'sub', item[1])); hp.append('<h4>'+inline(value, item[1])+'</h4>')
                elif bk == 'p':
                    story.append(para(value, source=item[1])); hp.append('<p>'+inline(value, item[1])+'</p>')
                elif bk == 'code':
                    code_block(value); hp.append('<pre>'+html.escape(clean(value))+'</pre>')
                else:
                    cols = len(value[0])
                    widths = {2:[.29,.71], 3:[.18,.43,.39], 4:[.20,.25,.25,.30], 5:[.20,.20,.20,.20,.20]}.get(cols, [1/cols]*cols)
                    data = [[Paragraph(inline(('**'+cell+'**') if ri == 0 else cell, item[1]), styles['cell'])
                             for cell in row] for ri, row in enumerate(value)]
                    table = Table(data, colWidths=[WIDTH*w for w in widths], repeatRows=1, hAlign='LEFT')
                    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e5f1e9')),
                        ('GRID',(0,0),(-1,-1),.3,colors.HexColor('#c9d7d0')),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
                    story.extend([table, Spacer(1, 10)])
                    hp.append('<table>'+''.join('<tr>'+''.join(('<th>' if ri == 0 else '<td>')+inline(cell, item[1])+('</th>' if ri == 0 else '</td>') for cell in row)+'</tr>' for ri,row in enumerate(value))+'</table>')
        elif kind == 'responsive':
            screen, label = item[1:]
            story.append(para(label+' - three-width layout comparison', 'sub'))
            hp.append('<h3>'+html.escape(label)+' - three widths</h3>')
            cells = []
            widths = [WIDTH*.46, WIDTH*.30, WIDTH*.24]
            for device, cell_width in zip(['desktop','tablet','mobile'],widths):
                suffix = '-panel.png' if screen in ('action-validation','workflow-confirm') else '.png'
                original = ROOT/P7/(screen+'-'+device+suffix)
                im = PILImage.open(original).convert('RGB')
                height = min(im.height, {'desktop':900,'tablet':1024,'mobile':844}[device])
                box = (0,0,im.width,height)
                if screen == 'action-validation':
                    # Observed complete Record-an-Action panel in each original.
                    box = (0,{'desktop':490,'tablet':512,'mobile':828}[device],im.width,im.height)
                crop = im.crop(box)
                height = crop.height
                generated = OUT/('lab4-responsive-'+screen+'-'+device+'.png')
                crop.save(generated)
                url = 'https://github.com/iceswift/toktickit/blob/'+REF+'/'+quote(original.relative_to(ROOT).as_posix())
                dw = cell_width-9
                cells.append([Image(str(generated),width=dw,height=dw*height/im.width),
                              para('['+device+' full original]('+url+')','caption')])
                provenance.append({'responsive':screen,'device':device,'source':original.relative_to(ROOT).as_posix(),
                    'sha256':hashlib.sha256(original.read_bytes()).hexdigest(),'crop':list(box)})
                hp.append('<p><a href="../../'+original.relative_to(ROOT).as_posix()+'">'+device+' full original</a></p>')
            table=Table([cells],colWidths=widths)
            table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),3),('RIGHTPADDING',(0,0),(-1,-1),3)]))
            # The heading belongs with the corresponding comparison, not alone at page foot.
            comparison_heading = story.pop(-1)
            story.append(KeepTogether([comparison_heading,table,para('Comparison extracts only: inspect grid/stacking/controls, not tiny body text. '
                'Readable operational panels appear in Parts5-8; complete long originals are linked. '
                'These are real Phase7 local captures, not new main evidence.','caption')]))
        else:
            path, caption, viewport = item[1:]
            original = ROOT/path
            im = PILImage.open(original).convert('RGB')
            w, h = im.size
            figure_number += 1
            full_url = 'https://github.com/iceswift/toktickit/blob/'+REF+'/'+quote(path)
            box = (0, 0, w, min(h, 850 if w > 600 else 844)) if viewport else (0,0,w,h)
            if path.endswith('action-validation-tablet-panel.png'):
                box = (0,512,w,h)
                caption += ' Focused complete Record an Action form; preceding saved card omitted.'
            elif path.endswith('regression/requester-shared-no-private-notes.png'):
                box = (202,915,1078,1453)
                caption += ' Contiguous Public Comments/indication region; Ticket identity above retained in full original.'
            elif path.endswith('regression/staff-comments-private-notes.png'):
                box = (102,925,1178,1550)
                caption += ' Contiguous Public Comments/private Notes region; upper Ticket controls omitted.'
            elif path.endswith('change-password-tablet.png'):
                diff=ImageChops.difference(im,PILImage.new('RGB',im.size,'white'))
                bounds=diff.point(lambda value:255 if value>20 else 0).getbbox()
                if bounds:
                    box=(max(0,bounds[0]-10),max(0,bounds[1]-10),min(w,bounds[2]+10),min(h,bounds[3]+10))
                    caption += ' Exterior blank margins omitted only.'
            elif box[3] < h:
                caption += ' Top viewport only; full original linked.'
                # Prefer a real light horizontal gap over bisecting a label at
                # the viewport-extract edge. Never paste disjoint UI regions.
                target=box[3]
                gray_source=im.convert('L')
                bottom=min(range(max(1,target-55),target+1),key=lambda y:(
                    sum(v<160 for v in gray_source.crop((0,y,w,min(h,y+8))).resize((max(1,w//4),1)).get_flattened_data()),
                    abs(y-target)))
                box=(box[0],box[1],box[2],bottom)
            im = im.crop(box)
            w = im.width
            dw = min(WIDTH, 205 if w < 600 else WIDTH)
            if box[1] > 0:
                dw = min(dw,450)
            # Long readable evidence is tiled, not shrunk into illegibility.
            max_pixels = int(590*w/dw)
            start = 0
            slices = []
            gray = im.convert('L')
            while im.height-start > max_pixels:
                target = start+max_pixels
                candidates = range(target-80, target)
                cut = min(candidates, key=lambda y: (sum(v < 170 for v in gray.crop((0,y,w,y+2)).resize((w//4,1)).get_flattened_data()), abs(y-target)))
                slices.append((start,cut)); start = cut
            slices.append((start,im.height))
            for si, (top,bottom) in enumerate(slices,1):
                crop = im.crop((0,top,w,bottom))
                generated = OUT/f'lab4-figure-{figure_number:02}-{si}.png'
                crop.save(generated)
                label = f'Figure {figure_number}'+(f' ({si}/{len(slices)})' if len(slices)>1 else '')+'. '
                label += caption if si==1 else 'Contiguous continuation of the same original, no content reconstructed.'
                picture = Image(str(generated), width=dw, height=dw*crop.height/w, hAlign='CENTER')
                story.append(KeepTogether([picture, Spacer(1,5), para(label+' [Full original]('+full_url+')', 'caption')]))
                provenance.append({'figure':figure_number,'source':path,'sha256':hashlib.sha256(original.read_bytes()).hexdigest(),
                                   'crop':[box[0],box[1]+top,box[2],box[1]+bottom], 'viewport':list(box), 'generated':generated.name})
            hp.append('<figure><a href="../../'+path+'"><img src="../../'+path+'" alt="'+html.escape(caption,quote=True)+'"></a><figcaption>Figure '+str(figure_number)+'. '+html.escape(caption)+'</figcaption></figure>')
    hp.append('</section>'); html_sections.append('\n'.join(hp))

pdf = OUT/'report_lab04_67070503444.pdf'
doc = ReportDoc(pdf)
doc.multiBuild(story)
reader = PdfReader(pdf)
assert len(reader.outline) == 9
assert len(doc.section_pages) == 9
nav = '<nav><h2>Contents</h2>'+''.join('<p><a href="#part'+str(i)+'">'+html.escape(sec['title'])+'<span>p. '+str(doc.section_pages['part'+str(i)])+'</span></a></p>' for i,sec in enumerate(sections,1))+'</nav>'
css = '''@page{size:A4;margin:18mm 16mm}body{font:15px/1.6 Tahoma,Arial,sans-serif;color:#19332a;max-width:1050px;margin:30px auto;padding:20px}h1,h2,h3,h4,a{color:#176b4d}h2{border-bottom:2px solid #176b4d;padding-bottom:9px}section{break-before:page;margin-bottom:45px}nav a{display:flex;justify-content:space-between;gap:25px}nav p{border-bottom:1px dotted #9cb8a8}figure{margin:25px 0;break-inside:avoid}img{display:block;max-width:100%;max-height:1000px;object-fit:contain;height:auto;border:1px solid #cad8d1}figcaption{font-size:13px;color:#52685d;margin-top:8px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{border:1px solid #cad8d1;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#e5f1e9}pre{font:12px/1.5 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f7f5;padding:12px}.cover{padding:60px 20px;min-height:60vh}'''
document = '<!doctype html><html lang="en"><meta charset="utf-8"><title>Lab 4 Report - 67070503444</title><style>'+css+'</style><body><header class="cover"><h1>TokTickIT - Lab 4 Report</h1><p>67070503444 | iceswift | 30 October 2026</p><p>'+STATUS+'</p><p>Contents page numbers refer to the companion PDF; links jump within this HTML. HTML images show full originals; PDF figures use the explicitly labelled crops/continuations.</p></header>'+nav+''.join(html_sections)+'</body></html>'
document = '\n'.join(line.rstrip() for line in document.splitlines())+'\n'
(DOCS/'report.html').write_text(document, encoding='utf-8')
(OUT/'report_lab04_67070503444.html').write_text(document, encoding='utf-8')
metadata = {'status':STATUS,'scope':'local review copy, NOT final released main', 'pages':len(reader.pages),
            'figures':figure_number,'section_pages':doc.section_pages,'pdf':str(pdf),'html':str(DOCS/'report.html')}
(OUT/'lab4-report-build.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
(OUT/'lab4-image-provenance.json').write_text(json.dumps(provenance,indent=2),encoding='utf-8')
print(json.dumps(metadata,indent=2))
