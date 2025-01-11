param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

git add .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git add failed"
    exit 1
}

git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git commit failed"
    exit 1
}

git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git push failed"
    exit 1
}

Write-Host "Successfully pushed changes to GitHub!" -ForegroundColor Green
