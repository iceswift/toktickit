"""Build matching HTML/PDF from retained source documents and real evidence.
Tables with long prose are rendered as labelled records to avoid tiny text.
Screenshot slices preserve all pixels and are labelled continuations.
"""
from pathlib import Path
import html, re, textwrap, json, shutil
from PIL import Image as PILImage
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, Image, KeepTogether, Table, TableStyle
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
EVID=ROOT/'artifacts/lab-03/released-main-evidence'; EVID.mkdir(parents=True,exist_ok=True)
SRC=ROOT/'output/playwright'
if not SRC.exists(): SRC=EVID
for item in SRC.iterdir():
    if item.suffix.lower() in ('.png','.jpg','.txt','.json') and (item.name.startswith(('login-','queue-','detail-','admin-','reset-','kanban-final','release-57','released-main','direct-security','review-conversation','late-author','issue-58','pr-44-linked','pr-47-linked')) or '-released-main-' in item.name):
        if item.resolve() != (EVID/item.name).resolve(): shutil.copy2(item,EVID/item.name)

sections=[]
def section(title):
    s={'title':title.replace('Part ','Answer Part ',1),'items':[]}; sections.append(s); return s
def p(s,text):s['items'].append(('p',text))
def md(s,name):s['items'].append(('md',ROOT/name,name))
def log(s,name,title):s['items'].append(('log',EVID/name,title))
def fig(s,path,caption):
    path=ROOT/path
    if not path.exists():raise FileNotFoundError(path)
    s['items'].append(('fig',path,caption))
E='artifacts/lab-03/released-main-evidence/'
Q='artifacts/lab-03/screenshots/phase-08-qa/'
s=section('Part 1 - Git Use with Engineering Workflow')
p(s,'Author: iceswift. Peer reviewer and merge performer: Richyboy170. Feature PRs target lab3-staging; release PRs target main. Release PR #57 was reviewer-approved and reviewer-merged on 2 October 2026 at 01:57 UTC (08:57 Bangkok). Released product source: c551061806a9b4eeea3e51967afc8418f7c50ab1. The report is a documentation-review draft; product release and report approval are distinct.')
p(s,'A further UI audit opened Issue #58 after this released-main checkpoint: edit fields could retain another account\'s values, and queue priority badges were missing. Corrections and two regression tests are on the review branch, not released main. Client 29/29 and both builds passed on that branch. The final Kanban must be captured again after Issue #58 integration; the earlier Done captures below describe the pre-#58 product-release checkpoint, not the current complete state.')
p(s,'Traceability: Issue/PR pairs 31/32, 35/37, 38/39, 40/41, 43/44, 46/47, 48/49, 51/52, and correction 55/56. Correction release: PR #57. The Kanban captures below are overlapping genuine views, not a reconstructed board: all 21 cards were Done and the five other columns were empty at the capture checkpoint. Issue #43 was closed late during this audit; the chronology is not backdated. Development links 43/44 and 46/47 were also reconciled during this audit.')
for name,caption in [('kanban-final-empty-columns.jpg','Final product Kanban: Backlog, Specified and Started are empty.'),('kanban-final-lab3-first.jpg','Final Kanban Done column, first Lab 3 cards: engineering contract, migration, authentication and Requester workflow.'),('kanban-final-lab3-middle.jpg','Final Kanban Done column, middle Lab 3 cards: staff queue, operations, administration and QA.'),('kanban-final-lab3-last.jpg','Final Kanban Done column, final Lab 3 cards including correction Issue #55 linked to PRs #56/#57.'),('release-57-main.jpg','Release PR #57 is Merged from lab3-staging into main; Richyboy170 performed the merge.'),('release-57-reviewer-merge.jpg','Actual reviewer approval and merge events for Release PR #57.'),('release-57-author-reply.jpg','Author acknowledgement of the release review, posted during the final audit.')]:fig(s,E+name,caption)
log(s,'released-main-branch-graph.txt','Actual released-main commit graph (git log --graph --oneline --decorate -80 origin/main)')
p(s,'Contract-before-implementation proof: engineering-contract commits ee74c14 and 2eeffe8 were integrated in PR #32 / merge 42079a7 before migration commit 975cab6, authentication commit 3d34f8a and subsequent feature commits. The graph preserves feature merges into staging and staging releases into main.')
md(s,'docs/lab-03/reviewer.md')
fig(s,'artifacts/lab-03/screenshots/phase-04-requester/pr-41-initial-approval-feedback.png','PR #41 technical review: four concrete suggestions, not only an approval badge. Historical checkpoint.')
fig(s,'artifacts/lab-03/screenshots/phase-04-requester/pr-41-review-reply-rerequest.png','Author response to PR #41 review points and re-requested review after correction commit 8c5d5b7. Historical checkpoint; final reviewer merge is recorded in reviewer.md.')
md(s,'README.md'); md(s,'.gitignore')
p(s,'Repository layout is rendered in README above. It identifies client source/tests/E2E, server source/Prisma/tests, docs for each lab, compose.yaml and .gitignore. The evidence bundle is retained under artifacts/lab-03; output contains generated local artifacts, not product source.')

