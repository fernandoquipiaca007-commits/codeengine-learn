# 🔧 Corrigir Serviço de Email - AGORA

## ❌ Problema Detectado

O serviço está rodando mas há um erro na função SQL:
```
❌ Erro ao buscar emails: structure of query does not match function result type
```

## ✅ Solução Rápida (2 minutos)

### Passo 1: Executar SQL de Correção

1. Abra **Supabase Dashboard**: https://ffdqqiunkzhtgbgaojay.supabase.co
2. Vá para **SQL Editor**
3. Abra o arquivo `supabase/fix-email-function.sql`
4. Copie **TODO** o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

### Passo 2: Verificar Correção

Você deve ver uma tabela com os emails pendentes:

| id | member_id | member_email | email_type | subject | body |
|----|-----------|--------------|------------|---------|------|
| ... | ... | teste@teste.com | new_product | 🎉 Novo... | Olá... |

Se aparecer essa tabela, **está funcionando**! ✅

### Passo 3: Aguardar Processamento

O serviço está rodando em background e vai processar os emails automaticamente nos próximos **5 minutos**.

Você verá no terminal:
```
🔄 Verificando fila de emails...
📬 Encontrados 1 emails pendentes
📧 Enviando email para teste@teste.com...
✅ Email enviado com sucesso!
```

---

## 📧 Enviar Email para fernandoquipiaca007@gmail.com

### Opção 1: Adicionar Membro no Banco (Recomendado)

Execute no **Supabase SQL Editor**:

```sql
-- Adicionar Fernando como membro
INSERT INTO members (email, profile_data)
VALUES (
  'fernandoquipiaca007@gmail.com',
  '{"name": "Fernando"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Criar notificação para Fernando
INSERT INTO notifications (member_id, type, message, read_status)
SELECT 
  id,
  'new_product',
  'Novo produto disponível: Teste de Email! Confira agora na biblioteca.',
  false
FROM members
WHERE email = 'fernandoquipiaca007@gmail.com';
```

Isso vai:
1. ✅ Adicionar Fernando como membro
2. ✅ Criar notificação
3. ✅ Trigger vai adicionar email na fila automaticamente
4. ✅ Serviço vai enviar email nos próximos 5 minutos

### Opção 2: Adicionar Diretamente na Fila

Execute no **Supabase SQL Editor**:

```sql
-- Adicionar email diretamente na fila
INSERT INTO email_queue (member_id, email_type, subject, body, status)
SELECT 
  id,
  'new_product',
  '🎉 Novo Produto Disponível na AI Knowledge Store!',
  'Olá Fernando,

Temos novidades para você! Um novo produto acaba de ser adicionado à nossa biblioteca:

Novo produto disponível: Teste de Email! Confira agora na biblioteca.

Acesse agora e confira: https://seu-dominio.com/library

Não perca essa oportunidade de expandir seus conhecimentos!

Atenciosamente,
Equipe CodeEngine

---
Para gerenciar suas notificações, acesse: https://seu-dominio.com/member',
  'pending'
FROM members
WHERE email = 'fernandoquipiaca007@gmail.com';
```

---

## 🔍 Verificar Status

### Ver Emails Pendentes

```sql
SELECT 
  eq.id,
  m.email,
  eq.subject,
  eq.status,
  eq.created_at
FROM email_queue eq
JOIN members m ON m.id = eq.member_id
WHERE eq.status = 'pending'
ORDER BY eq.created_at DESC;
```

### Ver Emails Enviados

```sql
SELECT 
  eq.id,
  m.email,
  eq.subject,
  eq.status,
  eq.sent_at
FROM email_queue eq
JOIN members m ON m.id = eq.member_id
WHERE eq.status = 'sent'
ORDER BY eq.sent_at DESC;
```

---

## 🚀 Forçar Envio Imediato (Opcional)

Se não quiser esperar 5 minutos, você pode:

### Opção 1: Reiniciar Serviço

No terminal onde o serviço está rodando:
1. Pressione **Ctrl+C** para parar
2. Execute novamente: `npm start`
3. O serviço vai processar imediatamente ao iniciar

### Opção 2: Chamar Função Manualmente

Execute no **Supabase SQL Editor**:

```sql
-- Processar emails manualmente
SELECT * FROM get_pending_emails(10);
```

Isso mostra os emails que serão enviados.

---

## ✅ Checklist

- [ ] Executar `supabase/fix-email-function.sql` no Supabase SQL Editor
- [ ] Verificar que a função retorna emails pendentes
- [ ] Adicionar Fernando como membro (Opção 1) OU adicionar email na fila (Opção 2)
- [ ] Aguardar 5 minutos OU reiniciar serviço
- [ ] Verificar email em fernandoquipiaca007@gmail.com
- [ ] Verificar pasta de spam se não chegar

---

## 🎯 Resumo

**O que fazer agora**:

1. ✅ Execute `supabase/fix-email-function.sql` no Supabase
2. ✅ Execute um dos SQLs para adicionar Fernando
3. ✅ Aguarde 5 minutos (ou reinicie o serviço)
4. ✅ Verifique o email

**O serviço já está rodando em background!** 🚀

Você pode ver os logs em tempo real no terminal onde executou `npm start`.

---

## 📞 Suporte

Se o email não chegar:

1. **Verificar logs do serviço** no terminal
2. **Verificar fila**: `SELECT * FROM email_queue WHERE status = 'pending'`
3. **Verificar Resend Dashboard**: https://resend.com/emails
4. **Verificar pasta de spam** no Gmail

---

**Próximo passo**: Execute o SQL de correção agora! 🚀
