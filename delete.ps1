$ErrorActionPreference = "SilentlyContinue"
if (Test-Path "d:\ecomzone\app\wishlist") {
    Remove-Item -Path "d:\ecomzone\app\wishlist" -Recurse -Force
    Write-Host "Deleted"
} else {
    Write-Host "Not found"
}