s=section('Part 2 - Spec DD and Definition of Done')
p(s,'The reviewed engineering contract below defines numbered functional/business requirements, the role matrix, acceptance criteria, status transitions, migration continuity and Definition of Done. It was committed before implementation, as shown in Part 1. A passing existing suite is not proof that every planned subcase exists; Part 3 retains the planned-to-actual limitations.')
md(s,'docs/lab-03/specification.md')

s=section('Part 3 - Test DD and Traceability')
p(s,'Actual verification was run on released main c551061, before subsequent report-only edits: server 42/42 in 16 files; client 27/27 in 10 files; Playwright 9/9; both production builds passed; seven Prisma migrations applied with no pending migration. Isolated PostgreSQL used host port 55434 to avoid changing the original development database. PR #57 had zero GitHub CI checks; these are local executable results, not GitHub CI results.')
md(s,'docs/lab-03/tests.md')
for name,title in [('server-released-main-tests.txt','Complete server unit/API/authorization/regression output'),('client-released-main-tests.txt','Complete client UI test output'),('e2e-released-main-tests.txt','Complete Playwright browser E2E output'),('server-released-main-build.txt','Server production build output'),('client-released-main-build.txt','Client production build output'),('released-main-migrations.txt','Released-main migration status'),('direct-security-evidence.txt','Supplemental real direct-API security assertions - not extra Vitest test counts')]:log(s,name,title)
p(s,'Supplemental assertions explicitly exercise anonymous access, wrong-role management, private-note denial, cross-owner safe 404, Requester resolution without formal status change, blank/overlength content, expired sessions and throttled login. All values are synthetic. No session cookie, token or personal password is included in the report. Injected UI failures elsewhere are distinguished from these real backend responses.')
p(s,'Subsequent Issue #58 branch verification: client 29/29, browser E2E 9/9 and both builds passed. Complete branch output is retained in the evidence bundle separately; these results are not final-main verification for Issue #58.')

s=section('Part 4 - AI Use with Reflection')
p(s,'Verified assistant/tool: OpenAI Codex. Exact historical model variants still require student confirmation. The selected prompt entries are summaries of actual task focus, not fabricated verbatim quotations. The reflection is retained as a student-review draft; it must represent the student\'s own learning before submission.')
md(s,'docs/lab-03/ai-use.md')

s=section('Part 5 - Working Login and Password Change UI')
p(s,'Authentication uses email/password, opaque server sessions and a first-login password-change gate. Invalid and inactive accounts show the same safe message. The role-aware shell displays the authenticated user, and logout revokes the session. Direct protected access, password change and logout are also covered by the passing E2E and API output in Part 3.')
for name,caption in [('login-invalid.png','Real invalid-credential login rejection: safe message without account disclosure.'),('login-inactive.png','Real inactive-account rejection: the same safe failure message.'),('login-busy.png','Controlled delayed login request: busy/disabled sign-in state. Browser route delay was injected for this UI evidence; not a backend performance claim.'),('login-network-failure.png','Controlled network abort: safe authentication failure. Browser fault injection is labelled explicitly.'),('reset-first-login-gate.png','Real synthetic account after Administrator initial-password reset: mandatory Change password before protected screens.')]:fig(s,E+name,caption)
fig(s,'artifacts/lab-03/screenshots/phase-04-requester/authenticated-my-tickets.png','Historical Requester regression checkpoint: authenticated user context and My Tickets, without the Development Requester selector.')

