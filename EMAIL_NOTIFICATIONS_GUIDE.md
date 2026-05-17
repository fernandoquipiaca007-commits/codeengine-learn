# 📧 Sistema de Notificações por Email - Guia Completo

**Data**: 12 de Maio de 2026

## 🎯 Objetivo

Enviar emails automáticos para todos os membros quando um novo produto for adicionado à loja.

---

## 🏗️ Arquitetura

```
Admin adiciona produto
    ↓
Trigger: notify_members_new_product
    ↓
Cria notificação para cada membro (tabela notifications)
    ↓
Trigger: queue_email_for_notification
    ↓
Adiciona email na fila (tabela email_queue)
    ↓
Edge Function: send-emails (executada periodicamente)
    ↓
Processa fila e envia emails via Resend
    ↓
Marca emails como enviados
```

---

## 📋 Passo 1: Configurar Banco de Dados

### 1.1 Executar Script SQL

1. Abra **Supabase Dashboard**: https://ffdqqiunkzhtgbgaojay.supabase.co
2. Vá para **SQL Editor**
3. Abra o arquivo `supabase/email-notifications-setup.sql`
4. Copie **TODO** o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

### 1.2 Verificar Sucesso

Você deve ver:
```
✅ Email notification system setup completed!
✅ Triggers created for new products
✅ Email queue table created
✅ Functions created for email processing
```

### 1.3 O Que Foi Criado

**Tabela**:
- `email_queue` - Fila de emails pendentes

**Triggers**:
- `on_new_product_notify_members` - Cria notificações quando produto é adicionado
- `on_product_activated_notify_members` - Cria notificações quando produto é ativado
- `on_notification_queue_email` - Adiciona email na fila quando notificação é criada

**Functions**:
- `notify_members_new_product()` - Cria notificações para todos os membros
- `notify_members_product_activated()` - Notifica quando produto é ativado
- `queue_email_for_notification()` - Adiciona email na fila
- `get_pending_emails()` - Busca emails pendentes
- `mark_email_sent()` - Marca email como enviado
- `mark_email_failed()` - Marca email como falho

---

## 📧 Passo 2: Configurar Provedor de Email (Resend)

### 2.1 Criar Conta no Resend

1. Acesse: https://resend.com
2. Crie uma conta gratuita
3. Verifique seu email

### 2.2 Obter API Key

1. No dashboard do Resend, vá para **API Keys**
2. Clique em **Create API Key**
3. Nome: `AI Knowledge Store`
4. Permissões: **Sending access**
5. Copie a API Key (começa com `re_`)

### 2.3 Verificar Domínio (Opcional - Produção)

Para produção, você precisa verificar seu domínio:

1. Vá para **Domains** no Resend
2. Clique em **Add Domain**
3. Digite seu domínio: `aiknowledgestore.com`
4. Adicione os registros DNS fornecidos
5. Aguarde verificação (pode levar até 48h)

**Para desenvolvimento**, você pode usar o domínio de teste do Resend.

---

## 🚀 Passo 3: Deploy da Edge Function

### 3.1 Instalar Supabase CLI

```bash
# Windows (PowerShell)
scoop install supabase

# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
```

### 3.2 Login no Supabase

```bash
supabase login
```

### 3.3 Link ao Projeto

```bash
cd c:\Users\Dell\Documents\codeengine1.2
supabase link --project-ref ffdqqiunkzhtgbgaojay
```

### 3.4 Configurar Secrets

```bash
# Resend API Key
supabase secrets set RESEND_API_KEY=re_sua_api_key_aqui

# Email de envio
supabase secrets set FROM_EMAIL=noreply@aiknowledgestore.com

# Nome do remetente
supabase secrets set FROM_NAME="AI Knowledge Store"
```

### 3.5 Deploy da Function

```bash
supabase functions deploy send-emails
```

### 3.6 Verificar Deploy

```bash
supabase functions list
```

Você deve ver:
```
send-emails | deployed | https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails
```

---

## ⏰ Passo 4: Agendar Execução Automática

