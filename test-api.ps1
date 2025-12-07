# PowerShell script to test the API
# Usage: .\test-api.ps1

$uri = "https://asistenti.deputeti.ai/v1/chat/completions"
$apiKey = "sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4"

$body = @{
    model = "eu-law-rag"
    messages = @(
        @{
            role = "user"
            content = "What is Article 50 TEU?"
        }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

Write-Host "Sending request to: $uri" -ForegroundColor Cyan
Write-Host "Request body:" -ForegroundColor Cyan
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor White
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body:" -ForegroundColor Red
    Write-Host $responseBody -ForegroundColor Yellow
}

