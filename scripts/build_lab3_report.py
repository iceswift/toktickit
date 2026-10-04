"""Build matching HTML/PDF from retained source documents and real evidence.
Tables with long prose are rendered as labelled records to avoid tiny text.
Screenshot slices preserve all pixels and are labelled continuations.
"""
from pathlib import Path
import html, re, textwrap, json, shutil, os
from PIL import Image as PILImage, ImageChops
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, Image, KeepTogether, Table, TableStyle
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
REPORT_REF=os.environ.get('LAB3_REPORT_REF','docs/lab3-final-submission')
OUT=ROOT/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
EVID=ROOT/'artifacts/lab-03/released-main-evidence'; EVID.mkdir(parents=True,exist_ok=True)
SRC=ROOT/'output/playwright'
if not SRC.exists(): SRC=EVID
for item in SRC.iterdir():
    if item.suffix.lower() in ('.png','.jpg','.txt','.json') and (item.name.startswith(('release63-','step2-','step3-','login-','queue-','detail-','admin-','reset-','kanban-final','release-57','released-main','direct-security','review-conversation','late-author','issue-58','pr-44-linked','pr-47-linked','server-release60','client-release-60','e2e-release60','server-release-60-main-build','release60-clean')) or '-released-main-' in item.name):
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
p(s,'Author: iceswift. Original feature reviewer/merger: Richyboy170. Latest release reviewer/merger: jarbbie. Release PR #63 was approved at 13:43:20 UTC and merged into main at 13:51:55 UTC on 3 October 2026 (20:51 Bangkok). Latest released source: b65714ddd4cb733d4ad80983707d50ff618a0a1f. Product corrections are released; this report remains a content/layout review draft.')
p(s,'Issue #58 corrected account-switch edit fields and added separate priority/status badges. The regression failed before its fix. Richyboy170 merged correction #59 into staging and release #60 into main. At that historical release-60 checkpoint, server 42/42, client 29/29, E2E 9/9 and both builds passed. Latest release-63 verification is in Part 3.')
p(s,'The earlier release #60 Kanban checkpoint has 22 Done cards: 12 earlier Lab 1/2 cards plus all ten Lab 3 Issues (31,35,38,40,43,46,48,51,55,58). At that checkpoint all five other columns were zero. Captures below are overlapping real views, not a reconstructed board. Late closures, Development-link repairs and author acknowledgements are disclosed in reviewer.md; they are not backdated as timely original compliance.')
p(s,'Latest release #63 board: 23 Done cards (12 earlier Lab 1/2 plus eleven Lab 3 Issues), all five other columns zero. Issue #61 is Closed/Done with both merged #62/#63 linked. New captures below distinguish this from the earlier 22-card checkpoint.')
fig(s,E+'release63-kanban-empty-columns.jpg','Release #63: final unfiltered board, empty work columns.')
fig(s,E+'release63-kanban-done23.jpg','Final Done 23: latest Issue #61 with reviewer-merged PRs #62/#63.')
p(s,'Additional 4 October captures below use the visible is:closed filter: 23 closed product cards, including all eleven Lab 3 product Issues. Open documentation Issue #64 is excluded by this explicit filter, not represented as Done. Cards were visually checked after loading; incomplete historical loading placeholders are not used.')
for name,caption in [('report-closed-kanban-first.jpg','4 October closed-product Done view: complete Issue31/35 cards and linked merged PRs.'),('report-closed-kanban-auth.jpg','Closed-product Done view: Issue38/40/43 with merged PR links.'),('report-closed-kanban-middle.jpg','Closed-product Done view: Issue46/48/51 and their merged feature/documentation/release links.'),('report-closed-kanban-last.jpg','Closed-product Done view: correction Issues55/58/61, all Closed/Done; report Issue64 is explicitly outside this filtered checkpoint.'),('step2-release60-approval-event.jpg','Historical release #60: Richyboy170 approval/merge and author acknowledgement.')]:fig(s,E+name,caption)
log(s,'release63-lab3-branch-graph.txt','Actual complete Lab 3 ancestry: git log --graph --oneline --decorate origin/main ^337d745 (excludes the released Lab 2 baseline)')
p(s,'Contract-before-implementation proof: engineering-contract commits ee74c14 and 2eeffe8 were integrated in PR #32 / merge 42079a7 before migration commit 975cab6, authentication commit 3d34f8a and subsequent feature commits. The graph preserves feature merges into staging and staging releases into main.')
md(s,'docs/lab-03/reviewer.md')
fig(s,E+'report-pr41-current-full.jpg','PR #41: reviewer identity and four feedback sections in the actual conversation, captured on 4 October. Long GitHub code blocks scroll horizontally; their complete text is available in the linked original review, while reviewer.md above records all four points. This image is an overview, not a full-width transcription.')
fig(s,E+'report-pr41-current-full.jpg','PR #41: actual author response describing the four corrections in commit 8c5d5b7. A separate focused region from the same current conversation; not a reconstructed comment.')
md(s,'README.md'); md(s,'.gitignore')
p(s,'Repository layout is rendered in README above. It identifies client source/tests/E2E, server source/Prisma/tests, docs for each lab, compose.yaml and .gitignore. The evidence bundle is retained under artifacts/lab-03; output contains generated local artifacts, not product source.')

