if (Test-Path "d:\ecomzone\app\wishlist") {
    Remove-Item -Path "d:\ecomzone\app\wishlist" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Directory deleted"
} else {
    Write-Host "Directory does not exist"
}
