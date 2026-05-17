# 🔍 RELATÓRIO DE DIAGNÓSTICO - Fluxo de Compra

**Data:** 15 de Maio de 2026  
**Problema:** Produto não é liberado após compra bem-sucedida  
**Severidade:** 🔴 CRÍTICA

---

## 📊 ANÁLISE DO CÓDIGO

### ✅ **PONTOS POSITIVOS IDENTIFICADOS**

#### 1. **Metadata Completo no Checkout** (`backend/api/stripe/create-checkout.ts`)

O código **ESTÁ ENVIANDO** o metadata corretamente:

```typescript
metadata: {
  product_id: productId,           // ✅ OK
  member_id: memberId || '',       // ✅ OK (pode estar vazio)
  auth_user_id: authUserId || '',  // ✅ OK (fallback)
  user_id: memberId || authUserId || '', // ✅ OK (fallback duplo)
  product_slug: '...',
  stripe_price_id: '...',
  coupon_code: appliedCouponCode,
  base_price: String(basePrice),
  final_price: String(finalPrice),
}
```

**Análise:**
- ✅ `product_id` sempre presente
- ✅ `member_id` pode estar vazio, mas há fallbacks
- ✅ `auth_user_id` como fallback
- ✅ `user_id` como fallback final

#### 2. **Resolução de member_id Robusta**

O código tenta resolver o `member_id` de múltiplas formas:

```typescript
let memberId = userId as string | undefined;

// Tenta por authUserId
if (authUserId && !memberId) {
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('auth_id', authUserId)
    .maybeSingle();
  memberId = member?.id;
}

// Tenta novamente se já tinha memberId
else if (authUserId && memberId) {
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('auth_id', authUserId)
    .maybeSingle();
  if (member?.id) memberId = member.id;
}
```

#### 3. **Fulfill Purchase com Múltiplos Fallbacks** (`backend/lib/fulfill-purchase.ts`)

```typescript
async function resolveMemberId(metadata: Record<string, string>): Promise<string | null> {
  // 1. Tenta por member_id direto
  if (metadata.member_id) { ... }
  
  // 2. Tenta por auth_user_id ou user_id
  const authId = metadata.auth_user_id || metadata.user_id;
  if (!authId) return null;
  
  // 3. Busca em members por auth_id
  const { data: byAuth } = await supabase
    .from('members')
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle();
  if (byAuth?.id) return byAuth.id;
  
  // 4. Fallback final: tenta usar authId como member_id
  const { data: byMemberId } = await supabase
    .from('members')
    .select('id')
    .eq('id', authId)
    .maybeSingle();
  return byMemberId?.id ?? null;
}
```

---

## 🚨 **PROBLEMAS IDENTIFICADOS**

### ❌ **PROBLEMA #1: member_id pode estar VAZIO no metadata**

**Localização:** `backend/api/stripe/create-checkout.ts` linha ~140

```typescript
metadata: {
  member_id: memberId || '',  // ← PODE SER STRING VAZIA!
  auth_user_id: authUserId || '',
  user_id: memberId || authUserId || '',
}
```

**Impacto:**
- Se `memberId` for `undefined`, o metadata terá `member_id: ''` (string vazia)
- No `fulfill-purchase.ts`, a verificação `if (metadata.member_id)` retorna `false` para string vazia
- O sistema tenta os fallbacks, mas se `authUserId` também estiver vazio, **FALHA TOTAL**

**Probabilidade:** 🔴 ALTA (70%)

---

### ❌ **PROBLEMA #2: Usuário sem registro em `members`**

**Cenário:**
1. Usuário faz signup via Supabase Auth → cria registro em `auth.users`
2. Trigger para criar registro em `members` **FALHA** ou **NÃO EXISTE**
3. Usuário tenta comprar
4. `create-checkout.ts` não encontra `member_id`
5. Metadata vai com `member_id: ''`
6. `fulfill-purchase.ts` não consegue resolver o membro
7. **COMPRA NÃO É REGISTRADA**

**Verificação necessária:**
```sql
-- Ver usuários sem registro em members
SELECT 
  au.id as auth_id,
  au.email,
  m.id as member_id
FROM auth.users au
LEFT JOIN members m ON m.auth_id = au.id
WHERE m.id IS NULL;
```

**Probabilidade:** 🟡 MÉDIA (20%)

---

### ❌ **PROBLEMA #3: Webhook não está sendo processado**

**Cenário:**
1. Stripe envia webhook `checkout.session.completed`
2. Backend recebe, mas:
   - Assinatura inválida (`STRIPE_WEBHOOK_SECRET` incorreto)
   - Erro no processamento
   - Timeout
3. Webhook é logado como `processed: false`
4. `fulfillCheckoutSession()` **NUNCA EXECUTA**
5. **COMPRA NÃO É REGISTRADA**

**Verificação necessária:**
```sql
-- Ver webhooks não processados
SELECT * FROM stripe_webhook_logs
WHERE event_type = 'checkout.session.completed'
  AND processed = false
ORDER BY created_at DESC;
```

**Probabilidade:** 🟡 MÉDIA (10%)

