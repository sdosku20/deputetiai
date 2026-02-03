# Favicon Resizer Script
# This script allows you to manually set the width and height of the favicon

param(
    [int]$Width = 900,
    [int]$Height = 480,
    [string]$SourceFile = "albania_favicon.png",
    [string]$OutputFile = "albania_favicon.png"
)

Write-Host "========================================="
Write-Host "Favicon Resizer"
Write-Host "========================================="
Write-Host "Source: $SourceFile"
Write-Host "Target dimensions: ${Width}x${Height}"
Write-Host ""

try {
    # Load System.Drawing assembly
    Add-Type -AssemblyName System.Drawing
    
    # Check if source file exists
    if (-not (Test-Path $SourceFile)) {
        Write-Host "❌ Error: Source file '$SourceFile' not found!" -ForegroundColor Red
        exit 1
    }
    
    # Load the original image
    $sourcePath = (Resolve-Path $SourceFile).Path
    $originalImg = [System.Drawing.Image]::FromFile($sourcePath)
    
    Write-Host "Original size: $($originalImg.Width)x$($originalImg.Height)" -ForegroundColor Cyan
    
    # Create new bitmap with specified dimensions
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $bitmap.SetResolution($originalImg.HorizontalResolution, $originalImg.VerticalResolution)
    
    # Create graphics object for high-quality resizing
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Draw the resized image
    $graphics.DrawImage($originalImg, 0, 0, $Width, $Height)
    
    # Save to temporary file first (to avoid file lock issues)
    $tempFile = "albania_favicon_temp_$(Get-Date -Format 'yyyyMMddHHmmss').png"
    $bitmap.Save($tempFile, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $graphics.Dispose()
    $bitmap.Dispose()
    $originalImg.Dispose()
    
    # Replace original file
    Move-Item -Path $tempFile -Destination $OutputFile -Force
    
    Write-Host "✅ Successfully resized to: ${Width}x${Height}" -ForegroundColor Green
    
    # Update favicon files in project
    Write-Host ""
    Write-Host "Updating favicon files in project..." -ForegroundColor Yellow
    
    Copy-Item $OutputFile -Destination "src\app\icon.png" -Force
    Copy-Item $OutputFile -Destination "public\albania_favicon.png" -Force
    
    Write-Host "✅ Updated src\app\icon.png" -ForegroundColor Green
    Write-Host "✅ Updated public\albania_favicon.png" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================="
    Write-Host "Done! Refresh your browser to see changes." -ForegroundColor Cyan
    Write-Host "========================================="
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
