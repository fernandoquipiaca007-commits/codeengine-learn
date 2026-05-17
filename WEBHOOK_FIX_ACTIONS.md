# 🔧 Ações Necessárias - Webhook Fix

## ✅ O Que Foi Feito

1. **Success Page Melhorada** ✅
   - Agora busca dados reais da sessão Stripe
   - Mostra nome do produto, email, valor pago
   - Mostra loading enquanto carrega
   - Mostra erro se algo falhar

2. **Novo Endpoint Criado** ✅
   - `GET /api/stripe/session/:sessionId`
   - Busca detalhes da sessão do Stripe
   - Usado pela Success page

3. **Webhook Handler Completo** ✅
   - Salva compra no banco
   - Libera acesso ao produto
   - Cria notificação
   - Envia email
   - Atualiza analytics

---

## ❌ O Que Você Precisa Fazer AGORA

### 1️⃣ Instalar Stripe CLI

**Opção A (Recomendado - Scoop):**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Opção B (Download direto):**
- Baixe: https://github.com/stripe/stripe-cli/releases/latest
- Extraia e adicione ao PATH

**Verificar:**
```bash
stripe --version
```

---

### 2️⃣ Fazer Login no Stripe

```bash
stripe login
```

Isso abrirá o navegador para autorizar.

---

### 3️⃣ Iniciar Webhook Forwarding

**Opção A (Script Automático):**
```powershell
cd backend
.\start-stripe-webhook.ps1
```

**Opção B (Manual):**
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

**Você verá:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

---

### 4️⃣ Copiar Webhook Secret

**COPIE** o secret que apareceu (`whsec_...`)

Abra `backend/.env.backend` e adicione:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

---

### 5️⃣ Reiniciar Backend

No terminal do backend (Terminal 9):
- Pressione `Ctrl+C` para parar
- Execute: `npm run dev`

Ou deixe o tsx watch reiniciar automaticamente.

---

### 6️⃣ Testar o Fluxo Completo

1. **Recarregue a Store** (F5 em http://localhost:3000)
2. **Faça um pagamento teste:**
   - Vá para um produto
   - Clique em "Comprar Agora"
   - Use cartão: `4242 4242 4242 4242`
   - Complete o pagamento
3. **Observe o terminal do Stripe CLI:**
   ```
   --> checkout.session.completed [evt_xxx]
   <-- [200] POST http://localhost:3001/api/stripe/webhook
   ```
4. **Verifique a Success Page:**
   - Deve mostrar nome do produto
   - Deve mostrar email
   - Deve mostrar valor pago

---

### 7️⃣ Verificar no Supabase

Execute no SQL Editor:

```sql
-- Ver compras recentes
SELECT 
  p.*,
  pr.title as product_name,
  m.email as customer_email
FROM purchases p
JOIN products pr ON p.product_id = pr.id
JOIN members m ON p.member_id = m.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Ver acessos liberados
SELECT * FROM digital_deliveries
ORDER BY created_at DESC
LIMIT 5;

-- Ver notificações
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT 5;

-- Ver emails na fila
SELECT * FROM email_queue
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🎯 Checklist

- [ ] Stripe CLI instalado
- [ ] Login feito (`stripe login`)
- [ ] Webhook forwarding rodando (`stripe listen`)
- [ ] Webhook secret copiado
- [ ] Webhook secret adicionado em `.env.backend`
- [ ] Backend reiniciado
- [ ] Store recarregada (F5)
- [ ] Pagamento teste realizado
- [ ] Success page mostra dados corretos
- [ ] Compra aparece no Supabase
- [ ] Notificação criada
- [ ] Email na fila

---

## 🚨 Problemas Comuns

### "Connection refused"
✅ Certifique-se que o backend está rodando (porta 3001)

### "Invalid signature"
✅ Webhook secret está errado - pegue o novo do `stripe listen`

### "Webhook não recebe eventos"
✅ Verifique se o Stripe CLI está rodando
✅ Verifique se a porta está correta (3001)

### "Success page vazia"
✅ Recarregue a Store (F5)
✅ Verifique se o backend está rodando
✅ Verifique o console do navegador (F12)

---

## 📊 Status Atual

| Item | Status |
|------|--------|
| Backend API | ✅ Rodando (Terminal 9) |
| Success Page | ✅ Atualizada |
| Webhook Handler | ✅ Implementado |
| Stripe CLI | ❌ Precisa instalar |
| Webhook Forwarding | ❌ Precisa iniciar |
| Webhook Secret | ❌ Precisa configurar |

---

## 🚀 Após Configurar

Quando tudo estiver funcionando:

1. ✅ Teste múltiplas compras
2. ✅ Teste com cupons
3. ✅ Verifique emails sendo enviados
4. ✅ Verifique área de membros
5. ✅ Verifique downloads

---

## 📚 Documentação

- **Guia Completo:** `STRIPE_WEBHOOK_SETUP.md`
- **Script Automático:** `backend/start-stripe-webhook.ps1`
- **Webhook Handler:** `backend/api/stripe/webhook.ts`
- **Success Page:** `src/pages/Success.tsx`

---

**Pronto para começar!** 🎉

Execute os passos acima na ordem e teste o fluxo completo.
