# ⚡ Correção Rápida - Email Service

## 🎯 Situação Atual

✅ Serviço rodando em background  
🟡 Precisa de 1 correção SQL (2 minutos)

---

## 🔧 Correção (2 Minutos)

### 1. Abrir Supabase

https://ffdqqiunkzhtgbgaojay.supabase.co → **SQL Editor**

### 2. Executar SQL

Copie e cole este SQL:

```sql
-- Fix get_pending_emails Function
DROP FUNCTION IF EXISTS get_pending_emails(INTEGER);

CREATE OR REPLACE FUNCTION get_pending_emails(batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  member_id UUID,
  member_email TEXT,
  email_type VARCHAR,
  subject TEXT,
  body TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.id,
    eq.member_id,
    m.email::TEXT as member_email,
    eq.email_type::VARCHAR,
    eq.subject,
    eq.body
  FROM email_queue eq
  JOIN members m ON m.id = eq.member_id
  WHERE eq.status = 'pending'
    AND eq.retry_count < 3
  ORDER BY eq.created_at ASC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test
SELECT * FROM get_pending_emails(10);
```

Clique em **Run**.

### 3. Adicionar Fernando

Copie e cole este SQL:

```sql
-- Adicionar Fernando como membro
INSERT INTO members (email, profile_data)
VALUES (
  'fernandoquipiaca007@gmail.com',
  '{"name": "Fernando"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Criar notificação
INSERT INTO notifications (member_id, type, message, read_status)
SELECT 
  id,
  'new_product',
  'Novo produto disponível: Teste de Email! Confira agora na biblioteca.',
  false
FROM members
WHERE email = 'fernandoquipiaca007@gmail.com';
```

Clique em **Run**.

### 4. Aguardar

⏰ O serviço vai enviar o email nos próximos **5 minutos**.

---

## ✅ Pronto!

Depois disso:
- ✅ Sistema 100% funcional
- ✅ Emails enviados automaticamente
- ✅ Totalmente integrado

---

## 📧 Verificar Email

Cheque: **fernandoquipiaca007@gmail.com**

Se não chegar em 5 minutos:
1. Verificar pasta de spam
2. Ver logs do serviço no terminal
3. Executar: `SELECT * FROM email_queue WHERE status = 'pending'`

---

**🚀 Execute os 2 SQLs acima e aguarde 5 minutos!**
