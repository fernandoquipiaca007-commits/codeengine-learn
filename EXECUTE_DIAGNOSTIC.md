# 🔍 GUIA DE EXECUÇÃO DO DIAGNÓSTICO

**Objetivo:** Identificar por que os produtos não estão sendo liberados após compra bem-sucedida.

---

## 📋 PRÉ-REQUISITOS

- [ ] Acesso ao Supabase SQL Editor
- [ ] Acesso ao Stripe Dashboard
- [ ] Backend configurado (`.env.backend` com chaves do Stripe)
- [ ] Node.js instalado

---

## 🚀 PASSO 1: DIAGNÓSTICO SQL (5 minutos)

### 1.1. Abra o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**

### 1.2. Execute o script de diagnóstico

1. Abra o arquivo: `supabase/DIAGNOSTIC_PURCHASE_FLOW.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 1.3. Analise os resultados

O script vai retornar várias seções. Anote os seguintes valores:

```
=== RESUMO EXECUTIVO ===
┌─────────────────────────────────────┬────────┐
│ Total de Compras                    │ ???    │
│ Compras Completadas                 │ ???    │
│ Compras Pendentes                   │ ???    │ ← IMPORTANTE
│ Compras sem member_id               │ ???    │ ← CRÍTICO
│ Usuários sem registro em members    │ ???    │ ← CRÍTICO
│ Compras sem digital_delivery        │ ???    │ ← IMPORTANTE
│ Webhooks não processados            │ ???    │ ← CRÍTICO
│ Produtos sem stripe_price_id        │ ???    │
└─────────────────────────────────────┴────────┘
```

**Anote especialmente:**
- ❌ Se "Compras sem member_id" > 0 → **PROBLEMA CRÍTICO**
- ❌ Se "Usuários sem registro em members" > 0 → **PROBLEMA CRÍTICO**
- ❌ Se "Webhooks não processados" > 0 → **PROBLEMA CRÍTICO**
- ❌ Se "Compras sem digital_delivery" > 0 → **PROBLEMA IMPORTANTE**

---

## 🚀 PASSO 2: DIAGNÓSTICO STRIPE (5 minutos)

### 2.1. Execute o script Node.js

```bash
# No terminal, na raiz do projeto:
cd backend
node diagnostic-stripe.js
```

### 2.2. Analise a saída

O script vai mostrar:

```
╔════════════════════════════════════════╗
║   DIAGNÓSTICO STRIPE                   ║
║   Verificação de Checkout e Webhooks   ║
╚════════════════════════════════════════╝

📋 1. VERIFICANDO CONFIGURAÇÃO STRIPE
✅ Conexão com Stripe: OK
   Moeda: brl
   Ambiente: TEST

📋 2. VERIFICANDO ÚLTIMAS SESSÕES DE CHECKOUT
Total de sessões encontradas: 10

✅ Sessão: cs_test_...
   Status: paid
   Valor: 97.00 BRL
   Email: usuario@example.com
   Metadata:
      product_id: ✅ abc-123
      member_id: ❌ AUSENTE  ← PROBLEMA!
      auth_user_id: ✅ xyz-789
      user_id: ✅ xyz-789
   ❌ COMPRA NÃO REGISTRADA NO SUPABASE!  ← PROBLEMA CRÍTICO!
```

**Anote especialmente:**
- ❌ Se alguma sessão `paid` tem metadata incompleto
- ❌ Se alguma sessão `paid` não tem compra no Supabase
- ❌ Se não há webhook endpoints configurados

---

## 🚀 PASSO 3: VERIFICAÇÃO MANUAL NO STRIPE (5 minutos)

### 3.1. Acesse o Stripe Dashboard

**URL:** https://dashboard.stripe.com/test/payments

### 3.2. Encontre a última compra bem-sucedida

1. Clique na última transação com status **Succeeded**
2. Role até a seção **Metadata**
3. Verifique se contém:
   - ✅ `product_id`
   - ✅ `member_id` (ou `auth_user_id` ou `user_id`)

### 3.3. Verifique os Webhooks

**URL:** https://dashboard.stripe.com/test/webhooks

**Verifique:**
- Existem endpoints configurados?
- Se sim, qual a URL?
- Status: `Enabled` ou `Disabled`?

**Clique no último evento `checkout.session.completed`:**
- Status: `Succeeded` ou `Failed`?
- Se `Failed`, qual o erro?

---

## 📊 PASSO 4: COMPILAR RESULTADOS

Preencha este formulário com os resultados:

```
╔════════════════════════════════════════════════════════════╗
║                  RESULTADOS DO DIAGNÓSTICO                 ║
╚════════════════════════════════════════════════════════════╝

