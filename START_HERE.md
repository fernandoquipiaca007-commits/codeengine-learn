# 🚀 COMECE AQUI - Diagnóstico de Compras

**Problema:** Produtos não são liberados após compra bem-sucedida  
**Tempo necessário:** 20 minutos  
**Dificuldade:** ⭐⭐ (Fácil)

---

## 🎯 O QUE VAMOS FAZER

Vamos executar 3 verificações para descobrir por que as compras não estão liberando os produtos:

```
┌─────────────────────────────────────────────────────────┐
│  1. VERIFICAÇÃO SQL (Supabase)                          │
│     → Verifica dados no banco de dados                  │
│     → Identifica compras pendentes                      │
│     → Detecta usuários sem registro                     │
│     ⏱️  5 minutos                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. VERIFICAÇÃO STRIPE (Node.js)                        │
│     → Conecta com API do Stripe                         │
│     → Lista sessões de checkout                         │
│     → Compara com dados do Supabase                     │
│     ⏱️  5 minutos                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. VERIFICAÇÃO MANUAL (Stripe Dashboard)               │
│     → Acessa painel do Stripe                           │
│     → Verifica webhooks                                 │
│     → Analisa metadata das compras                      │
│     ⏱️  5 minutos                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. ANÁLISE DOS RESULTADOS                              │
│     → Identifica o problema exato                       │
│     → Propõe solução específica                         │
│     ⏱️  5 minutos                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 PASSO 1: VERIFICAÇÃO SQL (5 minutos)

### 1.1. Abra o Supabase

```
🌐 https://app.supabase.com
   ↓
📁 Selecione seu projeto
   ↓
📝 SQL Editor (menu lateral)
   ↓
➕ New Query
```

### 1.2. Execute o script

**OPÇÃO A: Script Completo (Recomendado)**
```
📂 Abra: supabase/DIAGNOSTIC_PURCHASE_FLOW.sql
   ↓
📋 Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
   ↓
📝 Cole no SQL Editor (Ctrl+V)
   ↓
▶️  Clique em RUN (ou Ctrl+Enter)
   ↓
⏳ Aguarde 10-30 segundos
   ↓
📊 Resultados aparecem abaixo
```

**OPÇÃO B: Script Simplificado (Se houver erro)**
```
📂 Abra: supabase/DIAGNOSTIC_SIMPLE.sql
   ↓
📋 Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
   ↓
📝 Cole no SQL Editor (Ctrl+V)
   ↓
▶️  Clique em RUN (ou Ctrl+Enter)
```

**💡 Use a OPÇÃO B se a OPÇÃO A der erro de coluna não existente**

### 1.3. Copie o RESUMO EXECUTIVO

Role até o final e encontre:

```sql
=== RESUMO EXECUTIVO ===
┌─────────────────────────────────────┬────────┐
│ Total de Compras                    │   15   │
│ Compras Completadas                 │   12   │
│ Compras Pendentes                   │    3   │ ← ANOTE ESTE
│ Compras sem member_id               │    2   │ ← ANOTE ESTE
│ Usuários sem registro em members    │    5   │ ← ANOTE ESTE
│ Compras sem digital_delivery        │    1   │ ← ANOTE ESTE
│ Webhooks não processados            │    8   │ ← ANOTE ESTE
│ Produtos sem stripe_price_id        │    0   │
└─────────────────────────────────────┴────────┘
```

**📋 COPIE ESTES NÚMEROS!**

---

## 🚀 PASSO 2: VERIFICAÇÃO STRIPE (5 minutos)

### 2.1. Abra o terminal

```
Windows: Win+R → cmd → Enter
Mac/Linux: Terminal
```

### 2.2. Execute o script

```bash
# Navegue até a pasta backend
cd c:\Users\Dell\Documents\codeengine1.2\backend

# Execute o diagnóstico
node diagnostic-stripe.js
```

### 2.3. Aguarde a saída

Você verá algo como:

```
╔════════════════════════════════════════╗
║   DIAGNÓSTICO STRIPE                   ║
╚════════════════════════════════════════╝

📋 1. VERIFICANDO CONFIGURAÇÃO STRIPE
✅ Conexão com Stripe: OK

📋 2. VERIFICANDO ÚLTIMAS SESSÕES DE CHECKOUT
Total de sessões encontradas: 10

✅ Sessão: cs_test_abc123...
   Status: paid
   Metadata:
      product_id: ✅ abc-123
      member_id: ❌ AUSENTE    ← PROBLEMA!
   ❌ COMPRA NÃO REGISTRADA NO SUPABASE!

...

╔════════════════════════════════════════╗
║   RESUMO DO DIAGNÓSTICO                ║
╚════════════════════════════════════════╝

📊 Sessões pagas no Stripe: 15
📊 Compras no Supabase: 12
📊 Compras completadas: 10

⚠️  PROBLEMA DETECTADO:
   Existem 5 compras pagas no Stripe
   que NÃO foram registradas no Supabase!
