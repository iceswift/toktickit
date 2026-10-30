$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$evidence = Join-Path $repo 'artifacts/lab-04/phase7'
$visual = Join-Path $repo 'output/playwright/phase7/visual'
$selected = @{
    server='server-final-consistent-fixture-output.txt'
    client='client-final-output.txt'
    browser='e2e-final-verified-output.txt'
}
foreach ($pair in @(@('server','Tests\s+272 passed'),@('client','Tests\s+90 passed'),@('browser','37 passed'))) {
    $raw = Get-Content -LiteralPath (Join-Path $evidence $selected[$pair[0]]) -Raw
    if ($raw -notmatch $pair[1]) { throw "Missing complete passing output: $($pair[0])" }
}
$axeFiles = @(Get-ChildItem -LiteralPath $visual -Filter '*-axe.json')
$consoleFiles = @(Get-ChildItem -LiteralPath $visual -Filter '*-console.json')
if ($axeFiles.Count -ne 48 -or $consoleFiles.Count -ne 10) { throw 'Expected48 completed per-screen axe reports and10 console reports.' }
$incompleteRules = @()
foreach ($file in $axeFiles) {
    $report = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
    if (@($report.violations).Count) { throw "Unresolved axe violation in $($file.Name)" }
    $incompleteRules += @($report.incomplete | ForEach-Object { $_.id })
}
$incompleteRules = @($incompleteRules | Sort-Object -Unique)
if (@($incompleteRules | Where-Object { $_ -ne 'color-contrast' }).Count) { throw 'New incomplete axe rule requires explicit manual review.' }
foreach ($file in $consoleFiles) {
    $report = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
    if (@($report.unexpected).Count) { throw "Unexpected console/runtime error in $($file.Name)" }
}
foreach ($package in @('client','server')) {
    $audit = Get-Content -LiteralPath (Join-Path $evidence "$package-audit-after.json") -Raw | ConvertFrom-Json
    if ($audit.metadata.vulnerabilities.total -ne 0) { throw "Review $package dependency advisories before publication." }
}
$screenshots = Join-Path $evidence 'screenshots'
$a11y = Join-Path $evidence 'a11y'
$console = Join-Path $evidence 'console'
foreach ($directory in @($screenshots,$a11y,$console)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
foreach ($file in Get-ChildItem -LiteralPath $visual -Filter '*.png') { Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $screenshots $file.Name) -Force }
foreach ($file in $axeFiles) { Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $a11y $file.Name) -Force }
foreach ($file in $consoleFiles) { Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $console $file.Name) -Force }
foreach ($size in @('desktop','tablet','mobile')) {
    $file = Join-Path $repo "output/playwright/phase7/legacy-roles/change-password-$size.png"
    Copy-Item -LiteralPath $file -Destination (Join-Path $screenshots "change-password-$size.png") -Force
}
$images = @(Get-ChildItem -LiteralPath $screenshots -Filter '*.png')
if ($images.Count -ne 64) { throw 'Expected49 full-context/injected captures +12 panels +3 baseline first-login images.' }
$summary = [ordered]@{
    capturedAt=(Get-Date).ToUniversalTime().ToString('o')
    scope='LOCAL Phase7 feature-tree verification, not final main/CI/peer acceptance'
    serverTests=272; clientTests=90; browserScenarios=37
    selectedOutputs=$selected; screenshots=64; axeScreens=48; axeViolations=0
    incompleteRules=$incompleteRules; manualReview='Native select SVG background: checked text colors and rendered captures; not complete screen-reader certification'
    consoleScenarios=10; unexpectedConsoleOrRuntimeErrors=0
    expectedConsole='Exact auth/me401 before login, and explicitly injected internal-notes503 only; raw records retained'
    dependencyAdvisories=@{client=0;server=0}
}
$summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $evidence 'evidence-summary.json') -Encoding utf8
& (Join-Path $PSScriptRoot 'collect_lab4_qa_evidence.ps1')
Write-Output 'PASS: final outputs/reports checked; actual assets copied and source fingerprints collected.'