s=section('Part 6 - Working IT Staff Ticket Queue UI')
p(s,'The operational queue displays seeded and synthetic audit Tickets, statuses, requested/IT priorities, owners, date metadata and detail actions. Eight stable DEMO seed Tickets cover the eight statuses. Thirteen additional EVID Tickets were created only in the isolated audit database to show real pagination and operations. Counts are demonstration data, not real service activity. Queue priority values appear as text; status is badged. Do not interpret this as proof of separate priority badges.')
for name,caption in [('queue-real.png','Real populated queue: assigned/unassigned records, status labels, priority values and detail actions.'),('queue-pagination.png','Real pagination: page 2 of the populated operational queue.'),('queue-seeded-search-sort.png','Search by exact DEMO prefix and sort by Ticket Number ascending.'),('queue-filter.png','Real status filter NEW narrows the eight seeded DEMO Tickets to the matching record.'),('queue-no-results.png','Real no-matching-results state after a nonmatching search.'),('queue-empty-injected.png','Empty-queue UI using a controlled successful empty API response. This is injected UI evidence, not a claim that the seeded database is empty.'),('queue-failure-injected.png','Queue API failure UI using a controlled HTTP 503 response.')]:fig(s,E+name,caption)
fig(s,E+'queue-badges-correction.png','Issue #58 correction branch: Requested and IT Priority are separate labelled badges. This correction is not yet released main.')

s=section('Part 7 - Working IT Staff Ticket Detail UI')
p(s,'Real synthetic Ticket TKT-20261002-EVID0001 demonstrates unassigned state, claim, reassignment, separate Requested/IT Priority, permitted status change, Public Comments and private Internal Notes. The Requester can indicate that the problem appears resolved without changing formal status; direct API assertions verify this and that private notes are absent from the Requester response. Attachment upload/removal continuity and cross-owner protection are covered by the passing Lab 2 regression E2E/API output in Part 3.')
for name,caption in [('detail-before-actions.png','Real unassigned staff Ticket Detail before operations.'),('detail-claimed.png','Claim Ticket assigns Iris Nattapong as owner.'),('detail-priority-public-private.png','Urgent IT Priority is distinct from Requested Priority High. Public Comment and visually separated private Internal Note were saved.'),('detail-reassigned.png','Real reassignment from Iris Nattapong to Jonas Miller.'),('detail-in-progress.png','Permitted transition to IN_PROGRESS with success feedback.'),('detail-invalid-transition.png','Real OPEN to CLOSED attempt rejected by backend; formal status remains OPEN.')]:fig(s,E+name,caption)
p(s,'Authorization evidence is actual output in Part 3: Requester staff-note access 403, cross-owner Ticket 404, owned public response 200 with no internalNotes field, Requester formal-status write 403, blank comment and overlength note 400. Administrator priority permission is also covered by its passing UI/API/E2E regression. The private-note panel is not available to Requesters.')

s=section('Part 8 - Working Administrator User Management UI')
p(s,'Administrator User Management provides searchable/filterable users, one role per account, active/inactive status, create/edit and initial-password reset. Evidence Requester is a synthetic audit-only account. Backend protections reject duplicate email and last-active-Administrator demotion; self-deactivation is disabled in the UI and rejected by API tests. Password reset revokes existing sessions and requires first-login change; the actual next-login gate appears in Part 5. Wrong-role access is denied directly by the backend in Part 3.')
for name,caption in [('admin-list.png','Real Administrator user list with role and Active/Inactive states.'),('admin-search-filter.png','Real search for Iris combined with IT_STAFF role filtering.'),('admin-created.png','Real synthetic account creation; success requires first-login password change.'),('admin-duplicate.png','Real duplicate-email rejection from backend.'),('admin-self-protection.png','Self-deactivation control disabled with an explicit explanation.'),('admin-last-admin-rejected.png','Real last-active-Administrator demotion rejected; Administrator remains protected.'),('admin-edited.png','Real synthetic user details updated successfully.'),('admin-password-reset.png','Real initial-password reset succeeded, with session-revocation/next-login warning.'),('admin-failure-injected.png','Safe User Management API failure using a controlled HTTP 503 response.')]:fig(s,E+name,caption)
fig(s,E+'admin-account-switch-correction.png','Issue #58 correction branch: switched directly from Edit Narin to Edit Iris; the form shows Iris\'s matching account fields, not Narin\'s retained values. Regression test first failed on old source and now passes.')