📋 DIAGNÓSTICO SQL (Supabase)
─────────────────────────────────────────────────────────────
Total de Compras:                    [ ??? ]
Compras Completadas:                 [ ??? ]
Compras Pendentes:                   [ ??? ]
Compras sem member_id:               [ ??? ] ← CRÍTICO
Usuários sem registro em members:    [ ??? ] ← CRÍTICO
Compras sem digital_delivery:        [ ??? ]
Webhooks não processados:            [ ??? ] ← CRÍTICO

📋 DIAGNÓSTICO STRIPE (Node.js)
─────────────────────────────────────────────────────────────
Sessões pagas no Stripe:             [ ??? ]
Compras no Supabase:                 [ ??? ]
Diferença (problema):                [ ??? ] ← Se > 0, PROBLEMA!

Última sessão paga:
  - Session ID:                      [ ??? ]
  - Metadata product_id:             [ ✅ / ❌ ]
  - Metadata member_id:              [ ✅ / ❌ ]
  - Compra no Supabase:              [ ✅ / ❌ ]

📋 VERIFICAÇÃO MANUAL (Stripe Dashboard)
─────────────────────────────────────────────────────────────
Webhook endpoints configurados:      [ SIM / NÃO ]
Se SIM, URL:                         [ ??? ]
Status do webhook:                   [ Enabled / Disabled ]

Último evento checkout.session.completed:
  - Status:                          [ Succeeded / Failed ]
  - Se Failed, erro:                 [ ??? ]

╔════════════════════════════════════════════════════════════╗
║                    ANÁLISE PRELIMINAR                      ║
╚════════════════════════════════════════════════════════════╝

Com base nos resultados acima, o problema mais provável é:

[ ] PROBLEMA #1: Webhooks não configurados/não funcionando
    → Sessões pagas no Stripe > Compras no Supabase
    → Webhooks não processados > 0
    → Nenhum webhook endpoint no Stripe Dashboard

[ ] PROBLEMA #2: Metadata incompleto (member_id ausente)
    → Sessões têm product_id mas não member_id
    → Compras sem member_id > 0

[ ] PROBLEMA #3: Usuários sem registro em members
    → Usuários sem registro em members > 0
    → Compras falhando na resolução do member_id

[ ] PROBLEMA #4: Outro (descrever):
    → _______________________________________________
```

---

## 🎯 PASSO 5: COMPARTILHAR RESULTADOS

Após preencher o formulário acima, compartilhe os resultados para análise.

**Inclua:**
1. ✅ Resultados do SQL (copie a seção "RESUMO EXECUTIVO")
2. ✅ Saída completa do `diagnostic-stripe.js`
3. ✅ Screenshots do Stripe Dashboard (se possível)
4. ✅ Formulário preenchido acima

---

## 🔧 PRÓXIMOS PASSOS (APÓS DIAGNÓSTICO)

Dependendo dos resultados, as correções serão:

### Se PROBLEMA #1 (Webhooks):
- Configurar Stripe CLI
- Configurar webhook endpoint
- Testar webhook manualmente

### Se PROBLEMA #2 (Metadata):
- Corrigir `create-checkout.ts` para garantir member_id
- Reprocessar compras pendentes

### Se PROBLEMA #3 (Members):
- Criar trigger para auto-criar members
- Criar members para usuários existentes
- Reprocessar compras pendentes

---

## ⏱️ TEMPO ESTIMADO

- **Diagnóstico SQL:** 5 minutos
- **Diagnóstico Stripe:** 5 minutos
- **Verificação Manual:** 5 minutos
- **Compilar Resultados:** 5 minutos
- **TOTAL:** ~20 minutos

---

## 🆘 PROBLEMAS DURANTE O DIAGNÓSTICO?

### Erro ao executar SQL:
```
ERROR: relation "stripe_webhook_logs" does not exist
```
**Solução:** A tabela não existe. Execute primeiro:
```sql
CREATE TABLE stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Erro ao executar Node.js:
```
Error: Cannot find module 'stripe'
```
**Solução:**
```bash
cd backend
npm install
```

### Erro de conexão Stripe:
```
Invalid API Key provided
```
**Solução:** Verifique `STRIPE_SECRET_KEY` em `.env.backend`

---

**🚀 Pronto para começar? Execute o PASSO 1!**
