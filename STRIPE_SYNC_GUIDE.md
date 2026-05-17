# 🔄 Guia de Sincronização Stripe

## ✅ O que foi implementado:

1. **Componente StripeSync** (`admin/src/components/products/StripeSync.tsx`)
   - Botão de sincronização com Stripe
   - Estados visuais (syncing, synced, error)
   - Feedback em tempo real

2. **ProductTable Atualizado**
   - Botão "Sync to Stripe" em cada produto
   - Indicador visual se produto já está sincronizado
   - Atualização automática após sync

3. **Tipos TypeScript**
   - Campos `stripe_product_id` e `stripe_checkout_url` adicionados

4. **Variáveis de Ambiente**
   - `VITE_BACKEND_URL` configurado no admin

---

## 🧪 Como Testar:

### 1️⃣ **Certifique-se que os servidores estão rodando:**

```bash
# Terminal 1: Backend Stripe (já rodando)
cd backend
npm run dev
# ✅ Deve estar na porta 3001

# Terminal 2: Admin Dashboard
cd admin
npm run dev
# ✅ Deve estar na porta 5175
```

### 2️⃣ **Acesse o Admin Dashboard:**

```
http://localhost:5175
```

### 3️⃣ **Vá para Products:**

Clique em "Products" no menu lateral

### 4️⃣ **Sincronize um produto:**

Você verá um botão em cada produto:

- **Roxo "Sync to Stripe"** = Produto ainda não sincronizado
- **Verde "Synced"** = Produto já sincronizado

Clique no botão para sincronizar!

### 5️⃣ **Observe o processo:**

1. Botão muda para "Syncing..." com spinner
2. Requisição é enviada para o backend
3. Backend cria produto e preço no Stripe
4. Supabase é atualizado com IDs do Stripe
5. Botão muda para "Synced" (verde) ✅
6. Mensagem de sucesso aparece

---

## 🎨 Estados Visuais:

### **Não Sincronizado:**
```
🔄 Sync to Stripe (roxo)
```

### **Sincronizando:**
```
⏳ Syncing... (roxo com spinner)
```

### **Sincronizado:**
```
✅ Synced (verde)
```

### **Erro:**
```
❌ [mensagem de erro] (vermelho)
```

---

## 🔍 Verificar no Stripe Dashboard:

Após sincronizar, verifique:

1. Acesse: https://dashboard.stripe.com/test/products
2. Você deve ver o produto criado
3. Clique no produto para ver detalhes
4. Verifique o preço configurado

---

## 📊 Verificar no Supabase:

Execute no SQL Editor:

```sql
SELECT 
  id,
  title,
  price,
  stripe_product_id,
  stripe_price_id,
  stripe_checkout_url,
  status
FROM products
ORDER BY created_at DESC;
```

Produtos sincronizados terão:
- ✅ `stripe_product_id` preenchido
- ✅ `stripe_price_id` preenchido
- ✅ `stripe_checkout_url` preenchido

---

## 🐛 Troubleshooting:

### **Erro: "Failed to sync product"**

**Causa:** Backend não está rodando ou não está acessível

**Solução:**
```bash
cd backend
npm run dev
```

Verifique: http://localhost:3001/health

---

### **Erro: "Network request failed"**

**Causa:** CORS ou URL do backend incorreta

**Solução:**
1. Verifique `admin/.env.local`:
   ```env
   VITE_BACKEND_URL=http://localhost:3001
   ```
2. Reinicie o admin:
   ```bash
   cd admin
   npm run dev
   ```

---

### **Erro: "STRIPE_SECRET_KEY is required"**

**Causa:** Backend não carregou as variáveis de ambiente

**Solução:**
1. Verifique `backend/.env.backend`
2. Reinicie o backend:
   ```bash
   cd backend
   npm run dev
   ```

---

### **Botão não aparece**

**Causa:** Componente não foi importado corretamente

**Solução:**
1. Limpe o cache:
   ```bash
   cd admin
   rm -rf node_modules/.vite
   npm run dev
   ```

---

## 🎯 Fluxo Completo:

```
1. USER CLICA "Sync to Stripe"
   └─> StripeSync.tsx

2. REQUISIÇÃO PARA BACKEND
   └─> POST http://localhost:3001/api/stripe/sync-product
       └─> Body: { productId, name, description, price, images }

3. BACKEND PROCESSA
   └─> stripe-service.ts
       ├─> Cria produto no Stripe
       ├─> Cria preço no Stripe
       └─> Retorna IDs

4. BACKEND ATUALIZA SUPABASE
   └─> UPDATE products SET
       stripe_product_id = '...',
       stripe_price_id = '...',
       stripe_checkout_url = '...'

5. FRONTEND RECEBE RESPOSTA
   └─> StripeSync.tsx
       ├─> Mostra "Synced" ✅
       └─> Chama onSyncComplete()

6. TABELA ATUALIZA
   └─> Products.tsx
       └─> loadData() recarrega produtos
```

---

## 📝 Próximos Passos:

Após sincronizar produtos:

1. ✅ **Criar componente de checkout no frontend**
   - Botão "Buy Now" na página do produto
   - Redirecionar para Stripe Checkout

2. ✅ **Configurar webhooks**
   - Instalar Stripe CLI
   - Processar eventos de pagamento

3. ✅ **Testar fluxo completo**
   - Comprar produto
   - Verificar webhook
   - Verificar email
   - Testar download

---

## 🎉 Sucesso!

Se você conseguiu sincronizar um produto:

- ✅ Backend Stripe funcionando
- ✅ Admin Dashboard integrado
- ✅ Supabase atualizado
- ✅ Produto no Stripe Dashboard

**Próximo passo:** Criar o checkout no frontend! 🚀