s=section('Part 9 - Zen Green UI and Responsive Evidence')
md(s,'docs/lab-03/ui-spec.md')
p(s,'Five required screens were captured at desktop 1280x900, tablet 820x900 and mobile 390x844. The released-main responsive E2E previously passed document-width assertions on all views. The latest screenshots below are corrective-branch captures for Issue #58, not evidence that its changes are already on main. Long screens continue across slices instead of being compressed into unreadable thumbnails.')
for screen,label in [('login','Login'),('change-password','Change Password'),('queue','Ticket Queue'),('staff-detail','Staff Ticket Detail'),('user-management','User Management')]:
    for device in ['desktop','tablet','mobile']:fig(s,Q+screen+'-'+device+'.png',f'{label} - {device}. Issue #58 corrective-branch responsive capture; not final-main evidence for the pending corrections.')
p(s,'Visual checklist: green primary buttons/navigation and neutral secondary actions; current user/role visible; editable controls separated from read-only Ticket identity; separate status/priority presentation; visible validation and safe error text; keyboard-labelled controls; mobile cards replace wide user table; no clipped/overlapping content or horizontal document overflow in the tested viewports. Automated width assertions do not prove every focus interaction or colour-contrast ratio; those should not be presented as measured accessibility conformance.')
p(s,'Remaining submission checkpoints: reviewer integration and release of Issue #58; rerun final-main tests and recapture final Kanban; student confirmation of AI/model attribution and personal reflection; final PDF readability/layout inspection and removal of redundant repeated screenshot areas. This is a comprehensive evidence draft, not the concise submission version. It must not be labelled fully submission-ready solely because the existing product tests pass.')

pdfmetrics.registerFont(TTFont('ReportArial','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ReportArialBold','C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('ReportArial',normal='ReportArial',bold='ReportArialBold',italic='ReportArial',boldItalic='ReportArialBold')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyReport',fontName='ReportArial',fontSize=9.5,leading=14,spaceAfter=7,textColor=colors.HexColor('#19332a')))
styles.add(ParagraphStyle(name='SectionReport',fontName='ReportArialBold',fontSize=16,leading=20,textColor=colors.HexColor('#176b4d'),spaceAfter=12))
styles.add(ParagraphStyle(name='SubReport',parent=styles['BodyReport'],fontName='ReportArialBold',fontSize=11.5,leading=16,spaceBefore=8))
styles.add(ParagraphStyle(name='CaptionReport',parent=styles['BodyReport'],fontSize=8.5,leading=12,textColor=colors.HexColor('#52685d')))
styles.add(ParagraphStyle(name='CodeReport',fontName='Courier',fontSize=7.2,leading=10,spaceAfter=3))
styles.add(ParagraphStyle(name='CoverReport',fontName='ReportArialBold',fontSize=29,leading=36,textColor=colors.HexColor('#176b4d'),spaceAfter=16))
def clean(text):return text.replace('\ufeff','').replace('–','-').replace('—','-').replace('→','->').replace('×','x').replace('✓','PASS').replace('›','>').replace('\u2011','-')
def inline(text):
    text=html.escape(clean(text))
    text=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',r'<a href="\2" color="#176b4d">\1</a>',text)
    text=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'\1 (\2)',text)
    text=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',text)
    return re.sub(r'`([^`]+)`',r'<font face="Courier">\1</font>',text)

def blocks(text):
    lines=clean(text).splitlines(); i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line:i+=1;continue
        if line.startswith('```'):
            code=[];i+=1
            while i<len(lines) and not lines[i].strip().startswith('```'):code.append(lines[i]);i+=1
            yield 'code','\n'.join(code);i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                row=[cell.strip() for cell in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch('[: -]+',cell or '-') for cell in row):rows.append(row)
                i+=1
            if rows:
                yield 'table',rows
            continue
        if line.startswith('#'):
            yield 'heading',re.sub(r'^#+\s*','',line);i+=1;continue
        para=[line];i+=1
        while i<len(lines) and lines[i].strip() and not lines[i].strip().startswith(('#','|','```','- ','1. ','2. ','3. ')):
            para.append(lines[i].strip());i+=1
        yield 'p',' '.join(para)