s=section('Part 2 - Spec DD and Definition of Done')
p(s,'The reviewed engineering contract below defines numbered functional/business requirements, the role matrix, acceptance criteria, status transitions, migration continuity and Definition of Done. It was committed before implementation, as shown in Part 1. A passing existing suite is not proof that every planned subcase exists; Part 3 retains the planned-to-actual limitations.')
md(s,'docs/lab-03/specification.md')

s=section('Part 3 - Test DD and Traceability')
p(s,'Latest verification used released main b65714d: server 42/42 in 16 files; client 33/33 in 11 files; Playwright 9/9; both production builds passed; seven Prisma migrations applied. Server/E2E used a separate clean migrated/seeded release-63 database on port 55434. No assertion or product source changed during this rerun. PR #63 has no configured CI checks; these are local executable results, not GitHub CI.')
md(s,'docs/lab-03/tests.md')
for name,title in [('release63-main-server-tests.txt','Complete latest-main server unit/API/authorization/regression output'),('release63-main-client-tests.txt','Complete latest-main client UI output'),('release63-main-e2e.txt','Complete latest-main Playwright E2E output'),('release63-main-server-build.txt','Latest-main server build'),('release63-main-client-build.txt','Latest-main client build'),('release63-main-migrations.txt','Latest-main migration status'),('release63-main-direct-api.txt','Latest-main direct authorization, ownership, non-final resolution and logout assertions'),('direct-security-evidence.txt','Historical c551061 additional content/session/throttling assertions; not relabelled as a new run')]:log(s,name,title)
p(s,'Supplemental assertions explicitly exercise anonymous access, wrong-role management, private-note denial, cross-owner safe 404, Requester resolution without formal status change, blank/overlength content, expired sessions and throttled login. All values are synthetic. No session cookie, token or personal password is included in the report. Injected UI failures elsewhere are distinguished from these real backend responses.')
p(s,'Failure provenance: the reused evidence DB server run passed 41/42 because a helper selected a reset-password demonstration account while assuming its seed password. The unchanged suite passed 42/42 on clean seeded data. This is a fixture-robustness limitation. An initial sandboxed E2E attempt failed at browser initialization; the unchanged permission-approved run passed 9/9. Both unsuccessful logs remain retained separately.')

s=section('Part 4 - AI Use with Reflection')
p(s,'The student confirmed GPT Sol6.0 and Sol6.1 in OpenAI Codex on 3 October. Nine actual user messages below illustrate analysis, planning and review support; English translations are labelled. This selection does not conceal AI implementation/test execution or claim student-executed checks. My Reflection is a draft for the student\'s personal read-through.')
md(s,'docs/lab-03/ai-use.md')

s=section('Part 5 - Working Login and Password Change UI')
p(s,'Authentication uses email/password, opaque server sessions and a first-login password-change gate. Invalid and inactive accounts show the same safe message. The role-aware shell displays the authenticated user, and logout revokes the session. Direct protected access, password change and logout are also covered by the passing E2E and API output in Part 3.')
for name,caption in [('login-invalid.png','Real invalid-credential login rejection: safe message without account disclosure.'),('login-inactive.png','Real inactive-account rejection: the same safe failure message.'),('login-busy.png','Controlled delayed login request: busy/disabled sign-in state. Browser route delay was injected for this UI evidence; not a backend performance claim.'),('login-network-failure.png','Controlled network abort: safe authentication failure. Browser fault injection is labelled explicitly.'),('reset-first-login-gate.png','Real synthetic account after Administrator initial-password reset: mandatory Change password before protected screens.')]:fig(s,E+name,caption)
fig(s,E+'release63-password-mismatch.png','Released main b65714d: required password rules and real unequal-confirmation rejection. Synthetic account password was not changed; masked inputs are retained.')
fig(s,E+'release63-requester-desktop.png','Released main b65714d: authenticated Requester shell with text-bearing role badge. Synthetic data; demo password gate cleared only after tests. Additional tablet/mobile originals are retained in the evidence bundle.')
fig(s,E+'release63-logout-login.png','Released-main real Logout returns to Sign in. Part 3 shows the corresponding protected-access 401 assertion.')

