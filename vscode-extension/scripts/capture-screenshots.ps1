#requires -Version 5.1
<#
.SYNOPSIS
  Captures a VSCode window (extension development host) as PNG and/or JPG.

.DESCRIPTION
  Produces the two Lab1 Phase 2 screenshots:
    docs/images/vscode-svg-badge.jpg
    docs/images/vscode-svg-outline.jpg

  The target window is matched by (part of) its title, brought to the
  foreground and captured with PrintWindow(PW_RENDERFULLCONTENT = 2). If that
  returns a blank image (some GPU / RDP configurations do) the script falls back
  to Graphics.CopyFromScreen over the window rectangle.

  Requires an interactive desktop session; a headless / black desktop cannot be
  captured this way, and the script then reports a blank capture instead of
  writing a misleading image.

.EXAMPLE
  # 1. badge screenshot (Explorer): example.svg shows [], notes.txt does not
  pwsh -File scripts/capture-screenshots.ps1 -TitlePattern 'Extension Development Host' `
      -OutFile ..\..\docs\images\vscode-svg-badge.jpg

.EXAMPLE
  # 2. outline screenshot: click the `rect#start` row in the Outline view first
  pwsh -File scripts/capture-screenshots.ps1 -TitlePattern 'Extension Development Host' `
      -ClickX 138 -ClickY 592 -OutFile ..\..\docs\images\vscode-svg-outline.jpg

.EXAMPLE
  # list candidate windows
  pwsh -File scripts/capture-screenshots.ps1 -ListWindows
#>
[CmdletBinding()]
param(
  [string]$TitlePattern = 'Extension Development Host',
  [string]$OutFile = '',
  [int]$DelaySeconds = 1,
  [int]$ClickX = -1,
  [int]$ClickY = -1,
  [switch]$KeepPng,
  [switch]$ListWindows
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms


if (-not ('LabCapture.Win32' -as [type])) {
  # Pure P/Invoke: no System.Drawing reference needed, so the same Add-Type
  # works in Windows PowerShell 5.1 and in PowerShell 7.
  Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;

namespace LabCapture {
  public class Win32 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr param);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowTextW(IntPtr h, StringBuilder sb, int max);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT rect);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, int dx, int dy, uint data, UIntPtr extra);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }

    public static IntPtr FindByTitle(string pattern) {
      IntPtr found = IntPtr.Zero;
      EnumWindows(delegate(IntPtr h, IntPtr l) {
        if (!IsWindowVisible(h)) return true;
        var sb = new StringBuilder(512);
        GetWindowTextW(h, sb, 512);
        if (sb.Length > 0 && sb.ToString().IndexOf(pattern, StringComparison.OrdinalIgnoreCase) >= 0) {
          found = h;
          return false;
        }
        return true;
      }, IntPtr.Zero);
      return found;
    }

    public static string[] Titles() {
      var rows = new System.Collections.Generic.List<string>();
      EnumWindows(delegate(IntPtr h, IntPtr l) {
        if (!IsWindowVisible(h)) return true;
        var sb = new StringBuilder(512);
        GetWindowTextW(h, sb, 512);
        if (sb.Length > 0) rows.Add(h.ToInt64() + "  " + sb.ToString());
        return true;
      }, IntPtr.Zero);
      return rows.ToArray();
    }

    public static void Focus(IntPtr h) {
      ShowWindow(h, 9);          // SW_RESTORE
      BringWindowToTop(h);
      SetWindowPos(h, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040); // NOSIZE|NOMOVE|SHOWWINDOW
      SetForegroundWindow(h);
    }

    public static void Click(int x, int y) {
      SetCursorPos(x, y);
      System.Threading.Thread.Sleep(150);
      mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero); // LEFTDOWN
      System.Threading.Thread.Sleep(60);
      mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero); // LEFTUP
    }

    public static int[] Rect(IntPtr h) {
      RECT r;
      if (!GetWindowRect(h, out r)) throw new InvalidOperationException("GetWindowRect failed");
      return new int[] { r.Left, r.Top, r.Right - r.Left, r.Bottom - r.Top };
    }
  }
}
'@
}
# Windows scales a DPI-unaware process: GetWindowRect reports the virtualized
# (smaller) size and PrintWindow only renders the top-left part of the window,
# which silently crops the Outline view away. Declare DPI awareness explicitly.
if ($null -ne [LabCapture.Win32]::SetProcessDPIAware) {
  try { [void][LabCapture.Win32]::SetProcessDPIAware() } catch { }
}

if ($ListWindows) {
  [LabCapture.Win32]::Titles() | ForEach-Object { Write-Host $_ }
  return
}

if ([string]::IsNullOrWhiteSpace($OutFile)) {
  throw 'OutFile is required (unless -ListWindows is used).'
}

$hwnd = [LabCapture.Win32]::FindByTitle($TitlePattern)
if ($hwnd -eq [IntPtr]::Zero) {
  throw "no visible window whose title contains '$TitlePattern' (run with -ListWindows)"
}

[LabCapture.Win32]::Focus($hwnd)
Start-Sleep -Milliseconds 500

if ($ClickX -ge 0 -and $ClickY -ge 0) {
  [LabCapture.Win32]::Click($ClickX, $ClickY)
  Start-Sleep -Milliseconds 500
}

if ($DelaySeconds -gt 0) {
  Start-Sleep -Seconds $DelaySeconds
}

$rect = [LabCapture.Win32]::Rect($hwnd)
$width = $rect[2]
$height = $rect[3]
$bmp = New-Object System.Drawing.Bitmap $width, $height

# 1st attempt: PrintWindow with PW_RENDERFULLCONTENT (works for Chromium/Electron
# windows even when they are partially covered).
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $graphics.GetHdc()
$ok = [LabCapture.Win32]::PrintWindow($hwnd, $hdc, 2)
$graphics.ReleaseHdc($hdc)
$graphics.Dispose()

function Test-BlankBitmap {
  param([System.Drawing.Bitmap]$Bitmap)
  $first = $Bitmap.GetPixel([int]($Bitmap.Width / 4), [int]($Bitmap.Height / 4))
  $stepX = [Math]::Max(1, [int]($Bitmap.Width / 40))
  $stepY = [Math]::Max(1, [int]($Bitmap.Height / 40))
  for ($x = 0; $x -lt $Bitmap.Width; $x += $stepX) {
    for ($y = 0; $y -lt $Bitmap.Height; $y += $stepY) {
      $c = $Bitmap.GetPixel($x, $y)
      if ([Math]::Abs($c.R - $first.R) -gt 6 -or [Math]::Abs($c.G - $first.G) -gt 6 -or [Math]::Abs($c.B - $first.B) -gt 6) {
        return $false
      }
    }
  }
  return $true
}

if (-not $ok -or (Test-BlankBitmap -Bitmap $bmp)) {
  Write-Host 'PrintWindow gave a blank image; falling back to CopyFromScreen.'
  $bmp.Dispose()
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.CopyFromScreen($rect[0], $rect[1], 0, 0, (New-Object System.Drawing.Size $width, $height))
  $graphics.Dispose()
  if (Test-BlankBitmap -Bitmap $bmp) {
    $bmp.Dispose()
    throw 'capture is blank: no interactive desktop (or the window is minimized). Screenshot not taken.'
  }
}

$target = if ([System.IO.Path]::IsPathRooted($OutFile)) { $OutFile } else { Join-Path (Get-Location).Path $OutFile }
$target = [System.IO.Path]::GetFullPath($target)
$dir = [System.IO.Path]::GetDirectoryName($target)
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

$isJpeg = $target.ToLower().EndsWith('.jpg') -or $target.ToLower().EndsWith('.jpeg')
$pngPath = if ($isJpeg) { [System.IO.Path]::ChangeExtension($target, '.png') } else { $target }
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

if ($isJpeg) {
  # JPEG has no alpha channel: flatten to 24bpp and encode with quality 92.
  $flat = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($flat)
  $g.DrawImage($bmp, 0, 0, $width, $height)
  $g.Dispose()
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 92
  $flat.Save($target, $codec, $params)
  $flat.Dispose()
  if (-not $KeepPng) { Remove-Item $pngPath -Force }
}

Write-Host ("captured {0}x{1} -> {2}" -f $width, $height, $target)
$bmp.Dispose()


