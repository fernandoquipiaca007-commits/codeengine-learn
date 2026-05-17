# 🔍 Troubleshooting - Emails Não Estão Sendo Enviados

## 📋 Diagnóstico Rápido

### Passo 1: Executar Diagnóstico Automático

1. Abra **Supabase Dashboard**: https://ffdqqiunkzhtgbgaojay.supabase.co
2. Vá para **SQL Editor**
3. Abra o arquivo `supabase/test-email-system.sql`
4. Copie **TODO** o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

### Passo 2: Analisar Resultado

O diagnóstico vai mostrar:
```
========================================
EMAIL SYSTEM DIAGNOSTIC REPORT
========================================
Triggers installed: X (expected: 3)
Total members: X
New product notifications: X
Total emails in queue: X
Pending emails: X
========================================
```

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Triggers installed: 0"

**Causa**: O script `email-notifications-setup.sql` não foi executado

**Solução**:
1. Abra Supabase Dashboard → SQL Editor
2. Copie `supabase/email-notifications-setup.sql`
3. Cole e execute
4. Verifique mensagem de sucesso

---

### Problema 2: "Total members: 0"

**Causa**: Não há membros cadastrados

**Solução**:
1. Crie uma conta na Store: http://localhost:3000
2. Clique em "Tornar-se Membro"
3. Preencha dados e crie conta
4. Verifique no SQL:
   ```sql
   SELECT * FROM members;
   ```

---

### Problema 3: "New product notifications: 0"

**Causa**: Nenhum produto foi adicionado ou trigger não funcionou

**Solução A - Adicionar Produto**:
1. Abra Admin Dashboard: http://localhost:5175
2. Vá para Products
3. Clique em "Add Product"
4. **IMPORTANTE**: Status = "Active"
5. Salve

**Solução B - Teste Manual**:
```sql
-- Pegar ID de um membro
SELECT id, email FROM members LIMIT 1;

-- Inserir notificação manualmente (substitua MEMBER_ID)
INSERT INTO notifications (member_id, type, message, read_status)
VALUES (
  'SEU_MEMBER_ID_AQUI',
  'new_product',
  'Teste: Novo produto disponível!',
  false
);

-- Verificar se foi criado
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
```

---

### Problema 4: "Total emails in queue: 0" (mas há notificações)

**Causa**: Trigger `on_notification_queue_email` não está funcionando

**Solução**:
```sql
-- Verificar se trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_notification_queue_email';

-- Se não existir, executar novamente:
-- supabase/email-notifications-setup.sql
```

**Teste Manual**:
```sql
-- Adicionar email manualmente na fila
INSERT INTO email_queue (member_id, email_type, subject, body)
SELECT 
  id,
  'new_product',
  '🎉 Teste Manual',
  'Este é um email de teste'
FROM members
LIMIT 1;

-- Verificar
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 1;
```

---

### Problema 5: "Pending emails: X" (mas não chegam)

**Causa**: Edge Function não está sendo executada

**Solução A - Executar Manualmente**:
```bash
# No terminal
curl -X POST \
  https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Onde encontrar SERVICE_ROLE_KEY**:
```
Supabase Dashboard → Settings → API → service_role (secret)
```

**Solução B - Verificar Deploy**:
```bash
# Verificar se function foi deployada
supabase functions list

# Se não aparecer, fazer deploy
supabase functions deploy send-emails
```

**Solução C - Verificar Secrets**:
```bash
# Listar secrets
supabase secrets list

# Se RESEND_API_KEY não aparecer, configurar
supabase secrets set RESEND_API_KEY=re_SUA_KEY
supabase secrets set FROM_EMAIL=noreply@aiknowledgestore.com
supabase secrets set FROM_NAME="AI Knowledge Store"
```

---

### Problema 6: Edge Function retorna erro

**Verificar Logs**:
```bash
supabase functions logs send-emails --tail
```

**Erros Comuns**:

#### Erro: "RESEND_API_KEY not found"
```bash
# Configurar secret
supabase secrets set RESEND_API_KEY=re_SUA_KEY
```

#### Erro: "Resend API error: 401"
```
Causa: API Key inválida
Solução: 
1. Verificar key no Resend Dashboard
2. Criar nova key se necessário
3. Atualizar secret no Supabase
```

#### Erro: "Resend API error: 422"
```
Causa: Email inválido ou domínio não verificado
Solução:
1. Verificar FROM_EMAIL está correto
2. Para produção, verificar domínio no Resend
3. Para teste, usar email de teste do Resend
```

---

## 🧪 Teste Completo Passo a Passo

### 1. Verificar Membros
```sql
SELECT id, email FROM members;
```
**Esperado**: Pelo menos 1 membro

### 2. Adicionar Produto
```
Admin Dashboard → Products → Add Product
Status: Active
```

### 3. Verificar Notificações
```sql
SELECT * FROM notifications 
WHERE type = 'new_product' 
ORDER BY created_at DESC;
```
**Esperado**: 1 notificação por membro

### 4. Verificar Fila
```sql
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```
**Esperado**: 1 email por membro

### 5. Processar Fila
```bash
curl -X POST \
  https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY"