s=section('Part 6 - Working IT Staff Ticket Queue UI')
p(s,'Eight stable DEMO seed Tickets cover all eight statuses. Historical audit captures use thirteen additional synthetic EVID Tickets for pagination/action examples. They are demonstration data, not real service activity. Current final-main responsive captures and the released correction show separate Requested/IT Priority badges and status badges. Older queue captures establish operations, not the final badge presentation.')
for name,caption in [('queue-real.png','Real populated queue: assigned/unassigned records, status labels, priority values and detail actions.'),('report-pagination-page1.jpg','Current main, 4 October: filtered 21 temporary synthetic Tickets, Page 1 of 3. These fixtures are not seed or real service data.'),('report-pagination-page2.jpg','Actual Next action changes rows from PAGQA0021-0012 to PAGQA0011-0002, Page 2 of 3 with Previous/Next controls. All 21 fixtures were removed after capture and the original demo gate restored.'),('queue-seeded-search-sort.png','Search by exact DEMO prefix and sort by Ticket Number ascending.'),('queue-filter.png','Real status filter NEW narrows the eight seeded DEMO Tickets to the matching record.'),('queue-no-results.png','Real no-matching-results state after a nonmatching search.'),('queue-empty-injected.png','Empty-queue UI using a controlled successful empty API response. This is injected UI evidence, not a claim that the seeded database is empty.'),('queue-failure-injected.png','Queue API failure UI using a controlled HTTP 503 response.')]:fig(s,E+name,caption)
p(s,'The current desktop Queue screenshot in Part 9 shows separate Requested/IT Priority badges and status badges; it is not duplicated here.')

s=section('Part 7 - Working IT Staff Ticket Detail UI')
p(s,'Real synthetic Ticket TKT-20261002-EVID0001 demonstrates unassigned state, claim, reassignment, separate Requested/IT Priority, permitted status change, Public Comments and private Internal Notes. The Requester can indicate that the problem appears resolved without changing formal status; direct API assertions verify this and that private notes are absent from the Requester response. Attachment upload/removal continuity and cross-owner protection are covered by the passing Lab 2 regression E2E/API output in Part 3.')
for name,caption in [('detail-before-actions.png','Real unassigned staff Ticket Detail before operations.'),('detail-claimed.png','Claim Ticket assigns Iris Nattapong as owner.'),('detail-priority-public-private.png','Urgent IT Priority is distinct from Requested Priority High. Public Comment and visually separated private Internal Note were saved.'),('detail-reassigned.png','Real reassignment from Iris Nattapong to Jonas Miller.'),('detail-in-progress.png','Permitted transition to IN_PROGRESS with success feedback.'),('detail-invalid-transition.png','Real OPEN to CLOSED attempt rejected by backend; formal status remains OPEN.')]:fig(s,E+name,caption)
fig(s,E+'step3-requester-public-resolution.png','Historical release-60 Requester capture: actual Public Comment and problem-appears-resolved indication, while formal status remains New. This is not relabelled as a release-63 capture; current main direct API assertions repeat the status/ownership checks.')
fig(s,E+'admin-priority-correction.png','Released-main b65714d E2E capture: Administrator saves IT Priority while formal status is disabled and Staff-only claim/comment/note controls are absent. The E2E restores the original priority afterward.')
fig(s,E+'release63-staff-attachment.png','Released-main b65714d: Staff detail retains metadata of the PDF uploaded by the authenticated Requester. The file is the supplied course handout on a synthetic Ticket; temporary capture gates were restored after evidence collection.')
log(s,'release63-attachment-continuity.txt','Actual supplementary attachment upload/Staff visibility/download/soft-removal/blocked-download assertions on current main')
p(s,'Authorization evidence is actual output in Part 3: Requester staff-note access 403, cross-owner Ticket 404, owned public response 200 with no internalNotes field, Requester formal-status write 403, blank comment and overlength note 400. Administrator priority permission is also covered by its passing UI/API/E2E regression. The private-note panel is not available to Requesters.')

