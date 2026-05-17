# ⚡ Quick Start - Webhook em 5 Minutos

## 🎯 Objetivo
Fazer o webhook funcionar para que as compras sejam salvas automaticamente.

---

## 📋 Comandos (Copie e Cole)

### 1️⃣ Instalar Stripe CLI (Windows - Scoop)
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Não tem Scoop?** Baixe direto: https://github.com/stripe/stripe-cli/releases/latest

---

### 2️⃣ Login
```bash
stripe login
```
*(Abrirá o navegador - autorize)*

---

### 3️⃣ Iniciar Webhook
```bash
cd backend
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

**Você verá:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

---

### 4️⃣ Copiar Secret

**COPIE** o `whsec_...` que apareceu acima.

Abra `backend/.env.backend` e adicione esta linha:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

---

### 5️⃣ Reiniciar Backend

No terminal do backend:
- Pressione `Ctrl+C`
- Execute: `npm run dev`

Ou deixe o tsx watch reiniciar automaticamente.

---

### 6️⃣ Testar

1. Recarregue a Store: http://localhost:3000 (F5)
2. Faça um pagamento teste:
   - Cartão: `4242 4242 4242 4242`
   - Data: `12/34`
   - CVC: `123`
3. Observe o terminal do Stripe CLI:
   ```
   --> checkout.session.completed
   <-- [200] POST http://localhost:3001/api/stripe/webhook
   ```

---

## ✅ Verificar se Funcionou

No Supabase SQL Editor:
```sql
SELECT * FROM purchases ORDER BY created_at DESC LIMIT 1;
```

Se aparecer a compra = **FUNCIONOU!** 🎉

---

## 🚨 Problemas?

### "stripe: command not found"
✅ Instale o Stripe CLI (passo 1)

### "Connection refused"
✅ Backend não está rodando - execute `npm run dev` na pasta backend

### "Invalid signature"
✅ Secret errado - pegue o novo do `stripe listen` e atualize `.env.backend`

### "Compra não aparece"
✅ Verifique os logs:
```sql
SELECT * FROM stripe_webhook_logs ORDER BY created_at DESC LIMIT 5;
```

---

## 📊 O Que Deve Acontecer

Após o pagamento:
- ✅ Compra salva em `purchases`
- ✅ Acesso liberado em `digital_deliveries`
- ✅ Notificação criada em `notifications`
- ✅ Email na fila em `email_queue`
- ✅ Success page mostra dados reais

---

## 🎯 Checklist Rápido

- [ ] Stripe CLI instalado
- [ ] Login feito
- [ ] Webhook rodando (terminal aberto)
- [ ] Secret copiado para `.env.backend`
- [ ] Backend reiniciado
- [ ] Teste realizado
- [ ] Compra aparece no banco

---

**Tempo estimado: 5-10 minutos** ⏱️

**Documentação completa:** `STRIPE_WEBHOOK_SETUP.md`
