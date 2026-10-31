# Lab4 report build and release boundary

`scripts/build_lab4_report.py` is the maintained report source/content model.
It renders the required current Markdown and retains real screenshot provenance,
complete local runner outputs, nine ordered Parts, PDF bookmarks and linked
page-numbered contents. Matching HTML is docs/lab-04/report.html; generated
PDF/build metadata/image crops stay under ignored output/pdf.

Runtime: Python with reportlab4.4.9, Pillow, pypdf and uharfbuzz (Thai shaping),
Windows Tahoma fonts, Poppler pdftoppm. These are document tools, not product
package dependencies. Use the bundled runtime or an equivalent local environment.

```text
python scripts/build_lab4_report.py
pdftoppm -scale-to 1200 -png output/pdf/report_lab04_67070503444.pdf output/pdf/lab4-review-qa/page
python scripts/check_lab4_report.py
python scripts/verify_lab4_contract.py
```

Create output/pdf/lab4-review-qa first. If rebuilding to fewer pages, preserve or
remove only previously generated page-NN.png files in that explicit directory;
never delete evidence originals. Inspect every current page, not just structural
counts or contact-sheet thumbnails. Re-render affected pages at higher resolution
when small text/Thai shaping/image boundaries need checking.

No browser printing is used, so browser date/title/file-URL headers are absent.
PDF page numbers are deliberately authored footers; HTML contents links jump to
anchors and display the companion PDF's actual section page numbers.

## Review copy versus final submission

The builder currently emits REVIEW COPY and requires real local pass markers.
It intentionally cannot make a final submission merely by changing a title.
After reviewer approval/merge of this increment and the Release PR, record actual
release metadata/fetched main identity and run complete tests/builds/migrations
from that released main with isolated synthetic databases. Keep generated final
observations under ignored output with exact source identity/time, append the
observed release proof to the final document, then verify Issue75 acceptance and
the actual all-eight-Issue Done board. Rebuild/inspect the final single PDF.

Do not edit/push main directly or open self-referential cleanup PRs just to insert
a future event into its own already-reviewed source. Existing reviewer.md records
the dated feature-integration checkpoint; a final observed-release addendum must
be identified as later generated evidence, not silently relabelled committed text.
Do not request student model/reflection again; both are already explicitly confirmed.
