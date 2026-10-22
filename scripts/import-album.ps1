param([Parameter(Mandatory = $true)][string]$AlbumPath)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$assetDirectory = Join-Path $projectRoot 'public/assets'

function Set-PhotoOrientation([System.Drawing.Image]$Photo) {
  if ($Photo.PropertyIdList -contains 274) {
    $orientation = [BitConverter]::ToUInt16($Photo.GetPropertyItem(274).Value, 0)
    $rotation = switch ($orientation) {
      2 { 'RotateNoneFlipX' }
      3 { 'Rotate180FlipNone' }
      4 { 'Rotate180FlipX' }
      5 { 'Rotate90FlipX' }
      6 { 'Rotate90FlipNone' }
      7 { 'Rotate270FlipX' }
      8 { 'Rotate270FlipNone' }
      default { 'RotateNoneFlipNone' }
    }
    $Photo.RotateFlip([System.Drawing.RotateFlipType]::$rotation)
  }
}

$photos = @(Get-ChildItem -LiteralPath $AlbumPath -File -Recurse | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' } | ForEach-Object {
  $sourceImage = [System.Drawing.Image]::FromFile($_.FullName)
  try {
    Set-PhotoOrientation $sourceImage
    [pscustomobject]@{ File = $_; Width = $sourceImage.Width; Height = $sourceImage.Height }
  } finally { $sourceImage.Dispose() }
})
if ($photos.Count -lt 26) { throw 'At least 26 photos are needed for unique selections.' }

# These groups identify the solo portraits in this wedding album.
$groomNames = @('NHO00285', 'NHO00290', 'NHO09454')
$brideNames = @('NHO00003', 'NHO00014', 'NHO00212', 'NHO00258', 'NHO08936', 'NHO08963')
$usedPaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$selections = [ordered]@{}

function Select-Photo([string]$Slot, [object[]]$Candidates) {
  $available = @($Candidates | Where-Object { -not $usedPaths.Contains($_.File.FullName) })
  if (-not $available.Count) { $available = @($photos | Where-Object { -not $usedPaths.Contains($_.File.FullName) }) }
  $selected = $available | Get-Random
  [void]$usedPaths.Add($selected.File.FullName)
  $selections[$Slot] = $selected
}

Select-Photo 'groom' @($photos | Where-Object { $_.File.BaseName -in $groomNames })
Select-Photo 'bride' @($photos | Where-Object { $_.File.BaseName -in $brideNames })
$couplePhotos = @($photos | Where-Object { $_.File.BaseName -notin ($groomNames + $brideNames) })
$portraitPhotos = @($couplePhotos | Where-Object { $_.Height -gt $_.Width })
$landscapePhotos = @($couplePhotos | Where-Object { $_.Width -ge $_.Height })
foreach ($slot in @('hero', 'invitation', 'celebration', 'calendar')) { Select-Photo $slot $portraitPhotos }
foreach ($slot in @('couple', 'guestbook', 'footer', 'share')) { Select-Photo $slot $landscapePhotos }
foreach ($number in 1..16) { Select-Photo "album-$number" $photos }

$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderOptions = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoderOptions.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]88)
$manifest = @()
try {
  foreach ($entry in $selections.GetEnumerator()) {
    $photo = $entry.Value
    $sourceImage = [System.Drawing.Image]::FromFile($photo.File.FullName)
    $webImage = $null
    $graphics = $null
    try {
      Set-PhotoOrientation $sourceImage
      $scale = [Math]::Min(1.0, 2000.0 / [Math]::Max($sourceImage.Width, $sourceImage.Height))
      $width = [Math]::Max(1, [int][Math]::Round($sourceImage.Width * $scale))
      $height = [Math]::Max(1, [int][Math]::Round($sourceImage.Height * $scale))
      $webImage = [System.Drawing.Bitmap]::new($width, $height)
      $graphics = [System.Drawing.Graphics]::FromImage($webImage)
      $graphics.Clear([System.Drawing.Color]::White)
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.DrawImage($sourceImage, 0, 0, $width, $height)
      $destination = Join-Path $assetDirectory "$($entry.Key).jpg"
      $webImage.Save($destination, $jpegEncoder, $encoderOptions)
      $manifest += [pscustomobject]@{ Slot = $entry.Key; Source = $photo.File.Name; Width = $width; Height = $height; Bytes = (Get-Item -LiteralPath $destination).Length }
      Write-Output "$($entry.Key).jpg <- $($photo.File.Name) ($width x $height)"
    } finally {
      if ($graphics) { $graphics.Dispose() }
      if ($webImage) { $webImage.Dispose() }
      $sourceImage.Dispose()
    }
  }
} finally { $encoderOptions.Dispose() }
$manifest | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'imported-photos.json')
Write-Output "Imported $($manifest.Count) unique photos. Total web size: $([Math]::Round(($manifest | Measure-Object -Property Bytes -Sum).Sum / 1MB, 2)) MB."
