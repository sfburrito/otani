param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

# Add all changes
git add .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Commit with message
git commit -m "$CommitMessage"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Push to origin
git push origin main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Successfully pushed changes to GitHub!" -ForegroundColor Green
