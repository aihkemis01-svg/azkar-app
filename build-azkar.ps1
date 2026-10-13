# build-azkar.ps1
# Run from INSIDE the azkar_source folder:
#   powershell -ExecutionPolicy Bypass -File .\build-azkar.ps1
# Expects ..\azkar-release.keystore (alias: azkar). Builds, signs, verifies, optionally uploads.
param(
  [int]$VersionCode = 5,
  [string]$VersionName = "1.3",
  [string]$Alias = "azkar",
  [string]$Keystore = "..\azkar-release.keystore",
  [string]$OutApk = "..\azkar_v1.3.apk",
  [string]$Repo = "aihkemis01-svg/azkar-app",
  [string]$Tag = "v1.3"
)
$ErrorActionPreference = "Stop"
function Check($what) { if ($LASTEXITCODE -ne 0) { throw "FAILED: $what" } }

if (-not (Test-Path "web\index.html") -or -not (Test-Path "android\AndroidManifest.xml")) {
  throw "Run this script from inside the azkar_source folder."
}
if (-not (Test-Path $Keystore)) { throw "Keystore not found: $Keystore" }

# ---- locate Android SDK tools ----
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$bt = Get-ChildItem "$sdk\build-tools" -Directory |
  Sort-Object { [version]($_.Name -replace '[^0-9.].*$','') } |
  Select-Object -Last 1 -ExpandProperty FullName
$jar = "$sdk\platforms\android-36\android.jar"
if (-not (Test-Path $jar)) {
  $jar = Get-ChildItem "$sdk\platforms\android-*\android.jar" | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $bt -or -not (Test-Path "$bt\aapt2.exe")) { throw "build-tools not found under $sdk" }
if (-not $jar -or -not (Test-Path $jar)) { throw "android.jar not found under $sdk\platforms" }
Write-Host "build-tools: $bt"
Write-Host "android.jar: $jar"

# ---- 1. inline css/js/fonts into ONE index.html (avoids the backslash-path bug of aapt2 on Windows) ----
Write-Host "`n[1/7] Inlining web files into a single index.html..."
$utf8 = New-Object Text.UTF8Encoding($false)
$web = Join-Path $PWD "web"
$html = [IO.File]::ReadAllText("$web\index.html", $utf8)

foreach ($m in [regex]::Matches($html, '<link rel="stylesheet" href="([^"]+)">')) {
  $css = [IO.File]::ReadAllText((Join-Path $web ($m.Groups[1].Value -replace '/','\')), $utf8)
  foreach ($f in [regex]::Matches($css, 'url\(\.\./(fonts/[^)]+\.woff2)\)')) {
    $bytes = [IO.File]::ReadAllBytes((Join-Path $web ($f.Groups[1].Value -replace '/','\')))
    $b64 = [Convert]::ToBase64String($bytes)
    $css = $css.Replace($f.Value, "url(data:font/woff2;base64,$b64)")
  }
  $html = $html.Replace($m.Value, "<style>`n$css`n</style>")
}
foreach ($m in [regex]::Matches($html, '<script src="([^"]+)"></script>')) {
  $js = [IO.File]::ReadAllText((Join-Path $web ($m.Groups[1].Value -replace '/','\')), $utf8)
  $js = $js.Replace('</script', '<\/script')
  $html = $html.Replace($m.Value, "<script>`n$js`n</script>")
}
$left = ([regex]::Matches($html, '<link rel="stylesheet"|<script src=')).Count
if ($left -ne 0) { throw "Inlining incomplete ($left external references left)" }
New-Item -ItemType Directory -Force web_single | Out-Null
[IO.File]::WriteAllText("$PWD\web_single\index.html", $html, $utf8)
Write-Host ("index.html size: " + (Get-Item web_single\index.html).Length + " bytes")

# ---- 2. resources ----
Write-Host "`n[2/7] Compiling resources..."
Remove-Item res.zip, base.apk, aligned.apk, obj, dex, gen -Recurse -Force -ErrorAction SilentlyContinue
& "$bt\aapt2.exe" compile --dir android\res -o res.zip; Check "aapt2 compile"
& "$bt\aapt2.exe" link -o base.apk -I $jar --manifest android\AndroidManifest.xml --java gen -A web_single `
  --min-sdk-version 21 --target-sdk-version 33 --version-code $VersionCode --version-name $VersionName res.zip
Check "aapt2 link"

# ---- 3. java -> dex ----
Write-Host "`n[3/7] Compiling Java..."
New-Item -ItemType Directory obj, dex -Force | Out-Null
$java = Get-ChildItem android\src, gen -Recurse -Filter *.java | Select-Object -ExpandProperty FullName
& javac --release 8 -classpath $jar -d obj $java; Check "javac"
$cls = Get-ChildItem obj -Recurse -Filter *.class | Select-Object -ExpandProperty FullName
& "$bt\d8.bat" --lib $jar --min-api 21 --output dex $cls; Check "d8"

# ---- 4. add dex, align ----
Write-Host "`n[4/7] Packing and aligning..."
Push-Location dex
& jar uf ..\base.apk classes.dex; Check "jar uf"
Pop-Location
& "$bt\zipalign.exe" -f -p 4 base.apk aligned.apk; Check "zipalign"

# ---- 5. sign (you will be asked for the keystore password) ----
Write-Host "`n[5/7] Signing - type the keystore password when asked..."
Remove-Item $OutApk -ErrorAction SilentlyContinue
& "$bt\apksigner.bat" sign --ks $Keystore --ks-key-alias $Alias --out $OutApk aligned.apk; Check "apksigner sign"

# ---- 6. verify ----
Write-Host "`n[6/7] Verifying..."
& "$bt\apksigner.bat" verify $OutApk; Check "apksigner verify"
$badging = & "$bt\aapt2.exe" dump badging $OutApk | Select-String "package:"
Write-Host $badging
if ($badging -notmatch "versionCode='$VersionCode'") { throw "Wrong versionCode in APK" }
$assets = @(& jar tf $OutApk | Where-Object { $_ -like "assets*" })
Write-Host ("assets in APK: " + ($assets -join ", "))
if ($assets.Count -ne 1 -or $assets[0] -ne "assets/index.html") { throw "Unexpected assets in APK" }
Write-Host "`nAPK OK: $((Resolve-Path $OutApk).Path)"
Get-FileHash $OutApk

# ---- 7. upload ----
$ans = Read-Host "`n[7/7] Upload to GitHub release $Tag now? (y/n)"
if ($ans -eq "y") {
  & gh release upload $Tag $OutApk --clobber --repo $Repo; Check "gh release upload"
  & gh release view $Tag --repo $Repo
}
Write-Host "`nDone."
