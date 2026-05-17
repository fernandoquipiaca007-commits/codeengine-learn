# 📧 CONFIGURAR FORMULÁRIO DE CONTATO

## 🎯 OBJETIVO

Fazer o formulário de contato enviar emails para **codeengine2@gmail.com** quando alguém preencher o formulário.

---

## 📋 PASSO A PASSO

### 1️⃣ Atualizar Tabela Email Queue

**Execute no Supabase SQL Editor:**

```sql
-- Make member_id nullable
ALTER TABLE email_queue 
ALTER COLUMN member_id DROP NOT NULL;

-- Add recipient_email column
ALTER TABLE email_queue 
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Update get_pending_emails function
CREATE OR REPLACE FUNCTION get_pending_emails(batch_size INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  member_id UUID,
  member_email TEXT,
  email_type TEXT,
  subject TEXT,
  body TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.id,
    eq.member_id,
    COALESCE(
      m.email,
      'codeengine2@gmail.com'
    ) as member_email,
    eq.email_type,
    eq.subject,
    eq.body,
    eq.created_at
  FROM email_queue eq
  LEFT JOIN members m ON eq.member_id = m.id
  WHERE eq.status = 'pending'
  AND eq.retry_count < 3
  ORDER BY eq.created_at ASC
  LIMIT batch_size
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 2️⃣ Criar Função de Envio de Contato

**Execute no Supabase SQL Editor:**

```sql
CREATE OR REPLACE FUNCTION send_contact_form_email(
  p_name TEXT,
  p_email TEXT,
  p_category TEXT,
  p_subject TEXT,
  p_message TEXT
)
RETURNS JSON AS $$
DECLARE
  v_email_subject TEXT;
  v_email_body TEXT;
BEGIN
  v_email_subject := '📧 Novo Contato CodeEngine Learn: ' || p_category;
  
  v_email_body := 'Nova mensagem recebida através do formulário de contato da CodeEngine Learn:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMAÇÕES DO CONTATO

Nome: ' || p_name || '
Email: ' || p_email || '
Categoria: ' || p_category || '
Assunto: ' || p_subject || '

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 MENSAGEM:

' || p_message || '

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para responder, envie um email para: ' || p_email || '

---
CodeEngine Learn - Ecossistema Premium de Conhecimento Digital
📧 codeengine2@gmail.com | 📱 WhatsApp: +244 957 459 336';

  INSERT INTO email_queue (
    member_id,
    email_type,
    subject,
    body,
    status,
    created_at
  ) VALUES (
    NULL,
    'contact_form',
    v_email_subject,
    v_email_body,
    'pending',
    NOW()
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Email queued successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_contact_form_email TO authenticated, anon;
```

---

### 3️⃣ Testar o Sistema

1. **Verifique se o Email Service está rodando:**
   ```bash
   # Deve estar rodando em background
   # Se não estiver, execute:
   cd backend
   node email-service.js
   ```

2. **Acesse o formulário de contato:**
   ```
   http://localhost:3000
   Clique em "CONTATO" no menu
   ```

3. **Preencha o formulário:**
   ```
   Nome: Seu Nome
   Email: seu@email.com
   Categoria: Suporte Técnico
   Assunto: Teste de formulário
   Mensagem: Esta é uma mensagem de teste
   ```

4. **Clique em "ENVIAR MENSAGEM"**

5. **Verifique:**
   - ✅ Mensagem "Mensagem Enviada!" aparece
   - ✅ Terminal do Email Service mostra log de envio
   - ✅ Email chega em codeengine2@gmail.com

---

## 📧 FORMATO DO EMAIL RECEBIDO

```
De: CodeEngine Learn <codeengine2@gmail.com>
Para: codeengine2@gmail.com
Assunto: 📧 Novo Contato CodeEngine Learn: Suporte Técnico

[Header com gradiente roxo]
CodeEngine Learn
Ecossistema Premium de Conhecimento Digital

Nova mensagem recebida através do formulário de contato:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMAÇÕES DO CONTATO

Nome: João Silva
Email: joao@email.com
Categoria: Suporte Técnico
Assunto: Problema com download

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 MENSAGEM:

Não consigo fazer o download do ebook que comprei.
Pode me ajudar?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para responder, envie um email para: joao@email.com

---
CodeEngine Learn - Ecossistema Premium de Conhecimento Digital
📧 codeengine2@gmail.com | 📱 WhatsApp: +244 957 459 336

[Footer]
© 2026 CodeEngine Learn
```

---

## ✅ CHECKLIST

- [ ] SQL 1 executado (atualizar email_queue)
- [ ] SQL 2 executado (criar função de contato)
- [ ] Email Service rodando
- [ ] Formulário testado
- [ ] Email recebido em codeengine2@gmail.com

---

## 🐛 TROUBLESHOOTING

### "Erro ao enviar mensagem"
**Solução:**
1. Verifique se os SQLs foram executados
2. Verifique se o Email Service está rodando
3. Verifique os logs do Email Service no terminal

### "Email não chegou"
**Solução:**
1. Aguarde até 5 minutos (intervalo de processamento)
2. Verifique a fila de emails no Supabase:
   ```sql
   SELECT * FROM email_queue 
   WHERE email_type = 'contact_form' 
   ORDER BY created_at DESC;
   ```
3. Verifique se o status é 'sent'

### "Função não existe"
**Solução:**
1. Execute o SQL 2 novamente
2. Verifique se a função foi criada:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'send_contact_form_email';
   ```

---

## 🎉 RESULTADO FINAL

Após executar os 2 SQLs:

✅ **Formulário de contato funcionando**
✅ **Emails chegando em codeengine2@gmail.com**
✅ **Informações completas do remetente**
✅ **Design premium com branding CodeEngine Learn**
✅ **Resposta automática de confirmação**

---

**CodeEngine Learn - Ecossistema Premium de Conhecimento Digital**

**Guia de Configuração do Formulário de Contato - 13 de Maio de 2026**
