# 🔔 Configuração do Stripe Webhook Local

## ❌ Problema Atual

Após o pagamento ser aprovado no Stripe, o sistema não está:
- ✅ Salvando a compra no banco de dados
- ✅ Liberando acesso ao produto
- ✅ Enviando email de confirmação
- ✅ Criando notificação para o usuário
- ✅ Atualizando analytics

**Causa:** O Stripe Webhook não está configurado para enviar eventos para o backend local.

---

## ✅ Solução: Stripe CLI

O Stripe CLI permite receber webhooks localmente durante o desenvolvimento.

### Passo 1: Instalar Stripe CLI

#### Windows (Recomendado - Scoop):
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

#### Windows (Alternativo - Download direto):
1. Baixe: https://github.com/stripe/stripe-cli/releases/latest
2. Extraia o arquivo `stripe.exe`
3. Adicione ao PATH ou use o caminho completo

#### Verificar instalação:
```bash
stripe --version
```

---

### Passo 2: Login no Stripe

```bash
stripe login
```

Isso abrirá o navegador para você autorizar o acesso.

---

### Passo 3: Obter Webhook Secret

Execute este comando para iniciar o webhook forwarding:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

**Você verá algo assim:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

**COPIE** o webhook secret (`whsec_...`)

---

### Passo 4: Configurar Webhook Secret

Adicione o webhook secret no arquivo `backend/.env.backend`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx  # ← COLE AQUI

# Supabase Configuration
SUPABASE_URL=https://ffdqqiunkzhtgbgaojay.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# App URLs
VITE_APP_URL=http://localhost:3000
VITE_ADMIN_URL=http://localhost:5175
```

---

### Passo 5: Manter Stripe CLI Rodando

**IMPORTANTE:** Mantenha o Stripe CLI rodando em um terminal separado:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

**Você verá os eventos chegando:**
```
2026-05-13 16:30:45   --> checkout.session.completed [evt_xxx]
2026-05-13 16:30:45   <-- [200] POST http://localhost:3001/api/stripe/webhook [evt_xxx]
```

---

## 🧪 Testar o Webhook

### Opção 1: Fazer um Pagamento Real (Teste)

1. Acesse um produto na Store
2. Clique em "Comprar Agora"
3. Use o cartão de teste: `4242 4242 4242 4242`
4. Complete o pagamento
5. Observe o terminal do Stripe CLI - você deve ver:
   ```
   --> checkout.session.completed
   <-- [200] POST http://localhost:3001/api/stripe/webhook
   ```

### Opção 2: Simular Evento (Mais Rápido)

```bash
stripe trigger checkout.session.completed
```

---

## 📊 O Que o Webhook Faz

Quando o pagamento é confirmado, o webhook automaticamente:

### 1. ✅ Salva a Compra
```sql
INSERT INTO purchases (
  member_id,
  product_id,
  amount_paid,
  payment_status,
  stripe_session_id,
  stripe_payment_intent_id
)
```

### 2. ✅ Libera Acesso ao Produto
```sql
INSERT INTO digital_deliveries (
  purchase_id,
  member_id,
  product_id,
  access_token,
  expires_at
)
```

### 3. ✅ Cria Notificação
```sql
INSERT INTO notifications (
  member_id,
  type,
  message
)
```

### 4. ✅ Envia Email
```sql
INSERT INTO email_queue (
  to_email,
  template,
  data
)
```

### 5. ✅ Atualiza Analytics
```sql
UPDATE sales_analytics
SET total_sales = total_sales + amount,
    total_orders = total_orders + 1
```

---

## 🔍 Verificar se Funcionou

### No Supabase (SQL Editor):

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

-- Ver notificações criadas
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT 5;

-- Ver emails na fila
SELECT * FROM email_queue
ORDER BY created_at DESC
LIMIT 5;

-- Ver logs de webhook
SELECT * FROM stripe_webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Problema: "Connection refused"
**Solução:** Certifique-se que o backend está rodando na porta 3001:
```bash
cd backend
npm run dev
```

### Problema: "Invalid signature"
**Solução:** O webhook secret está errado. Pegue o novo secret do `stripe listen` e atualize `.env.backend`

### Problema: "Webhook não recebe eventos"
**Solução:** 
1. Verifique se o Stripe CLI está rodando
2. Verifique se a porta está correta (3001)
3. Tente reiniciar o `stripe listen`

### Problema: "Compra não aparece no banco"
**Solução:**
1. Verifique os logs do webhook no Supabase:
   ```sql
   SELECT * FROM stripe_webhook_logs ORDER BY created_at DESC LIMIT 5;
   ```
2. Verifique se há erros no `error_message`
3. Verifique os logs do backend (Terminal 9)

---

## 📝 Comandos Úteis

```bash
# Ver eventos recentes
stripe events list

# Ver detalhes de um evento específico
stripe events retrieve evt_xxxxx

# Simular eventos
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded

# Ver webhooks configurados
stripe webhook-endpoints list

# Ver logs em tempo real
stripe listen --forward-to localhost:3001/api/stripe/webhook --print-json
```

---

## 🎯 Checklist de Configuração

- [ ] Stripe CLI instalado (`stripe --version`)
- [ ] Login feito (`stripe login`)
- [ ] Webhook secret obtido (`stripe listen`)
- [ ] Webhook secret configurado em `.env.backend`
- [ ] Backend rodando (porta 3001)
- [ ] Stripe CLI rodando (`stripe listen`)
- [ ] Teste realizado (pagamento ou `stripe trigger`)
- [ ] Compra aparece no banco de dados
- [ ] Notificação criada
- [ ] Email na fila

---

## 🚀 Próximos Passos

Após configurar o webhook local:

1. ✅ Teste o fluxo completo de compra
2. ✅ Verifique se o email é enviado (backend/email-service.js)
3. ✅ Verifique se o download aparece na área de membros
4. ✅ Configure webhook em produção (quando fizer deploy)

---

## 📚 Documentação Oficial

- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Events](https://stripe.com/docs/api/events/types)

---

**Pronto para configurar!** 🎉

Execute os comandos acima e teste o fluxo completo de pagamento.