WIDTH=A4[0]-88
story=[]; htmlparts=[]; figure_no=0
class ReportDoc(BaseDocTemplate):
    def __init__(self,path):
        super().__init__(str(path),pagesize=A4,leftMargin=44,rightMargin=44,topMargin=43,bottomMargin=42,title='Lab 3 Report - 67070503444',author='Suwiwat Sinsomboon')
        self.section_pages={}; frame=Frame(44,42,WIDTH,A4[1]-85,id='body',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='main',frames=frame,onPage=self.footer))
    def footer(self,c,d):
        c.saveState();c.setFont('ReportArial',8);c.setFillColor(colors.HexColor('#52685d'))
        c.drawString(44,23,'TokTickIT Lab 3 | 67070503444');c.drawRightString(A4[0]-44,23,str(d.page));c.restoreState()
    def afterFlowable(self,flow):
        if isinstance(flow,Paragraph) and hasattr(flow,'section_key'):
            key=flow.section_key;label=flow.getPlainText();self.canv.bookmarkPage(key);self.canv.addOutlineEntry(label,key,0)
            self.section_pages[key]=self.page;self.notify('TOCEntry',(0,label,self.page,key))
def para(text,style='BodyReport'):return Paragraph(inline(text),styles[style])
story += [Spacer(1,115),para('CPE334 Software Engineering Laboratory','SubReport'),para('TokTickIT - Lab 3 Report','CoverReport'),para('Authentication, roles, staff operations and administration'),Spacer(1,28),para('Suwiwat Sinsomboon | 67070503444'),para('Repository: https://github.com/iceswift/toktickit'),para('Verified product: released main c551061 | 2 October 2026'),para('Documentation-review draft - student reflection/model attribution and final review remain to be confirmed.'),PageBreak(),para('Contents','SectionReport')]
toc=TableOfContents();toc.levelStyles=[ParagraphStyle(name='TOCReport',fontName='ReportArial',fontSize=10,leading=20,leftIndent=0,firstLineIndent=0)];story += [toc,PageBreak()]
htmlparts.append('<section class="cover"><h1>TokTickIT<br>Lab 3 Report</h1><p>Suwiwat Sinsomboon | 67070503444</p><p>Released product main c551061 - documentation-review draft</p></section>')
for index,s in enumerate(sections,1):
    if index>1:story.append(PageBreak())
    heading=para(s['title'],'SectionReport');heading.section_key='part'+str(index);story.append(heading)
    hp=[f'<section id="part{index}"><h2>{html.escape(s["title"])}</h2>']
    for item in s['items']:
        kind=item[0]
        if kind=='p':story.append(para(item[1]));hp.append('<p>'+inline(item[1])+'</p>')
        elif kind in ('md','log'):
            path,label=item[1:];story.append(para('Rendered '+label if kind=='md' else label,'SubReport'));hp.append('<h3>'+html.escape(label)+'</h3>')
            text=path.read_text(encoding='utf-8-sig')
            entries=blocks(text) if kind=='md' else [('code',text)]
            for bk,value in entries:
                if bk=='heading':story.append(para(value,'SubReport'));hp.append('<h4>'+inline(value)+'</h4>')
                elif bk=='table':
                    hp.append('<table>'+''.join('<tr>'+''.join(('<th>' if ri==0 else '<td>')+inline(cell)+('</th>' if ri==0 else '</td>') for cell in row)+'</tr>' for ri,row in enumerate(value))+'</table>')
                    cols=len(value[0])
                    if cols>5:
                        for row in value[1:]:
                            story.append(para(' | '.join('**'+field+'**: '+val for field,val in zip(value[0],row) if val)))
                            story.append(Spacer(1,5))
                    else:
                        cellstyle=ParagraphStyle(name='Cell',parent=styles['BodyReport'],fontSize=8,leading=11,spaceAfter=0)
                        widths={2:[.30,.70],3:[.07,.42,.51],4:[.36,.20,.20,.24],5:[.10,.12,.10,.39,.29]}.get(cols,[1/cols]*cols)
                        data=[[Paragraph(inline('**'+cell+'**' if ri==0 else cell),cellstyle) for cell in row] for ri,row in enumerate(value)]
                        table=Table(data,colWidths=[WIDTH*v for v in widths],repeatRows=1,hAlign='LEFT')
                        table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e5f1e9')),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#c9d7d0')),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
                        story.append(table);story.append(Spacer(1,10))
                elif bk=='code':
                    hp.append('<pre>'+html.escape(clean(value))+'</pre>')
                    for line in clean(value).splitlines():
                        for part in textwrap.wrap(line,106,replace_whitespace=False,drop_whitespace=False) or [' ']:story.append(Paragraph(html.escape(part).replace(' ','&#160;'),styles['CodeReport']))
                    story.append(Spacer(1,7))
                else:story.append(para(value));hp.append('<p>'+inline(value)+'</p>')
        elif kind=='fig':
            path,caption=item[1:];figure_no+=1
            hp.append(f'<figure><img src="../../{path.relative_to(ROOT).as_posix()}" alt="{html.escape(caption,quote=True)}"><figcaption>Figure {figure_no}. {html.escape(caption)}</figcaption></figure>')
            im=PILImage.open(path); w,h=im.size
            max_pixels=int(w*(1.5 if w<600 else 0.60));segments=(h+max_pixels-1)//max_pixels
            for n in range(segments):
                if segments==1:ip=path;cw,ch=w,h
                else:
                    crop=im.crop((0,round(n*h/segments),w,round((n+1)*h/segments)));ip=OUT/f'figure-{figure_no:02}-{n+1}.png';crop.save(ip);cw,ch=crop.size
                # Phone evidence stays at natural readable width, rather than stretched across A4.
                dw=min(WIDTH,170 if w<600 else WIDTH);dh=dw*ch/cw
                image=Image(str(ip),width=dw,height=dh,hAlign='CENTER')
                label=f'Figure {figure_no}'+(f' ({n+1}/{segments})' if segments>1 else '')+'. '+caption
                story.append(KeepTogether([image,Spacer(1,5),para(label,'CaptionReport'),Spacer(1,10)]))
    hp.append('</section>');htmlparts.append('\n'.join(hp))

