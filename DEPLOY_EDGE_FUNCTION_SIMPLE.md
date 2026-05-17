# 🚀 Deploy Edge Function - Guia Simplificado

## 🎯 Objetivo
Fazer o deploy da Edge Function para enviar emails REAIS via Resend para Gmail.

---

## 📋 Pré-requisitos

- ✅ Resend API Key configurada
- ✅ Emails pendentes na fila
- ✅ Supabase CLI instalado

---

## 🚀 Opção 1: Deploy via Supabase CLI (Recomendado)

### Passo 1: Instalar Supabase CLI

```powershell
# Windows (PowerShell como Admin)
scoop install supabase

# Ou baixar direto:
# https://github.com/supabase/cli/releases/latest
```

### Passo 2: Login no Supabase

```bash
supabase login
```

Isso vai abrir o navegador para você fazer login.

### Passo 3: Link ao Projeto

```bash
cd c:\Users\Dell\Documents\codeengine1.2
supabase link --project-ref ffdqqiunkzhtgbgaojay
```

### Passo 4: Configurar Secrets

```bash
# Sua Resend API Key
supabase secrets set RESEND_API_KEY=re_eBkcPeHy_KPhLhVgJdGx68JKDpAtLhSj1

# Email de envio
supabase secrets set FROM_EMAIL=noreply@aiknowledgestore.com

# Nome do remetente
supabase secrets set FROM_NAME="AI Knowledge Store"
```

### Passo 5: Deploy da Function

```bash
supabase functions deploy send-emails
```

### Passo 6: Testar

```bash
supabase functions invoke send-emails
```

---

## 🚀 Opção 2: Deploy via Supabase Dashboard

### Passo 1: Criar Function no Dashboard

1. Abra: https://ffdqqiunkzhtgbgaojay.supabase.co
2. Vá para: **Edge Functions**
3. Clique em: **Create a new function**
4. Nome: `send-emails`

### Passo 2: Copiar Código

Copie o código de `supabase/functions/send-emails/index.ts` e cole no editor.

### Passo 3: Configurar Secrets

1. Clique na function `send-emails`
2. Vá para **Settings** ou **Secrets**
3. Adicione:
   - `RESEND_API_KEY`: `re_eBkcPeHy_KPhLhVgJdGx68JKDpAtLhSj1`
   - `FROM_EMAIL`: `noreply@aiknowledgestore.com`
   - `FROM_NAME`: `AI Knowledge Store`

### Passo 4: Deploy

Clique em **Deploy**

---

## 🚀 Opção 3: Usar Webhook do Resend (Alternativa Simples)

Se o deploy da Edge Function estiver complicado, podemos usar uma abordagem mais simples:

### Criar Script Node.js Local

Crie `send-emails-local.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ffdqqiunkzhtgbgaojay.supabase.co';
const SUPABASE_KEY = 'SEU_SERVICE_ROLE_KEY';
const RESEND_API_KEY = 're_eBkcPeHy_KPhLhVgJdGx68JKDpAtLhSj1';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendPendingEmails() {
  // Buscar emails pendentes
  const { data: emails, error } = await supabase.rpc('get_pending_emails', {
    batch_size: 10
  });

  if (error) {
    console.error('Erro ao buscar emails:', error);
    return;
  }

  console.log(`Encontrados ${emails.length} emails pendentes`);

  // Enviar cada email
  for (const email of emails) {
    try {
      console.log(`Enviando para ${email.member_email}...`);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'AI Knowledge Store <noreply@aiknowledgestore.com>',
          to: [email.member_email],
          subject: email.subject,
          text: email.body
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Email enviado para ${email.member_email}`);
        
        // Marcar como enviado
        await supabase.rpc('mark_email_sent', { email_id: email.id });
      } else {
        console.error(`❌ Erro ao enviar para ${email.member_email}:`, data);
        
        // Marcar como falho
        await supabase.rpc('mark_email_failed', { email_id: email.id });
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ${email.member_email}:`, error);
    }
  }

  console.log('Processamento concluído!');
}

sendPendingEmails();
```

### Executar

```bash
npm install @supabase/supabase-js
node send-emails-local.js
```

---

## ⚡ Solução MAIS RÁPIDA: Executar Manualmente via cURL

Se você só quer testar agora, use cURL:

```powershell
# PowerShell
$body = @{
    to = "fernandoquipiaca007@gmail.com"
    from = "AI Knowledge Store <noreply@aiknowledgestore.com>"
    subject = "🎉 Teste de Email da AI Knowledge Store"
    text = "Olá Fernando! Este é um email de teste do sistema de notificações. O sistema está funcionando perfeitamente!"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer re_eBkcPeHy_KPhLhVgJdGx68JKDpAtLhSj1"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $headers -Body $body
```

---

## 📧 Verificar Email Enviado

### 1. No Resend Dashboard
```
https://resend.com/emails
```

### 2. No Gmail
- Caixa de entrada
- Spam/Lixo eletrônico
- Promoções

---

## ✅ Qual Opção Escolher?

### Para Teste Rápido AGORA:
✅ **Opção 3** - cURL direto (mais rápido)

### Para Produção:
✅ **Opção 1** - Deploy via CLI (mais robusto)

---

## 🎯 Resumo

**Teste Rápido** (2 minutos):
```powershell
# Enviar email de teste direto via Resend
$body = @{
    to = "fernandoquipiaca007@gmail.com"
    from = "noreply@aiknowledgestore.com"
    subject = "Teste AI Knowledge Store"
    text = "Email de teste!"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer re_eBkcPeHy_KPhLhVgJdGx68JKDpAtLhSj1"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $headers -Body $body
```

**Produção** (10 minutos):
```bash
supabase login
supabase link --project-ref ffdqqiunkzhtgbgaojay
supabase secrets set RESEND_API_KEY=re_eBkcPeHy_KPhLhVgJdGx68JKDpAtLhSj1
supabase functions deploy send-emails
```

---

**Escolha uma opção e execute!** 🚀