### Opção 1: Cron Job (Supabase)

1. Vá para **Database** → **Cron Jobs** no Supabase Dashboard
2. Clique em **Create a new cron job**
3. Configure:
   ```sql
   -- Nome: send-pending-emails
   -- Schedule: */5 * * * * (a cada 5 minutos)
   -- Command:
   SELECT net.http_post(
     url := 'https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
     )
   );
   ```

### Opção 2: GitHub Actions (Recomendado)

Crie `.github/workflows/send-emails.yml`:

```yaml
name: Send Pending Emails

on:
  schedule:
    # Executa a cada 5 minutos
    - cron: '*/5 * * * *'
  workflow_dispatch: # Permite execução manual

jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

### Opção 3: Vercel Cron (Se usar Vercel)

Crie `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/send-emails",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 🧪 Passo 5: Testar o Sistema

### 5.1 Teste Manual da Edge Function

```bash
curl -X POST \
  https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### 5.2 Teste Completo (Adicionar Produto)

1. Abra **Admin Dashboard**: http://localhost:5175
2. Vá para **Products**
3. Clique em **Add Product**
4. Preencha os dados:
   - Title: "Teste de Notificação"
   - Description: "Produto de teste"
   - Category: Selecione uma
   - Price: 99.90
   - Status: **Active** (importante!)
5. Clique em **Save**

### 5.3 Verificar Notificações Criadas

```sql
-- No Supabase SQL Editor
SELECT * FROM notifications 
WHERE type = 'new_product' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 5.4 Verificar Fila de Emails

```sql
-- No Supabase SQL Editor
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 5.5 Processar Fila Manualmente

```bash
curl -X POST \
  https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### 5.6 Verificar Emails Enviados

```sql
-- No Supabase SQL Editor
SELECT * FROM email_queue 
WHERE status = 'sent' 
ORDER BY sent_at DESC 
LIMIT 10;
```

### 5.7 Verificar no Resend Dashboard

1. Acesse: https://resend.com/emails
2. Veja os emails enviados
3. Clique em um email para ver detalhes

---

## 📧 Template do Email

### Assunto
```
🎉 Novo Produto Disponível na AI Knowledge Store!
```

### Corpo (Plain Text)
```
Olá [Nome do Membro],

Temos novidades para você! Um novo produto acaba de ser adicionado à nossa biblioteca:

Novo produto disponível: [Título do Produto]! Confira agora na biblioteca.

Acesse agora e confira: https://seu-dominio.com/library

Não perca essa oportunidade de expandir seus conhecimentos!

Atenciosamente,
Equipe AI Knowledge Store

---
Para gerenciar suas notificações, acesse: https://seu-dominio.com/member
```

### Corpo (HTML)
- Header com gradiente roxo/azul
- Logo "AI Knowledge Store"
- Conteúdo formatado
- Footer com copyright

---

## 🔧 Personalização

### Alterar Template do Email

Edite a função `queue_email_for_notification()` em `supabase/email-notifications-setup.sql`:

```sql
email_subject := '🎉 Seu Título Personalizado!';
email_body := 'Olá ' || member_name || ',

Seu conteúdo personalizado aqui...';
```

### Alterar HTML do Email

Edite a função `convertToHtml()` em `supabase/functions/send-emails/index.ts`:

```typescript
function convertToHtml(text: string): string {
  return `
<!DOCTYPE html>
<html>
  <!-- Seu HTML personalizado aqui -->
</html>
  `;
}
```

### Adicionar Imagem do Produto

Modifique `queue_email_for_notification()`:

```sql
-- Buscar dados do produto
SELECT title, cover_url INTO product_title, product_cover
FROM products
WHERE title = substring(NEW.message from 'Novo produto disponível: (.+)!');

email_body := 'Olá ' || member_name || ',

Novo produto: ' || product_title || '

Imagem: ' || product_cover || '

Acesse agora!';
```

---

## 📊 Monitoramento

### Ver Estatísticas de Emails