```

### 6. Verificar Envio
```sql
SELECT * FROM email_queue 
WHERE status = 'sent' 
ORDER BY sent_at DESC;
```
**Esperado**: Emails com status 'sent'

### 7. Verificar no Resend
```
https://resend.com/emails
```
**Esperado**: Emails na lista

---

## 📊 Queries Úteis

### Ver últimas notificações
```sql
SELECT 
  n.created_at,
  m.email,
  n.type,
  n.message
FROM notifications n
JOIN members m ON m.id = n.member_id
ORDER BY n.created_at DESC
LIMIT 10;
```

### Ver fila de emails
```sql
SELECT 
  eq.created_at,
  m.email,
  eq.subject,
  eq.status,
  eq.retry_count
FROM email_queue eq
JOIN members m ON m.id = eq.member_id
ORDER BY eq.created_at DESC
LIMIT 10;
```

### Ver estatísticas
```sql
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;
```

### Limpar fila de teste
```sql
-- CUIDADO: Isso apaga TODOS os emails da fila
DELETE FROM email_queue;
DELETE FROM notifications WHERE type = 'new_product';
```

---

## 🔄 Resetar Sistema (Se necessário)

Se nada funcionar, resetar tudo:

```sql
-- 1. Dropar triggers
DROP TRIGGER IF EXISTS on_new_product_notify_members ON products;
DROP TRIGGER IF EXISTS on_product_activated_notify_members ON products;
DROP TRIGGER IF EXISTS on_notification_queue_email ON notifications;

-- 2. Dropar functions
DROP FUNCTION IF EXISTS notify_members_new_product();
DROP FUNCTION IF EXISTS notify_members_product_activated();
DROP FUNCTION IF EXISTS queue_email_for_notification();
DROP FUNCTION IF EXISTS get_pending_emails(INTEGER);
DROP FUNCTION IF EXISTS mark_email_sent(UUID);
DROP FUNCTION IF EXISTS mark_email_failed(UUID);

-- 3. Dropar tabela
DROP TABLE IF EXISTS email_queue;

-- 4. Limpar notificações de teste
DELETE FROM notifications WHERE type = 'new_product';

-- 5. Executar setup novamente
-- Copiar e executar: supabase/email-notifications-setup.sql
```

---

## ✅ Checklist de Verificação

- [ ] Triggers instalados (3 triggers)
- [ ] Tabela email_queue existe
- [ ] Pelo menos 1 membro cadastrado
- [ ] Produto adicionado com status "Active"
- [ ] Notificações criadas
- [ ] Emails na fila (status: pending)
- [ ] Edge Function deployada
- [ ] Secrets configurados (RESEND_API_KEY, FROM_EMAIL, FROM_NAME)
- [ ] Edge Function executada manualmente
- [ ] Emails com status "sent"
- [ ] Emails visíveis no Resend Dashboard

---

## 🆘 Ainda Não Funciona?

Se seguiu todos os passos e ainda não funciona:

1. **Copie o resultado** do diagnóstico (`test-email-system.sql`)
2. **Copie os logs** da Edge Function (`supabase functions logs send-emails`)
3. **Me envie** para análise detalhada

---

## 📞 Comandos Rápidos

```bash
# Ver logs da function
supabase functions logs send-emails --tail

# Listar secrets
supabase secrets list

# Executar function manualmente
curl -X POST https://ffdqqiunkzhtgbgaojay.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY"

# Ver status da function
supabase functions list
```

---

**Execute o diagnóstico e me envie o resultado!** 🔍
