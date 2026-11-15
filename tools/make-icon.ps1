# Genera l'icona master di MIRU (1024x1024) dal marchio dell'app:
# quadrato arrotondato con gradiente arancio (#ff5a2c -> #ff8a3c) e il kanji 見.
# Poi: npx tauri icon tools/miru-icon.png
Add-Type -AssemblyName System.Drawing

$size = 1024
$radius = 212
$glyph = [string][char]0x898B   # 見
$fontName = 'Yu Gothic UI'

$bmp = New-Object System.Drawing.Bitmap($size, $size)
$bmp.SetResolution(96, 96)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::Transparent)

# percorso del quadrato arrotondato
$d = $radius * 2
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $d, $d, 180, 90)
$path.AddArc($size - $d, 0, $d, $d, 270, 90)
$path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
$path.AddArc(0, $size - $d, $d, $d, 90, 90)
$path.CloseFigure()

$rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $rect,
  [System.Drawing.ColorTranslator]::FromHtml('#ff5a2c'),
  [System.Drawing.ColorTranslator]::FromHtml('#ff5a2c'),
  45.0)
$blend = New-Object System.Drawing.Drawing2D.ColorBlend(3)
$blend.Colors = @(
  [System.Drawing.ColorTranslator]::FromHtml('#ff5a2c'),
  [System.Drawing.ColorTranslator]::FromHtml('#ff8a3c'),
  [System.Drawing.ColorTranslator]::FromHtml('#ff5a2c'))
$blend.Positions = @(0.0, 0.5, 1.0)
$brush.InterpolationColors = $blend
$g.FillPath($brush, $path)

# kanji centrato
$font = New-Object System.Drawing.Font($fontName, 520, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#1a0a02'))
$layout = New-Object System.Drawing.RectangleF(0, 6, $size, $size)
$g.DrawString($glyph, $font, $textBrush, $layout, $format)

$out = Join-Path $PSScriptRoot 'miru-icon.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "scritto $out"