```sql
-- Total de emails enviados
SELECT COUNT(*) as total_sent
FROM email_queue
WHERE status = 'sent';

-- Total de emails pendentes
SELECT COUNT(*) as total_pending
FROM email_queue
WHERE status = 'pending';

-- Total de emails falhados
SELECT COUNT(*) as total_failed
FROM email_queue
WHERE status = 'failed';

-- Taxa de sucesso
SELECT 
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'sent')::NUMERIC / COUNT(*)) * 100,
    2
  ) as success_rate
FROM email_queue;
```

### Ver Logs da Edge Function

```bash
supabase functions logs send-emails
```

---

## 🐛 Troubleshooting

### Problema: Emails não estão sendo enviados

**Solução 1**: Verificar se a fila tem emails pendentes
```sql
SELECT * FROM email_queue WHERE status = 'pending';
```

**Solução 2**: Executar Edge Function manualmente
```bash
curl -X POST https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY"
```

**Solução 3**: Verificar logs
```bash
supabase functions logs send-emails --tail
```

### Problema: Resend API retorna erro

**Solução**: Verificar API Key
```bash
supabase secrets list
```

Se não aparecer `RESEND_API_KEY`, configure novamente:
```bash
supabase secrets set RESEND_API_KEY=re_sua_api_key
```

### Problema: Notificações não são criadas

**Solução**: Verificar se triggers existem
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify_members%';
```

Se não existirem, execute novamente `email-notifications-setup.sql`.

### Problema: Emails vão para spam

**Soluções**:
1. Verificar domínio no Resend
2. Adicionar registros SPF, DKIM, DMARC
3. Usar domínio próprio (não gmail, hotmail, etc.)
4. Adicionar link de unsubscribe

---

## 🚀 Melhorias Futuras

### 1. Unsubscribe (Cancelar Inscrição)

Adicionar coluna na tabela `members`:
```sql
ALTER TABLE members ADD COLUMN email_notifications BOOLEAN DEFAULT true;
```

Modificar `notify_members_new_product()`:
```sql
INSERT INTO notifications (member_id, type, message, read_status)
SELECT 
  id,
  'new_product',
  'Novo produto disponível: ' || NEW.title,
  false
FROM members
WHERE email_notifications = true; -- Apenas membros que aceitam emails
```

### 2. Diferentes Tipos de Notificações

- Novo produto
- Promoção
- Produto em desconto
- Lembrete de download
- Novidades da plataforma

### 3. Personalização por Categoria

Enviar apenas para membros interessados em categorias específicas.

### 4. Agendamento de Envio

Enviar emails em horários específicos (ex: 10h da manhã).

### 5. A/B Testing

Testar diferentes assuntos e templates.

---

## ✅ Checklist de Implementação

- [ ] Executar `supabase/email-notifications-setup.sql`
- [ ] Criar conta no Resend
- [ ] Obter API Key do Resend
- [ ] Instalar Supabase CLI
- [ ] Configurar secrets (RESEND_API_KEY, FROM_EMAIL, FROM_NAME)
- [ ] Deploy da Edge Function
- [ ] Configurar cron job ou GitHub Actions
- [ ] Testar adicionando produto no Admin
- [ ] Verificar notificações criadas
- [ ] Verificar fila de emails
- [ ] Executar Edge Function manualmente
- [ ] Verificar emails enviados no Resend
- [ ] Configurar domínio (produção)

---

## 📚 Recursos

- **Resend Docs**: https://resend.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Supabase Triggers**: https://supabase.com/docs/guides/database/postgres/triggers

---

## ✨ Resumo

**Sistema Completo**:
- ✅ Triggers automáticos
- ✅ Fila de emails
- ✅ Edge Function para envio
- ✅ Template HTML bonito
- ✅ Retry automático (até 3 tentativas)
- ✅ Monitoramento e logs

**Fluxo**:
1. Admin adiciona produto → Notificações criadas → Emails na fila
2. Edge Function processa fila → Envia emails via Resend
3. Membros recebem email bonito com HTML

**Próximo passo**: Execute o SQL e configure o Resend! 🚀
