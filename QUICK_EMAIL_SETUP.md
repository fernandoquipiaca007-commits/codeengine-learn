# ⚡ Configuração Rápida de Email - 5 Minutos

## 📍 Localização dos Arquivos

```
c:\Users\Dell\Documents\codeengine1.2\
├── supabase/
│   ├── .env.supabase          ← COLE SUA API KEY AQUI
│   ├── email-notifications-setup.sql
│   └── functions/
│       └── send-emails/
│           └── index.ts
```

---

## 🔑 Passo 1: Configurar API Key (1 min)

### 1.1 Abrir Arquivo
```
Abra: c:\Users\Dell\Documents\codeengine1.2\supabase\.env.supabase
```

### 1.2 Colar Nova API Key
```env
RESEND_API_KEY=re_SUA_NOVA_KEY_AQUI  ← COLE AQUI
FROM_EMAIL=noreply@aiknowledgestore.com
FROM_NAME=AI Knowledge Store
```

**⚠️ IMPORTANTE**: 
- Use a NOVA key (depois de revogar a antiga)
- NÃO commite este arquivo no Git (já está no .gitignore)

---

## 🗄️ Passo 2: Executar SQL (2 min)

### 2.1 Abrir Supabase Dashboard
```
https://ffdqqiunkzhtgbgaojay.supabase.co
```

### 2.2 Ir para SQL Editor
```
Menu lateral → SQL Editor
```

### 2.3 Executar Script
```
1. Abrir: c:\Users\Dell\Documents\codeengine1.2\supabase\email-notifications-setup.sql
2. Copiar TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Colar no SQL Editor (Ctrl+V)
4. Clicar em "Run" (ou Ctrl+Enter)
```

### 2.4 Verificar Sucesso
Você deve ver:
```
✅ Email notification system setup completed!
✅ Triggers created for new products
✅ Email queue table created
✅ Functions created for email processing
```

---

## 🚀 Passo 3: Deploy Edge Function (2 min)

### Opção A: Via Supabase CLI (Recomendado)

#### 3.1 Abrir Terminal
```bash
# PowerShell ou CMD
cd c:\Users\Dell\Documents\codeengine1.2
```

#### 3.2 Instalar Supabase CLI (se ainda não tem)
```bash
# Windows (PowerShell como Admin)
scoop install supabase

# Ou baixar direto:
# https://github.com/supabase/cli/releases
```

#### 3.3 Login
```bash
supabase login
```

#### 3.4 Link ao Projeto
```bash
supabase link --project-ref ffdqqiunkzhtgbgaojay
```

#### 3.5 Configurar Secrets
```bash
# Ler do arquivo .env.supabase e configurar
supabase secrets set RESEND_API_KEY=re_SUA_NOVA_KEY
supabase secrets set FROM_EMAIL=noreply@aiknowledgestore.com
supabase secrets set FROM_NAME="AI Knowledge Store"
```

#### 3.6 Deploy
```bash
supabase functions deploy send-emails
```

### Opção B: Via Supabase Dashboard (Alternativa)

#### 3.1 Abrir Dashboard
```
https://ffdqqiunkzhtgbgaojay.supabase.co
```

#### 3.2 Ir para Edge Functions
```
Menu lateral → Edge Functions
```

#### 3.3 Criar Nova Function
```
1. Clicar em "New Function"
2. Nome: send-emails
3. Copiar código de: supabase/functions/send-emails/index.ts
4. Colar no editor
5. Clicar em "Deploy"
```

#### 3.4 Configurar Secrets
```
1. Clicar na function "send-emails"
2. Ir para "Settings" ou "Secrets"
3. Adicionar:
   - RESEND_API_KEY: re_SUA_NOVA_KEY
   - FROM_EMAIL: noreply@aiknowledgestore.com
   - FROM_NAME: AI Knowledge Store
```

---

## 🧪 Passo 4: Testar (1 min)

### 4.1 Adicionar Produto de Teste

```
1. Abrir Admin Dashboard: http://localhost:5175
2. Ir para Products
3. Clicar em "Add Product"
4. Preencher:
   - Title: Teste de Email
   - Description: Produto de teste
   - Category: Qualquer
   - Price: 99.90
   - Status: Active ← IMPORTANTE!
5. Salvar
```

### 4.2 Verificar Notificações Criadas

```sql
-- No Supabase SQL Editor:
SELECT * FROM notifications 
WHERE type = 'new_product' 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4.3 Verificar Fila de Emails

```sql
-- No Supabase SQL Editor:
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4.4 Processar Fila Manualmente

```bash
# No terminal:
curl -X POST \
  https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Onde encontrar SERVICE_ROLE_KEY**:
```
Supabase Dashboard → Settings → API → service_role key (secret)
```

### 4.5 Verificar Emails Enviados

```
1. Ir para: https://resend.com/emails
2. Ver lista de emails enviados
3. Clicar em um email para ver detalhes
```

---

## ⏰ Passo 5: Automatizar (Opcional)

### Opção 1: Cron Job Manual

Execute este comando a cada 5 minutos:
```bash
curl -X POST \
  https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY"
```

### Opção 2: GitHub Actions

Crie `.github/workflows/send-emails.yml`:
```yaml
name: Send Emails
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

---

## 📋 Checklist

- [ ] Revogar API key antiga no Resend
- [ ] Criar nova API key no Resend
- [ ] Colar nova key em `supabase/.env.supabase`
- [ ] Executar `email-notifications-setup.sql` no Supabase
- [ ] Instalar Supabase CLI
- [ ] Configurar secrets no Supabase
- [ ] Deploy da Edge Function
- [ ] Testar adicionando produto
- [ ] Verificar email no Resend Dashboard

---

## 🆘 Problemas Comuns

### Erro: "RESEND_API_KEY not found"
**Solução**: Configurar secrets novamente
```bash
supabase secrets set RESEND_API_KEY=re_SUA_KEY
```

### Erro: "Unauthorized"
**Solução**: Verificar se usou SERVICE_ROLE_KEY (não anon key)

### Emails não chegam
**Solução**: 
1. Verificar fila: `SELECT * FROM email_queue WHERE status = 'pending'`
2. Executar function manualmente
3. Ver logs: `supabase functions logs send-emails`

---

## ✨ Resumo

**Arquivos**:
- `supabase/.env.supabase` ← Cole sua API key aqui
- `supabase/email-notifications-setup.sql` ← Execute no Supabase
- `supabase/functions/send-emails/index.ts` ← Deploy via CLI

**Comandos**:
```bash
cd c:\Users\Dell\Documents\codeengine1.2
supabase login
supabase link --project-ref ffdqqiunkzhtgbgaojay
supabase secrets set RESEND_API_KEY=re_SUA_KEY
supabase functions deploy send-emails
```

**Pronto!** 🎉
