# 🎯 Guia Completo de Configuração Stripe

## 📋 Checklist Rápido

- [ ] 1. Executar SQL no Supabase
- [ ] 2. Obter chaves Stripe
- [ ] 3. Configurar variáveis de ambiente
- [ ] 4. Instalar dependências
- [ ] 5. Iniciar servidor Stripe
- [ ] 6. Configurar webhook no Stripe Dashboard
- [ ] 7. Testar checkout

---

## 🗄️ PASSO 1: Executar SQL no Supabase

### Execute o arquivo SQL:

1. Abra o Supabase Dashboard: https://app.supabase.com
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo de `supabase/stripe-integration-setup.sql`
5. Cole no editor e clique em **Run**

### ✅ O que será criado:

- ✅ `stripe_customers` - Mapeia users com Stripe customers
- ✅ `digital_deliveries` - Gerencia acesso aos produtos
- ✅ `stripe_webhook_logs` - Log de eventos Stripe
- ✅ `email_queue` - Fila de emails
- ✅ `sales_analytics` - Analytics de vendas
- ✅ Campos Stripe em `products`, `purchases`, `coupons`
- ✅ RLS policies configuradas
- ✅ Triggers e functions

---

## 🔑 PASSO 2: Obter Chaves Stripe

### 2.1 Acesse o Stripe Dashboard

1. Vá para: https://dashboard.stripe.com
2. Faça login na sua conta

### 2.2 Obter API Keys

1. No menu lateral, clique em **Developers**
2. Clique em **API keys**
3. Você verá duas chaves:

#### 🔓 Publishable Key (Pública - Frontend)
```
pk_test_... (modo teste)
pk_live_... (modo produção)
```

#### 🔐 Secret Key (Secreta - Backend)
```
sk_test_... (modo teste)
sk_live_... (modo produção)
```

⚠️ **IMPORTANTE**: 
- Use `pk_test_` e `sk_test_` para desenvolvimento
- Use `pk_live_` e `sk_live_` apenas em produção
- **NUNCA** exponha a Secret Key no frontend!

### 2.3 Copiar as Chaves

Copie ambas as chaves, você vai precisar delas no próximo passo.

---

## ⚙️ PASSO 3: Configurar Variáveis de Ambiente

### 3.1 Backend (.env.backend)

Abra `backend/.env.backend` e atualize:

```env
# Supabase Configuration (já configurado)
SUPABASE_URL=https://ffdqqiunkzhtgbgaojay.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend Email Configuration (já configurado)
RESEND_API_KEY=re_izmUsyZW_wVCSVkMtDpfBtURrt4Gbhjbd
FROM_EMAIL=onboarding@resend.dev
FROM_NAME=CodeEngine Learn

# ⚡ STRIPE CONFIGURATION - ATUALIZE AQUI!
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_SECRETA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_... (vamos configurar no passo 6)

# App Configuration
PORT=3001
NODE_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_ADMIN_URL=http://localhost:5175
```

### 3.2 Store Frontend (.env.store)

Abra `.env.store` e atualize:

```env
# Supabase Configuration (já configurado)
VITE_SUPABASE_URL=https://ffdqqiunkzhtgbgaojay.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ch9LKmMeHbcMaETHrvn6Rg_ct7douxi

# ⚡ STRIPE CONFIGURATION - ATUALIZE AQUI!
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_PUBLICA_AQUI

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:3001
```

### 3.3 Admin Dashboard (admin/.env.local)

Abra `admin/.env.local` e adicione (se não existir):

```env
# Supabase Configuration (já configurado)
VITE_SUPABASE_URL=https://ffdqqiunkzhtgbgaojay.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ch9LKmMeHbcMaETHrvn6Rg_ct7douxi

# Backend API
VITE_BACKEND_URL=http://localhost:3001
```

---

## 📦 PASSO 4: Instalar Dependências

As dependências já estão no `package.json`, mas vamos garantir:

```bash
cd backend
npm install
```

Isso vai instalar:
- ✅ express
- ✅ cors
- ✅ stripe
- ✅ @supabase/supabase-js
- ✅ dotenv
- ✅ typescript
- ✅ tsx

---

## 🚀 PASSO 5: Iniciar Servidor Stripe

### 5.1 Iniciar em modo desenvolvimento:

```bash
cd backend
npm run dev
```

### 5.2 Verificar se está rodando:

Você deve ver:

```
╔════════════════════════════════════════╗
║   STRIPE API SERVER                    ║
║   CodeEngine Learn                     ║
╠════════════════════════════════════════╣
║   Status: Running                      ║
║   Port: 3001                           ║
║   Environment: development             ║
╚════════════════════════════════════════╝
```

### 5.3 Testar health check:

Abra no navegador: http://localhost:3001/health

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-05-13T..."
}
```

---

## 🔗 PASSO 6: Configurar Webhook no Stripe

### 6.1 Por que precisamos de webhook?

O webhook permite que o Stripe notifique seu backend quando:
- ✅ Um pagamento é confirmado
- ✅ Um pagamento falha
- ✅ Um reembolso é processado
- ✅ Outros eventos importantes

### 6.2 Configurar webhook (Desenvolvimento Local)

Para desenvolvimento local, use o **Stripe CLI**:

#### Instalar Stripe CLI:

**Windows:**
```bash
# Usando Scoop
scoop install stripe

# Ou baixe direto:
# https://github.com/stripe/stripe-cli/releases
```

**Mac/Linux:**
```bash
brew install stripe/stripe-cli/stripe
```

#### Fazer login:
```bash
stripe login
```

#### Iniciar webhook forwarding:
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Você verá algo como:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

#### Copiar o webhook secret:

Copie o `whsec_xxxxxxxxxxxxx` e adicione em `backend/.env.backend`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Reiniciar o servidor:
```bash
# Ctrl+C para parar
npm run dev
```

### 6.3 Configurar webhook (Produção)

Quando for para produção:

1. Vá em **Developers** > **Webhooks** no Stripe Dashboard
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.com/api/stripe/webhook`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `invoice.payment_succeeded`
5. Copie o **Signing secret** e adicione no `.env.backend` de produção

