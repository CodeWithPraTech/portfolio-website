$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Python = $env:PYTHON

if (-not $Python) {
  $Python = "python"
}

Push-Location $ProjectRoot
try {
  $env:PYTHONPATH = $ProjectRoot
  & $Python -m src.pipeline.run_etl --lookback 6mo
}
finally {
  Pop-Location
}
