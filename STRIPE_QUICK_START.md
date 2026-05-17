# ⚡ Stripe - Quick Start (5 minutos)

## 🎯 Configuração Rápida

### 1️⃣ Execute o SQL no Supabase (1 min)

```bash
# Abra: https://app.supabase.com
# SQL Editor > New Query
# Cole o conteúdo de: supabase/stripe-integration-setup.sql
# Clique em Run
```

### 2️⃣ Obtenha suas chaves Stripe (1 min)

```bash
# Abra: https://dashboard.stripe.com/test/apikeys
# Copie:
# - Publishable key (pk_test_...)
# - Secret key (sk_test_...)
```

### 3️⃣ Configure as variáveis de ambiente (1 min)

**backend/.env.backend:**
```env
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_... (configure depois)
```

**.env.store:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_AQUI
VITE_BACKEND_URL=http://localhost:3001
```

### 4️⃣ Teste a configuração (1 min)

```bash
cd backend
node test-stripe-setup.js
```

### 5️⃣ Inicie o servidor (1 min)

```bash
cd backend
npm run dev
```

Acesse: http://localhost:3001/health

---

## 🧪 Teste Rápido

### Criar produto de teste:

1. Admin Dashboard: http://localhost:5175
2. Products > New Product
3. Preencha e salve
4. Clique em "Sync with Stripe"

### Testar compra:

1. Store: http://localhost:5173
2. Library > Clique no produto
3. Buy Now
4. Use cartão: `4242 4242 4242 4242`
5. Data: `12/34`, CVC: `123`

---

## � Documentação Completa

Ver: `STRIPE_SETUP_GUIDE.md`

---

## ✅ Checklist

- [ ] SQL executado no Supabase
- [ ] Chaves Stripe configuradas
- [ ] Servidor rodando (http://localhost:3001/health)
- [ ] Produto sincronizado com Stripe
- [ ] Checkout testado com sucesso

---

## 🆘 Problemas?

### Erro: "STRIPE_SECRET_KEY is required"
→ Configure a chave em `backend/.env.backend`

### Erro: "Cannot find module 'cors'"
→ Execute: `cd backend && npm install`

### Checkout não funciona
→ Verifique se o backend está rodando
→ Verifique o console do navegador

---

## 🎯 Próximos Passos

Após configurar:

1. ✅ Configurar webhook (Stripe CLI)
2. ✅ Criar componente de checkout no frontend
3. ✅ Implementar página de sucesso
4. ✅ Testar fluxo completo

---

**🚀 Pronto em 5 minutos!**
