param([string]$EvidenceDirectory = 'artifacts/lab-04/phase7')
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $repo $EvidenceDirectory
if (-not (Test-Path -LiteralPath $destination -PathType Container)) { throw 'Evidence directory must already exist.' }
# Read only selected public source paths; never enumerate .env or credentials.
Push-Location $repo
try {
    $paths = @('client/src','client/tests','client/e2e','client/package.json',
        'client/package-lock.json','client/playwright.lab4.config.ts',
        'client/playwright.lab4-qa.config.ts','server/src','server/tests',
        'server/scripts','server/prisma/migrations','server/prisma/schema.prisma',
        'server/prisma/seed.ts','server/package.json','server/package-lock.json','scripts')
    $files = @(git ls-files --cached --others --exclude-standard -- $paths | Sort-Object -Unique)
    $hashes = foreach ($relative in $files) {
        $full = Join-Path $repo $relative
        if (Test-Path -LiteralPath $full -PathType Leaf) {
            [ordered]@{ path=$relative; sha256=(Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLower() }
        }
    }
    $record = [ordered]@{
        capturedAt=(Get-Date).ToUniversalTime().ToString('o')
        branch=(git branch --show-current)
        baseHead=(git rev-parse HEAD)
        scope='Working-tree source fingerprints, not a clean-main or peer-acceptance assertion'
        node=(& node --version); npm=(& npm.cmd --version)
        installNpm='11.6.2 (npx package, no global update)'
        sources=@($hashes)
    }
    $record | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $destination 'source-fingerprints.json') -Encoding utf8
    Write-Output "Captured $($files.Count) selected public source entries."
} finally { Pop-Location }