s=section('Part 8 - Working Administrator User Management UI')
p(s,'Administrator User Management provides searchable/filterable users, one role per account, active/inactive status, create/edit and initial-password reset. Evidence Requester is a synthetic audit-only account. Backend protections reject duplicate email and last-active-Administrator demotion; self-deactivation is disabled in the UI and rejected by API tests. Password reset revokes existing sessions and requires first-login change; the actual next-login gate appears in Part 5. Wrong-role access is denied directly by the backend in Part 3.')
for name,caption in [('admin-search-filter.png','Real search for Iris combined with IT_STAFF role filtering.'),('admin-created.png','Real synthetic account creation; success requires first-login password change.'),('admin-duplicate.png','Real duplicate-email rejection from backend.'),('admin-self-protection.png','Self-deactivation control disabled with an explicit explanation.'),('admin-last-admin-rejected.png','Real last-active-Administrator demotion rejected; Administrator remains protected.'),('admin-password-reset.png','Real initial-password reset succeeded, with session-revocation/next-login warning.'),('admin-failure-injected.png','Safe User Management API failure using a controlled HTTP 503 response.')]:fig(s,E+name,caption)
p(s,'Part 9 contains the current complete User Management list and responsive role/status badges. The four-field edit demonstration below supersedes the narrower earlier edit screenshot. Account-switch regression coverage is recorded in Part 3. All earlier originals remain retained, without repeating unchanged screens in this PDF.')
fig(s,E+'release63-admin-invalid-password.png','Released main b65714d: actual backend rejection of an initial password lacking required complexity. Input values remain; no account was created. Synthetic demo Administrator gate was temporarily cleared after tests for this capture.')
fig(s,E+'release63-admin-edit-four-fields.png','Real four-field demonstration before Save: synthetic account name/email changed, role Requester to IT Staff, Active unchecked. The list above still shows its original values.')
fig(s,E+'release63-admin-edit-saved.png','Actual saved result: Edited Evidence User, edited.evidence@example.test, IT_STAFF and Inactive. Database read-back independently verified all four values. Only this temporary demonstration user is cleaned up afterward.')
p(s,'Validation limitation: the weak-password rejection is a page-level alert saying to correct highlighted fields, but the current form does not actually highlight the offending field. The backend rejects the input correctly; field-specific UI validation is not claimed as complete.')

s=section('Part 9 - Zen Green UI and Responsive Evidence')
md(s,'docs/lab-03/ui-spec.md')
p(s,'Five major screens were captured during the final-main E2E rerun at desktop 1280x900, tablet 820x900 and mobile 390x844. Overflow assertions passed in all views. Long screens continue across labelled slices rather than unreadable thumbnails. The checklist distinguishes visual inspection from automated width assertions and does not claim measured accessibility conformance.')
for screen,label in [('login','Login'),('change-password','Change Password'),('queue','Ticket Queue'),('staff-detail','Staff Ticket Detail'),('user-management','User Management')]:
    for device in ['desktop','tablet','mobile']:fig(s,Q+screen+'-'+device+'.png',f'{label} - {device}. Captured by the released-main b65714d responsive E2E rerun on 3 October.')
p(s,'Badge audit: the Section 7 role-badge gap is fixed and released through #62/#63. Latest-main User Management and authenticated shell roles use text-bearing badges; status/priority remain distinct. Actual 33 client tests and current-main responsive images support this correction. The completed, qualified checklist above records observations and the tablet native-select truncation limitation; no measured accessibility conformance is claimed.')
fig(s,E+'release63-keyboard-focus.png','Released main b65714d: pressing Tab focuses Email with a clearly visible ring. A focused control example, not a full WCAG audit.')
p(s,'Content evidence has been reconciled with the nine required Parts, including the completed qualified visual checklist. This peer-review copy has undergone every-page layout inspection and structural checks. Remaining submission gates are the student personal-reflection read-through and reviewer-merged documentation integration, followed by the final revision/Done-board reconciliation. Recorded UI/test-plan limitations remain disclosed rather than certified as complete. Release #63 and main tests are verified; this is a peer-review copy, not a submission-readiness certificate.')

