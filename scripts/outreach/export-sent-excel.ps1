$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$prospectsPath = Join-Path $scriptDir "prospects.json"
$sentPath = Join-Path $scriptDir "sent.json"
$allProspectsPath = Join-Path $scriptDir "all-prospects.csv"
$outPath = Join-Path $scriptDir "B2B_Outreach_82_Sent.xlsx"

$prospects = Get-Content -LiteralPath $prospectsPath -Raw | ConvertFrom-Json
$sent = Get-Content -LiteralPath $sentPath -Raw | ConvertFrom-Json

$sentMap = @{}
$sent.PSObject.Properties | ForEach-Object {
  $sentMap[$_.Name.ToLowerInvariant()] = [DateTime]::Parse($_.Value).ToUniversalTime()
}

$allByEmail = @{}
if (Test-Path -LiteralPath $allProspectsPath) {
  Import-Csv -LiteralPath $allProspectsPath | ForEach-Object {
    $email = ""
    if ($_.email) {
      $email = $_.email.ToString().Trim().ToLowerInvariant()
    }
    if ($email) {
      $allByEmail[$email] = $_
    }
  }
}

$categoryMap = @{
  card_shop = "Card shop"
  soccer_store = "Soccer store"
  sports_bar = "Sports bar"
  soccer_academy = "Soccer academy"
  korean_store = "Korean mart"
  gift_shop = "Gift shop"
  soccer_league = "Soccer league"
  soccer_camp = "Summer camp"
  convenience_assoc = "Convenience association"
}

$roundMap = @{
  card_shop = "Round 1"
  soccer_store = "Round 1"
  sports_bar = "Round 1"
  soccer_academy = "Round 1"
  korean_store = "Round 2"
  gift_shop = "Round 2"
  soccer_league = "Round 2"
  soccer_camp = "Round 2"
  convenience_assoc = "Round 2"
}

function Get-SubjectForType([string]$type) {
  switch ($type) {
    "card_shop" { "Panini FIFA World Cup 2026 Stickers - Wholesale Available from Toronto" }
    "soccer_store" { "FIFA World Cup 2026 Jerseys, Caps & Fan Gear - Wholesale from Toronto" }
    "sports_bar" { "World Cup 2026 Fan Merchandise for Your Venue - Toronto Supplier" }
    "soccer_academy" { "FIFA World Cup 2026 Gear for Your Academy - Wholesale from Toronto" }
    "korean_store" { "FIFA World Cup 2026 Korean Team Fan Gear - Wholesale from Toronto" }
    "gift_shop" { "FIFA World Cup 2026 Souvenirs & Gifts - Wholesale from Toronto" }
    "soccer_league" { "FIFA World Cup 2026 Fan Gear for Your League - Toronto Supplier" }
    "soccer_camp" { "FIFA World Cup 2026 Gear for Your Camp & Players - Toronto Supplier" }
    default { "Wholesale FIFA World Cup 2026 Merchandise - Toronto Supplier" }
  }
}

function Get-FocusForType([string]$type) {
  switch ($type) {
    "card_shop" { "Panini sticker packs/albums, sticker boxes, starter kits, jerseys" }
    "soccer_store" { "Jerseys, caps, bucket hats, car flags, mini gloves, stickers" }
    "sports_bar" { "Match-day merchandise, giveaways, prizes, caps, flags, stickers" }
    "soccer_academy" { "Player/family fan gear, jerseys, hats, stickers, awards/prizes" }
    "korean_store" { "Korea jerseys/caps, stickers, keychains, balls, flags, hood/mirror covers" }
    "gift_shop" { "Souvenirs, keychains, balls, flags, hood/mirror covers, board games" }
    "soccer_league" { "League/team fan gear, jerseys, hats, balls, flags, stickers, board games" }
    "soccer_camp" { "Camp/player fan gear, stickers, balls, hats, prizes, board games" }
    "convenience_assoc" { "OCSA newsletter/supplier directory request; impulse-buy counter products" }
    default { "World Cup wholesale merchandise" }
  }
}

$details = New-Object System.Collections.Generic.List[object]
$index = 1
foreach ($p in $prospects) {
  $emailKey = $p.email.ToLowerInvariant()
  $sentAtUtc = $sentMap[$emailKey]
  $sentAtLocal = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId($sentAtUtc, "Eastern Standard Time")
  $all = $allByEmail[$emailKey]
  $type = [string]$p.type

  $details.Add([pscustomobject]@{
    "No" = $index
    "Round" = $roundMap[$type]
    "Category" = $categoryMap[$type]
    "Business Name" = $p.name
    "City" = $p.city
    "Email" = $p.email
    "Phone" = if ($all) { $all.phone } else { "" }
    "Website" = if ($all) { $all.website } else { "" }
    "Status" = "Sent"
    "Sent At Toronto" = $sentAtLocal.ToString("yyyy-MM-dd HH:mm")
    "Sent At UTC" = $sentAtUtc.ToString("yyyy-MM-dd HH:mm")
    "Subject" = Get-SubjectForType $type
    "Email Focus / Products" = Get-FocusForType $type
    "Notes" = ""
  })
  $index++
}

$summary = @(
  [pscustomobject]@{ "Metric" = "Total sent businesses"; "Value" = $details.Count; "Notes" = "Round 1 + Round 2" }
  [pscustomobject]@{ "Metric" = "Round 1 sent"; "Value" = ($details | Where-Object Round -eq "Round 1").Count; "Notes" = "Card shops, soccer stores, sports bars, academies" }
  [pscustomobject]@{ "Metric" = "Round 2 sent"; "Value" = ($details | Where-Object Round -eq "Round 2").Count; "Notes" = "Korean marts, gift shops, soccer leagues, camps, OCSA" }
  [pscustomobject]@{ "Metric" = "Send failures"; "Value" = 0; "Notes" = "No failures in send script output" }
)

$categorySummary = $details |
  Group-Object Round, Category |
  ForEach-Object {
    $parts = $_.Name -split ", "
    [pscustomobject]@{
      "Round" = $parts[0]
      "Category" = $parts[1]
      "Sent Count" = $_.Count
    }
  } |
  Sort-Object Round, Category

if (Test-Path -LiteralPath $outPath) {
  Remove-Item -LiteralPath $outPath -Force
}

$summary | Export-Excel -Path $outPath -WorksheetName "Summary" -AutoSize -FreezeTopRow -BoldTopRow -TableName "SummaryTable" -TableStyle Medium6
$details | Export-Excel -Path $outPath -WorksheetName "Sent Outreach" -AutoSize -FreezeTopRow -BoldTopRow -TableName "SentOutreachTable" -TableStyle Medium2 -Append
$categorySummary | Export-Excel -Path $outPath -WorksheetName "Category Summary" -AutoSize -FreezeTopRow -BoldTopRow -TableName "CategorySummaryTable" -TableStyle Medium4 -Append

$pkg = Open-ExcelPackage -Path $outPath
$ws = $pkg.Workbook.Worksheets["Sent Outreach"]
$ws.View.FreezePanes(2, 1)
$ws.Column(4).Width = 32
$ws.Column(6).Width = 34
$ws.Column(12).Width = 48
$ws.Column(13).Width = 54
$ws.Column(14).Width = 32
$ws.Cells.Style.VerticalAlignment = "Top"
$ws.Cells["L:N"].Style.WrapText = $true
Close-ExcelPackage $pkg

Write-Host "Created: $outPath"
Write-Host "Rows: $($details.Count)"