---

## 🧪 PASSO 7: Testar Checkout

### 7.1 Criar um produto de teste no Admin

1. Acesse: http://localhost:5175
2. Faça login como admin
3. Vá em **Products**
4. Clique em **New Product**
5. Preencha os dados:
   - Title: "E-book de Teste"
   - Description: "Produto para testar Stripe"
   - Price: 49.90
   - Category: E-books
   - Status: Active
6. Clique em **Save**

### 7.2 Sincronizar produto com Stripe

Após criar o produto, você precisa sincronizá-lo com o Stripe.

**Opção 1: Via Admin Dashboard** (recomendado)

No Admin, ao lado do produto, clique em **Sync with Stripe**

**Opção 2: Via API diretamente**

```bash
curl -X POST http://localhost:3001/api/stripe/sync-product \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "UUID_DO_PRODUTO",
    "name": "E-book de Teste",
    "description": "Produto para testar Stripe",
    "price": 49.90,
    "images": ["URL_DA_CAPA"]
  }'
```

### 7.3 Testar compra na Store

1. Acesse: http://localhost:5173
2. Vá em **Library**
3. Clique no produto de teste
4. Clique em **Buy Now**
5. Você será redirecionado para o Stripe Checkout

### 7.4 Usar cartão de teste

No Stripe Checkout, use estes dados de teste:

**Cartão de sucesso:**
```
Número: 4242 4242 4242 4242
Data: 12/34 (qualquer data futura)
CVC: 123
CEP: 12345
```

**Outros cartões de teste:**
- `4000 0000 0000 0002` - Cartão recusado
- `4000 0000 0000 9995` - Pagamento requer autenticação

### 7.5 Verificar resultado

Após o pagamento:

1. ✅ Você será redirecionado para `/success`
2. ✅ Um registro será criado em `purchases`
3. ✅ Um registro será criado em `digital_deliveries`
4. ✅ Uma notificação será criada
5. ✅ Um email será enviado (se configurado)
6. ✅ O webhook será processado

### 7.6 Verificar no Supabase

No Supabase SQL Editor:

```sql
-- Ver compras
SELECT * FROM purchases ORDER BY created_at DESC LIMIT 5;

-- Ver entregas digitais
SELECT * FROM digital_deliveries ORDER BY created_at DESC LIMIT 5;

-- Ver logs de webhook
SELECT * FROM stripe_webhook_logs ORDER BY created_at DESC LIMIT 5;

-- Ver analytics
SELECT * FROM sales_analytics ORDER BY date DESC LIMIT 5;
```

---

## 🎯 Endpoints Disponíveis

### Backend Stripe Server (http://localhost:3001)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| POST | `/api/stripe/sync-product` | Sincronizar produto com Stripe |
| POST | `/api/stripe/create-checkout` | Criar sessão de checkout |
| POST | `/api/stripe/webhook` | Receber eventos Stripe |
| POST | `/api/stripe/create-coupon` | Criar cupom no Stripe |
| GET | `/api/stripe/validate-coupon` | Validar cupom |
| PUT | `/api/stripe/update-product` | Atualizar produto no Stripe |

---

## 🐛 Troubleshooting

### Erro: "STRIPE_SECRET_KEY is required"

**Solução:** Verifique se você configurou a chave em `backend/.env.backend`

### Erro: "Cannot find module 'cors'"

**Solução:** 
```bash
cd backend
npm install cors @types/cors
```

### Erro: "Webhook signature verification failed"

**Solução:** 
1. Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
2. Certifique-se de que o Stripe CLI está rodando
3. Reinicie o servidor backend

### Erro: "Product not configured for payments"

**Solução:** O produto precisa ter `stripe_price_id`. Execute o sync do produto.

### Checkout não redireciona

**Solução:** 
1. Verifique se o backend está rodando (http://localhost:3001/health)
2. Verifique o console do navegador para erros
3. Verifique se as URLs de sucesso/cancelamento estão corretas

---

## 📊 Monitoramento

### Ver logs do servidor:

O servidor mostra logs de todas as requisições:

```
POST /api/stripe/create-checkout
POST /api/stripe/webhook
GET /api/stripe/validate-coupon
```

### Ver eventos no Stripe Dashboard:

1. Vá em **Developers** > **Events**
2. Você verá todos os eventos em tempo real
3. Clique em um evento para ver detalhes

### Ver webhooks processados:

No Supabase:

```sql
SELECT 
  event_type,
  processed,
  error_message,
  created_at
FROM stripe_webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 Próximos Passos

Após configurar o Stripe:

1. ✅ Criar componente de checkout no frontend
2. ✅ Implementar página de sucesso
3. ✅ Implementar página de download
4. ✅ Adicionar cupons de desconto
5. ✅ Implementar analytics de vendas
6. ✅ Configurar emails transacionais

---

## 📚 Recursos

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Trocar chaves de teste por chaves de produção
- [ ] Configurar webhook de produção no Stripe Dashboard
- [ ] Testar fluxo completo em ambiente de staging
- [ ] Configurar domínio personalizado
- [ ] Ativar 3D Secure para pagamentos
- [ ] Configurar notificações de erro
- [ ] Implementar monitoramento de transações
- [ ] Revisar políticas de reembolso
- [ ] Configurar impostos (se aplicável)
- [ ] Testar com diferentes métodos de pagamento

---

**🚀 Pronto! Sua integração Stripe está configurada!**