pdfmetrics.registerFont(TTFont('ReportArial','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ReportArialBold','C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('ReportArial',normal='ReportArial',bold='ReportArialBold',italic='ReportArial',boldItalic='ReportArialBold')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyReport',fontName='ReportArial',fontSize=9.5,leading=14,spaceAfter=7,textColor=colors.HexColor('#19332a')))
styles.add(ParagraphStyle(name='SectionReport',fontName='ReportArialBold',fontSize=16,leading=20,textColor=colors.HexColor('#176b4d'),spaceAfter=12))
styles.add(ParagraphStyle(name='SubReport',parent=styles['BodyReport'],fontName='ReportArialBold',fontSize=11.5,leading=16,spaceBefore=8))
styles.add(ParagraphStyle(name='CaptionReport',parent=styles['BodyReport'],fontSize=8.5,leading=12,textColor=colors.HexColor('#52685d')))
styles.add(ParagraphStyle(name='CodeReport',fontName='Courier',fontSize=8,leading=10,spaceAfter=0))
styles.add(ParagraphStyle(name='CoverReport',fontName='ReportArialBold',fontSize=29,leading=36,textColor=colors.HexColor('#176b4d'),spaceAfter=16))
def clean(text):
    text=text.replace('\ufeff','').replace('–','-').replace('—','-').replace('→','->').replace('×','x').replace('✓','PASS').replace('›','>').replace('\u2011','-')
    # Console box borders use ASCII in print; all diagnostic content is retained.
    return ''.join(('|' if ch in '│┃║' else '-' if ch in '─━═' else '+') if '\u2500' <= ch <= '\u257f' else ch for ch in text)
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
story += [Spacer(1,115),para('CPE334 Software Engineering Laboratory','SubReport'),para('TokTickIT - Lab 3 Report','CoverReport'),para('Authentication, roles, staff operations and administration'),Spacer(1,28),para('Suwiwat Sinsomboon | 67070503444'),para('[Repository: iceswift/toktickit](https://github.com/iceswift/toktickit)'),para('Verified product: released main b65714d | 3 October 2026'),para('Peer-review copy - documentation integration and personal reflection review remain.'),PageBreak(),para('Contents','SectionReport')]
toc=TableOfContents();toc.levelStyles=[ParagraphStyle(name='TOCReport',fontName='ReportArial',fontSize=10,leading=20,leftIndent=0,firstLineIndent=0)];story += [toc,PageBreak()]
htmlparts.append('<section class="cover"><h1>TokTickIT<br>Lab 3 Report</h1><p>Suwiwat Sinsomboon | 67070503444</p><p>Released product main b65714d - 3 October 2026 - content-review draft</p></section>')
for index,s in enumerate(sections,1):
    if index>1:story.append(PageBreak())
    heading=para(s['title'],'SectionReport');heading.section_key='part'+str(index);story.append(heading)
    hp=[f'<section id="part{index}"><h2>{html.escape(s["title"])}</h2>']
    for item in s['items']:
        kind=item[0]
        if kind=='p':story.append(para(item[1]));hp.append('<p>'+inline(item[1])+'</p>')
        elif kind in ('md','log'):
            path,label=item[1:];story.append(para('Rendered '+label if kind=='md' else label,'SubReport'));hp.append('<h3>'+html.escape(label)+'</h3>')
            if kind=='md':
                source_url='https://github.com/iceswift/toktickit/blob/'+REPORT_REF+'/'+label
                source_label='[Rendered source revision]('+source_url+') - document-only peer-review branch; integration into main is pending.'
                story.append(para(source_label,'CaptionReport'));hp.append('<p>'+inline(source_label)+'</p>')
            text=path.read_text(encoding='utf-8-sig')
            entries=blocks(text) if kind=='md' and label!='.gitignore' else [('code',text)]
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
                        # ID columns can be narrow, but screen/requirement names cannot.
                        narrow_id = len(value[0][0]) <= 5 and all(len(row[0]) <= 12 for row in value[1:])
                        widths={2:[.30,.70],3:([.10,.41,.49] if narrow_id else [.24,.38,.38]),4:[.30,.20,.20,.30],5:[.14,.16,.14,.28,.28]}.get(cols,[1/cols]*cols)
                        data=[[Paragraph(inline('**'+cell+'**' if ri==0 else cell),cellstyle) for cell in row] for ri,row in enumerate(value)]
                        table=Table(data,colWidths=[WIDTH*v for v in widths],repeatRows=1,hAlign='LEFT')
                        table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e5f1e9')),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#c9d7d0')),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
                        story.append(table);story.append(Spacer(1,10))
                elif bk=='code':
                    hp.append('<pre>'+html.escape(clean(value))+'</pre>')
                    for line in clean(value).splitlines():
                        for part in textwrap.wrap(line,100,replace_whitespace=False,drop_whitespace=False) or [' ']:story.append(Paragraph(html.escape(part).replace(' ','&#160;'),styles['CodeReport']))
                    story.append(Spacer(1,7))
                else:story.append(para(value));hp.append('<p>'+inline(value)+'</p>')
        elif kind=='fig':
            path,caption=item[1:];figure_no+=1
            hp.append(f'<figure><img src="../../{path.relative_to(ROOT).as_posix()}" alt="{html.escape(caption,quote=True)}"><figcaption>Figure {figure_no}. {html.escape(caption)}</figcaption></figure>')
            im=PILImage.open(path); w,h=im.size
            # Separate, explicitly labelled panels omit unchanged middle rows.
            # They are not pasted into a synthetic continuous screenshot.
            panel_regions={
                'admin-duplicate.png':[(0,0,w,280),(90,1090,w-90,1445)],
                'admin-self-protection.png':[(90,1090,w-90,1380)],
                'admin-last-admin-rejected.png':[(0,0,w,280),(90,1090,w-90,1380)],
                'release63-admin-invalid-password.png':[(0,0,w,280),(90,1055,w-90,1410)],
                'admin-created.png':[(0,0,w,720)],
                'admin-password-reset.png':[(0,0,w,720)],
                'release63-admin-edit-four-fields.png':[(0,0,w,805)],
                'release63-admin-edit-saved.png':[(0,0,w,490)],
            }
            for action_capture in ('detail-before-actions.png','detail-claimed.png','detail-reassigned.png','detail-in-progress.png','detail-invalid-transition.png'):
                panel_regions[action_capture]=[(90,90,w-90,225 if action_capture=='detail-before-actions.png' else 300),(90,465 if action_capture=='detail-before-actions.png' else 540,w-90,880 if action_capture=='detail-before-actions.png' else 955)]
            if path.name in panel_regions:
                panels=[]
                for panel_index,box in enumerate(panel_regions[path.name],1):
                    crop=im.crop(box);ip=OUT/f'figure-{figure_no:02}-panel-{panel_index}.png';crop.save(ip)
                    panels.extend([para(f'Figure {figure_no}, panel {panel_index}: actual focused source region; unchanged surrounding content omitted.','CaptionReport'),Image(str(ip),width=WIDTH,height=WIDTH*crop.height/crop.width),Spacer(1,8)])
                panels.append(para(f'Figure {figure_no}. '+caption+' Full original retained in the evidence bundle.','CaptionReport'))
                panels.append(Spacer(1,10));story.append(KeepTogether(panels))
                continue
            # Focused crops are actual contiguous source regions, never recomposed UI.
            # Every original remains retained; caption says what the focused region proves.
            if path.name=='report-pr41-current-full.jpg':
                box=(88,850,889,2360) if 'reviewer identity' in caption else (104,2439,889,2849)
                im=im.crop(box);w,h=im.size
                path=OUT/f'figure-{figure_no:02}-focus.png';im.save(path)
            elif path.name.startswith(('step2-final-kanban-lab3-','report-closed-kanban-')) or path.name=='release63-kanban-done23.jpg':
                im=im.crop((870,210,1225,700));w,h=im.size
                path=OUT/f'figure-{figure_no:02}-focus.png';im.save(path)
                caption+=' Focused Done-column crop; board overview appears above.'
            elif path.name in ('detail-before-actions.png','detail-claimed.png','detail-reassigned.png','detail-in-progress.png','detail-invalid-transition.png'):
                im=im.crop((90,90,w-90,min(h,960)));w,h=im.size
                path=OUT/f'figure-{figure_no:02}-focus.png';im.save(path)
                caption+=' Focused Ticket identity, result and Staff-controls region; unchanged lower panels omitted.'
            elif path.name=='release63-requester-desktop.png':
                im=im.crop((0,0,w,min(h,650)));w,h=im.size
                path=OUT/f'figure-{figure_no:02}-focus.png';im.save(path)
                caption+=' Focused authenticated shell and leading Ticket rows; full original retained.'
            # Remove only exterior white margins on standalone authentication cards.
            # Original, uncropped files remain linked in HTML and in the evidence bundle.
            auth_card=item[1].name.startswith(('login-','reset-first-login','release63-password','release63-keyboard','release63-logout-login')) or item[1].name.startswith(('login','change-password'))
            if auth_card:
                diff=ImageChops.difference(im.convert('RGB'),PILImage.new('RGB',im.size,'white'))
                bbox=diff.point(lambda v: 255 if v>16 else 0).getbbox()
                if bbox:
                    left,top,right,bottom=bbox
                    im=im.crop((max(0,left-12),max(0,top-12),min(w,right+12),min(h,bottom+12)))
                    w,h=im.size;path=OUT/f'figure-{figure_no:02}-trim.png';im.save(path)
            elif item[1].parent==EVID and item[1].suffix.lower()=='.png':
                # Only exterior bottom whitespace is removed from operational captures.
                # Full viewport/responsive originals in Part 9 are not trimmed here.
                diff=ImageChops.difference(im.convert('RGB'),PILImage.new('RGB',im.size,'white'))
                bbox=diff.point(lambda v:255 if v>16 else 0).getbbox()
                if bbox and bbox[3]+12<h:
                    im=im.crop((0,0,w,bbox[3]+12));w,h=im.size
                    path=OUT/f'figure-{figure_no:02}-trim.png';im.save(path)
            # Tile by actual print height, preserving all pixels and readable phone width.
            dw=min(WIDTH,245 if auth_card and w>420 else 175 if w<600 else WIDTH)
            if item[1].name.startswith(('step2-final-kanban-lab3-','report-closed-kanban-')) or item[1].name=='release63-kanban-done23.jpg':dw=220
            # Keep ordinary desktop captures intact; small height fitting is preferable
            # to a second page showing an unchanged half of the same screen.
            first_label=f'Figure {figure_no}. '+caption
            cap_height=para(first_label,'CaptionReport').wrap(WIDTH,1000)[1]+7
            available= A4[1]-85-cap_height-22
            if w>=600 and dw*h/w<=available+40:dw=min(dw,available*w/h)
            max_pixels=int(available*w/dw)
            # Prefer a light horizontal gap near a cut, not the middle of a label/control.
            bounds=[0];gray=im.convert('L')
            while h-bounds[-1]>max_pixels:
                target=bounds[-1]+max_pixels
                low=max(bounds[-1]+int(max_pixels*.65),target-120)
                high=min(h-1,target)
                def row_score(y):
                    row=gray.crop((0,y,w,min(h,y+3))).resize((max(1,w//4),1))
                    dark=sum(v<150 for v in row.get_flattened_data())
                    return dark, abs(y-target)
                cut=min(range(low,high+1),key=row_score)
                bounds.append(cut)
            bounds.append(h)
            semantic_cuts={'queue-tablet.png':1129,'queue-mobile.png':1650,'staff-detail-tablet.png':957,'staff-detail-mobile.png':1097}
            if item[1].parent==ROOT/Q and item[1].name=='queue-mobile.png':dw=165
            if item[1].parent==ROOT/Q and item[1].name in semantic_cuts:
                target=semantic_cuts[item[1].name]
                cut=target if item[1].name=='queue-mobile.png' else min(range(max(1,target-15),min(h-1,target+15)),key=lambda y:(sum(v<200 for v in gray.crop((0,y,w,y+1)).get_flattened_data()),abs(y-target)))
                bounds=[0,cut,h]
            segments=len(bounds)-1
            for n in range(segments):
                if segments==1:ip=path;cw,ch=w,h
                else:
                    crop=im.crop((0,bounds[n],w,bounds[n+1]));ip=OUT/f'figure-{figure_no:02}-{n+1}.png';crop.save(ip);cw,ch=crop.size
                # Phone evidence stays at natural readable width, rather than stretched across A4.
                dh=dw*ch/cw
                image=Image(str(ip),width=dw,height=dh,hAlign='CENTER')
                label=f'Figure {figure_no}'+(f' ({n+1}/{segments})' if segments>1 else '')+'. '+(caption if n==0 else 'Continuation; full original retained in the evidence bundle.')
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
