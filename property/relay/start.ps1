[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT' -or -not [Environment]::Is64BitOperatingSystem) {
    throw 'Este pacote requer Windows x64.'
}
$DataDir = if ($env:PROPERTY_RELAY_DATA_DIR) { $env:PROPERTY_RELAY_DATA_DIR } else { Join-Path $env:LOCALAPPDATA 'Property\relay' }
$ConfigDir = if ($env:PROPERTY_RELAY_CONFIG_DIR) { $env:PROPERTY_RELAY_CONFIG_DIR } else { Join-Path $env:LOCALAPPDATA 'Property\config' }
$HostName = if ($env:PROPERTY_RELAY_HOST) { $env:PROPERTY_RELAY_HOST } else { '127.0.0.1' }
$PortText = if ($env:PROPERTY_RELAY_PORT) { $env:PROPERTY_RELAY_PORT } else { '7447' }
if ($PortText -notmatch '^[0-9]+$' -or [long]$PortText -lt 1 -or [long]$PortText -gt 65535) { throw 'Porta inválida.' }
if ($HostName -notmatch '^[a-zA-Z0-9.:-]+$') { throw 'Host inválido.' }
$Config = if ($env:PROPERTY_RELAY_CONFIG) { $env:PROPERTY_RELAY_CONFIG } else { Join-Path $ConfigDir 'geode.toml' }
$Runtime = Join-Path $DataDir 'runtime'
New-Item -ItemType Directory -Path $DataDir,$ConfigDir,$Runtime -Force | Out-Null
$PartsDir = Join-Path $PSScriptRoot 'portable\windows-x64'
$Manifest = Get-Content -LiteralPath (Join-Path $PartsDir 'manifest.json') -Raw | ConvertFrom-Json
$ExpectedHash = 'f6572a19f26bbd6ec6f6b57a7d876dc18e90e14572abbae8b07351d9269c03a3'
if ($Manifest.archive_sha256 -ne $ExpectedHash -or $Manifest.platform -ne 'windows-x64') { throw 'Manifesto inválido.' }
$Archive = Join-Path $Runtime 'property-windows-x64.zip'
if (-not (Test-Path -LiteralPath $Archive)) {
    $Temporary = "$Archive.tmp.$PID"
    try {
        $Output = [IO.File]::Create($Temporary)
        try {
            foreach ($Part in $Manifest.parts) {
                if ($Part.file -notmatch '^part-[0-9]{3}$') { throw 'Segmento inválido.' }
                $PartPath = Join-Path $PartsDir $Part.file
                if ((Get-FileHash -LiteralPath $PartPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Part.sha256) { throw "Hash inválido: $($Part.file)" }
                $InputStream = [IO.File]::OpenRead($PartPath)
                try { $InputStream.CopyTo($Output) } finally { $InputStream.Dispose() }
            }
        } finally { $Output.Dispose() }
        if ((Get-FileHash -LiteralPath $Temporary -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedHash) { throw 'Hash do pacote não confere.' }
        Move-Item -LiteralPath $Temporary -Destination $Archive
    } finally { if (Test-Path -LiteralPath $Temporary) { Remove-Item -LiteralPath $Temporary } }
}
if ((Get-FileHash -LiteralPath $Archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedHash) { throw 'Hash do pacote não confere.' }
$Java = Join-Path $Runtime 'geode\runtime\bin\java.exe'
if (-not (Test-Path -LiteralPath $Java)) { Expand-Archive -LiteralPath $Archive -DestinationPath $Runtime -Force }
if (-not (Test-Path -LiteralPath $Config)) {
    $Database = (Join-Path $DataDir 'events.db').Replace('\','\\').Replace('"','\"')
    $Text = @"
[info]
name = "Property Geode Relay"
description = "Relay Nostr pessoal Property"
[network]
host = "$HostName"
port = $PortText
path = "/"
[database]
in_memory = false
file = "$Database"
[options]
verify_signatures = true
require_auth = false
"@
    [IO.File]::WriteAllText($Config, $Text, (New-Object Text.UTF8Encoding $false))
}
Write-Host "Iniciando Property em ${HostName}:$PortText`nDados: $DataDir"
& $Java '-cp' (Join-Path $Runtime 'geode\lib\*') 'com.vitorpamplona.geode.MainKt' '--config' $Config '--host' $HostName '--port' $PortText
exit $LASTEXITCODE