doc=ReportDoc(OUT/'report_lab03_67070503444.pdf');doc.multiBuild(story)
nav='<nav><h2>Contents</h2>'+''.join(f'<p><a href="#part{i}">{html.escape(s["title"])} <span>p. {doc.section_pages["part"+str(i)]}</span></a></p>' for i,s in enumerate(sections,1))+'</nav>'
css='''@page{size:A4;margin:18mm 16mm}body{font:15px/1.55 Arial,sans-serif;color:#19332a;max-width:1050px;margin:30px auto;padding:20px}h1,h2,h3,h4{color:#176b4d}h2{border-bottom:2px solid #176b4d;padding-bottom:8px}section{break-before:page;margin-bottom:45px}.cover{min-height:65vh;padding:70px 30px}a{color:#176b4d}nav a{display:flex;justify-content:space-between}nav p{border-bottom:1px dotted #a2b9ac}figure{margin:25px 0;break-inside:avoid}img{display:block;max-width:100%;height:auto;border:1px solid #cad8d1}figcaption{font-size:13px;color:#52685d;margin-top:8px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{border:1px solid #cad8d1;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#e5f1e9}pre{font:12px/1.5 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f7f5;padding:12px}hr{border:0;border-top:1px solid #d2dfd7}'''
target=ROOT/'docs/lab-03/report.html'
output_html='< !doctype html><html lang="en"><meta charset="utf-8"><title>Lab 3 Report - 67070503444</title><style>'+css+'</style><body>'+htmlparts[0]+nav+''.join(htmlparts[1:])+'</body></html>'
target.write_text('\n'.join(line.rstrip() for line in output_html.replace('< !doctype','<!doctype').splitlines()),encoding='utf-8')
info={'pdf':str(OUT/'report_lab03_67070503444.pdf'),'html':str(target),'pages':len(PdfReader(OUT/'report_lab03_67070503444.pdf').pages),'figures':figure_no,'section_pages':doc.section_pages,'status':'documentation-review draft'}
(OUT/'report-build.json').write_text(json.dumps(info,indent=2),encoding='utf-8');print(json.dumps(info,indent=2))
