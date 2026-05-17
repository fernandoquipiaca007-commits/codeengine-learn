# ============================================
# Send Test Email NOW - PowerShell Script
# ============================================
# Este script envia um email de teste IMEDIATAMENTE via Resend API

Write-Host "🚀 Enviando email de teste..." -ForegroundColor Cyan

# Configuração
$resendApiKey = "re_eBkcPeHy_KPhLhVgJdGx68JKDpAtLhSj1"
$toEmail = "fernandoquipiaca007@gmail.com"
$fromEmail = "AI Knowledge Store <noreply@aiknowledgestore.com>"
$subject = "🎉 Novo Produto Disponível na AI Knowledge Store!"

$body = @"
Olá Fernando,

Temos novidades para você! Um novo produto acaba de ser adicionado à nossa biblioteca:

📦 Produto: Sistema de Email Funcionando!

Este é um email de teste do sistema de notificações automáticas da AI Knowledge Store.

✅ O sistema está funcionando perfeitamente!
✅ Você receberá notificações sempre que novos produtos forem adicionados
✅ Acesse sua área de membros para ver todos os produtos

Acesse agora: http://localhost:3000/library

Não perca essa oportunidade de expandir seus conhecimentos!

Atenciosamente,
Equipe AI Knowledge Store

---
Para gerenciar suas notificações, acesse: http://localhost:3000/member
"@

# Criar payload JSON
$emailPayload = @{
    from = $fromEmail
    to = @($toEmail)
    subject = $subject
    text = $body
} | ConvertTo-Json

# Headers
$headers = @{
    "Authorization" = "Bearer $resendApiKey"
    "Content-Type" = "application/json"
}

try {
    Write-Host "📧 Enviando para: $toEmail" -ForegroundColor Yellow
    
    # Enviar email via Resend API
    $response = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $headers -Body $emailPayload
    
    Write-Host "✅ Email enviado com sucesso!" -ForegroundColor Green
    Write-Host "📬 ID do Email: $($response.id)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Verifique:" -ForegroundColor Cyan
    Write-Host "   1. Resend Dashboard: https://resend.com/emails" -ForegroundColor White
    Write-Host "   2. Seu Gmail: $toEmail" -ForegroundColor White
    Write-Host "   3. Verifique também a pasta Spam/Lixo Eletrônico" -ForegroundColor White
    Write-Host ""
    
    # Mostrar resposta completa
    Write-Host "📄 Resposta da API:" -ForegroundColor Cyan
    $response | ConvertTo-Json | Write-Host
    
} catch {
    Write-Host "❌ Erro ao enviar email!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "Detalhes do erro:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