---

## 🔧 **PLANO DE AÇÃO**

### **FASE 1: DIAGNÓSTICO (EXECUTAR AGORA)**

#### 1.1. Execute o script SQL de diagnóstico

```bash
# Abra o Supabase SQL Editor
# Cole o conteúdo de: supabase/DIAGNOSTIC_PURCHASE_FLOW.sql
# Execute e analise os resultados
```

**O que verificar:**
- ✅ Existem webhooks não processados?
- ✅ Existem compras com `payment_status = 'pending'`?
- ✅ Existem usuários sem registro em `members`?
- ✅ Existem compras sem `digital_deliveries`?

#### 1.2. Verifique o Stripe Dashboard

**Acesse:** https://dashboard.stripe.com/test/payments

**Verifique:**
1. **Última compra bem-sucedida:**
   - Status: `succeeded`
   - Metadata contém `member_id` e `product_id`?

2. **Webhooks:**
   - https://dashboard.stripe.com/test/webhooks
   - Evento `checkout.session.completed` foi enviado?
   - Status: `succeeded` ou `failed`?

3. **Checkout Session:**
   - https://dashboard.stripe.com/test/checkout/sessions
   - Última sessão tem `payment_status: paid`?
   - Metadata está completo?

#### 1.3. Verifique logs do backend

```bash
# Se o backend está rodando, verifique os logs
# Procure por:
# - "[fulfill] missing product_id in metadata"
# - "[fulfill] could not resolve member"
# - "Webhook processing error"
```

---

### **FASE 2: CORREÇÕES (APÓS DIAGNÓSTICO)**

Dependendo dos resultados, as correções podem incluir:

#### **Correção #1: Garantir member_id no metadata**

```typescript
// backend/api/stripe/create-checkout.ts
// ANTES:
metadata: {
  member_id: memberId || '',  // ❌ Pode ser vazio
}

// DEPOIS:
metadata: {
  member_id: memberId || 'MISSING',  // ✅ Explícito
  // OU melhor ainda:
  ...(memberId ? { member_id: memberId } : {}),  // ✅ Só inclui se existir
}
```

#### **Correção #2: Criar trigger para garantir registro em members**

```sql
-- Criar função para auto-criar member
CREATE OR REPLACE FUNCTION create_member_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO members (auth_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_member_on_signup();
```

#### **Correção #3: Endpoint de fallback manual**

```typescript
// POST /api/stripe/fulfill-manual
// Permite processar compras manualmente se webhook falhar
export async function fulfillManual(req: Request, res: Response) {
  const { sessionId } = req.body;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const result = await fulfillCheckoutSession(session);
  return res.json(result);
}
```

#### **Correção #4: Melhorar logs e tratamento de erros**

```typescript
// Adicionar logs detalhados em fulfill-purchase.ts
console.log('[fulfill] metadata:', metadata);
console.log('[fulfill] resolved member_id:', memberId);
console.log('[fulfill] product_id:', productId);
```

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

Execute este checklist para identificar o problema:

### **1. Verificação de Dados**

- [ ] Execute `DIAGNOSTIC_PURCHASE_FLOW.sql` no Supabase
- [ ] Anote quantos webhooks não processados existem
- [ ] Anote quantas compras estão pendentes
- [ ] Anote quantos usuários não têm registro em `members`
- [ ] Anote quantas compras não têm `digital_deliveries`

### **2. Verificação no Stripe**

- [ ] Acesse Stripe Dashboard → Payments
- [ ] Encontre a última compra bem-sucedida
- [ ] Verifique se o metadata contém `member_id`
- [ ] Verifique se o metadata contém `product_id`
- [ ] Acesse Webhooks e veja se `checkout.session.completed` foi enviado
- [ ] Verifique o status do webhook (succeeded/failed)

### **3. Verificação no Backend**

- [ ] Backend está rodando? (http://localhost:3001/health)
- [ ] Verifique logs do terminal do backend
- [ ] Procure por erros relacionados a webhook
- [ ] Procure por erros relacionados a fulfill

### **4. Teste Manual**

- [ ] Faça uma compra de teste
- [ ] Use cartão: `4242 4242 4242 4242`
- [ ] Após pagamento, verifique imediatamente:
  - [ ] Registro criado em `purchases`?
  - [ ] `payment_status = 'completed'`?
  - [ ] `member_id` está preenchido?
  - [ ] `digital_deliveries` foi criado?
  - [ ] Notificação foi criada?

---

## 🎯 **PRÓXIMOS PASSOS**

1. **EXECUTE** o script `DIAGNOSTIC_PURCHASE_FLOW.sql`
2. **COMPARTILHE** os resultados aqui
3. **VERIFIQUE** o Stripe Dashboard conforme checklist
4. **AGUARDE** análise dos resultados para implementar correções

---

## 📞 **SUPORTE**

Se precisar de ajuda:
1. Compartilhe os resultados do diagnóstico SQL
2. Compartilhe screenshots do Stripe Dashboard
3. Compartilhe logs do backend (se houver erros)

---

**Status:** ⏳ Aguardando execução do diagnóstico