```

**📋 COPIE TODA A SAÍDA!**

---

## 🚀 PASSO 3: VERIFICAÇÃO MANUAL (5 minutos)

### 3.1. Acesse o Stripe Dashboard

```
🌐 https://dashboard.stripe.com/test/payments
   ↓
🔍 Encontre a última transação "Succeeded"
   ↓
👆 Clique nela
   ↓
📜 Role até "Metadata"
```

### 3.2. Verifique o Metadata

Deve conter:

```
Metadata:
  product_id: abc-123-def-456        ← Deve existir
  member_id: xyz-789-uvw-012         ← Deve existir
  auth_user_id: xyz-789-uvw-012      ← Deve existir
  user_id: xyz-789-uvw-012           ← Deve existir
```

**❌ Se algum estiver ausente ou vazio, ANOTE!**

### 3.3. Verifique os Webhooks

```
🌐 https://dashboard.stripe.com/test/webhooks
   ↓
🔍 Veja se há endpoints configurados
   ↓
📊 Se SIM: Anote a URL e status
   ↓
📊 Se NÃO: ANOTE "Nenhum webhook configurado"
```

### 3.4. Verifique o último evento

```
🌐 https://dashboard.stripe.com/test/events
   ↓
🔍 Procure por "checkout.session.completed"
   ↓
👆 Clique no mais recente
   ↓
📊 Veja o status: Succeeded ou Failed?
   ↓
❌ Se Failed, copie a mensagem de erro
```

---

## 📊 PASSO 4: COMPILE OS RESULTADOS

Preencha este formulário:

```
╔════════════════════════════════════════════════════════════╗
║                  RESULTADOS DO DIAGNÓSTICO                 ║
╚════════════════════════════════════════════════════════════╝

📋 PASSO 1 - SQL (Supabase)
─────────────────────────────────────────────────────────────
Compras Pendentes:                   [ ___ ]
Compras sem member_id:               [ ___ ] ← Se > 0, PROBLEMA!
Usuários sem registro em members:    [ ___ ] ← Se > 0, PROBLEMA!
Webhooks não processados:            [ ___ ] ← Se > 0, PROBLEMA!

📋 PASSO 2 - Node.js (Stripe API)
─────────────────────────────────────────────────────────────
Sessões pagas no Stripe:             [ ___ ]
Compras no Supabase:                 [ ___ ]
Diferença:                           [ ___ ] ← Se > 0, PROBLEMA!

📋 PASSO 3 - Manual (Stripe Dashboard)
─────────────────────────────────────────────────────────────
Última compra tem metadata completo? [ SIM / NÃO ]
Webhooks configurados?               [ SIM / NÃO ]
Último evento succeeded?             [ SIM / NÃO ]

╔════════════════════════════════════════════════════════════╗
║                    QUAL É O PROBLEMA?                      ║
╚════════════════════════════════════════════════════════════╝

Marque o que se aplica:

[ ] Webhooks não processados > 0
    → Webhooks não estão funcionando

[ ] Sessões pagas > Compras no Supabase
    → Compras não estão sendo registradas

[ ] Compras sem member_id > 0
    → Metadata incompleto

[ ] Usuários sem registro em members > 0
    → Falta trigger de criação

[ ] Nenhum webhook configurado no Stripe
    → Webhooks nunca foram configurados

[ ] Último evento webhook Failed
    → Webhook está falhando
```

---

## 🎯 PRÓXIMOS PASSOS

Após preencher o formulário acima:

### ✅ Compartilhe os resultados

Envie:
1. Formulário preenchido
2. Saída completa do SQL
3. Saída completa do Node.js
4. Screenshots do Stripe (opcional)

### ✅ Aguarde análise

Com base nos resultados, vou:
1. Identificar o problema exato
2. Criar scripts de correção
3. Fornecer instruções de implementação

---

## 🆘 PROBLEMAS?

### ❌ Erro ao executar SQL

```
ERROR: relation "stripe_webhook_logs" does not exist
```

**Solução:** Execute primeiro:
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

### ❌ Erro ao executar Node.js

```
Cannot find module 'stripe'
```

**Solução:**
```bash
cd backend
npm install
```

### ❌ Erro de conexão Stripe

```
Invalid API Key provided
```

**Solução:** Verifique `STRIPE_SECRET_KEY` em `backend/.env.backend`

---

## 📚 DOCUMENTAÇÃO ADICIONAL

Se quiser mais detalhes:

- **EXECUTE_DIAGNOSTIC.md** - Guia detalhado passo a passo
- **DIAGNOSTIC_REPORT.md** - Análise técnica completa
- **DIAGNOSTIC_SUMMARY.md** - Resumo executivo

---

## ⏱️ TEMPO TOTAL

- Passo 1 (SQL): 5 minutos
- Passo 2 (Node.js): 5 minutos
- Passo 3 (Manual): 5 minutos
- Passo 4 (Compilar): 5 minutos
- **TOTAL: 20 minutos**

---

**🚀 PRONTO? COMECE PELO PASSO 1!**

Abra o Supabase SQL Editor e execute `DIAGNOSTIC_PURCHASE_FLOW.sql`
