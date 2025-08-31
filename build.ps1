$manifestPath = "com.eladavron.litra-glow-commander.sdPlugin/manifest.json"
$manifest = Get-Content $manifestPath | ConvertFrom-Json
$version = $manifest.Version
Write-Host "Version: $version"
streamdeck stop com.eladavron.litra-glow-commander.sdPlugin
streamdeck pack com.eladavron.litra-glow-commander.sdPlugin --output dist/$version --force