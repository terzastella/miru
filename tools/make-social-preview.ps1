# Genera docs/assets/social-preview.png (1280x630) per GitHub -> Settings -> Social preview.
Add-Type -AssemblyName System.Drawing

$w = 1280
$h = 630
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$bmp.SetResolution(96, 96)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0c0c10'))
$g.FillRectangle($bg, 0, 0, $w, $h)

$glow1 = New-Object System.Drawing.Drawing2D.GraphicsPath
$glow1.AddEllipse(-180, -260, 900, 700)
$p1 = New-Object System.Drawing.Drawing2D.PathGradientBrush($glow1)
$p1.CenterColor = [System.Drawing.Color]::FromArgb(70, 255, 90, 44)
$p1.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 255, 90, 44))
$g.FillPath($p1, $glow1)

$glow2 = New-Object System.Drawing.Drawing2D.GraphicsPath
$glow2.AddEllipse(700, 250, 800, 600)
$p2 = New-Object System.Drawing.Drawing2D.PathGradientBrush($glow2)
$p2.CenterColor = [System.Drawing.Color]::FromArgb(45, 54, 209, 196)
$p2.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 54, 209, 196))
$g.FillPath($p2, $glow2)

$iconPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'tools\miru-icon.png'
$icon = [System.Drawing.Image]::FromFile($iconPath)
$size = 200
$g.DrawImage($icon, 120, 215, $size, $size)

$fontTitle = New-Object System.Drawing.Font('Bahnschrift SemiBold', 96, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fontSub = New-Object System.Drawing.Font('Bahnschrift', 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fontSmall = New-Object System.Drawing.Font('Bahnschrift Light', 26, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$white = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f3f0ea'))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#9b96a6'))
$orange = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#ff5a2c'))

$g.DrawString('MIRU', $fontTitle, $white, 360, 210)
$g.DrawString('Il tuo diario anime', $fontSub, $orange, 366, 320)
$g.DrawString('Windows  |  Next.js 16  |  Tauri 2', $fontSmall, $muted, 366, 380)

$bmp.Save((Join-Path $PSScriptRoot '..\docs\assets\social-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$icon.Dispose(); $g.Dispose(); $bmp.Dispose()
Write-Output 'docs/assets/social-preview.png creato'
