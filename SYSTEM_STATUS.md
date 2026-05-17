# SYSTEM STATUS — CodeEngine Learn Platform
## Última atualização: 2026-05-17T15:55:00+01:00
## Branch ativa: `fix/critical-system-stabilization`

---

## REPOSITÓRIOS GITHUB

| Repo | URL | Branch Ativa |
|------|-----|-------------|
| Frontend | https://github.com/fernandoquipiaca007-commits/codeengine-learn | fix/critical-system-stabilization |
| Admin | https://github.com/fernandoquipiaca007-commits/codeengine-admin | main |
| Backend/API | https://github.com/fernandoquipiaca007-commits/codeengine-api | fix/critical-system-stabilization |

---

## ARQUITETURA

```
codeengine1.2/           ← git repo: codeengine-learn (frontend)
├── src/                 ← React + Vite (frontend store)
├── admin/               ← git repo: codeengine-admin (admin panel separado)
├── backend/             ← git repo: codeengine-api (Express API)
│   ├── api/             ← REST endpoints
│   ├── lib/             ← Business logic services
│   └── supabase/        ← SQL migrations
└── supabase/            ← SQL schemas (referência, NÃO executar daqui)
```

**IMPORTANTE:** Os arquivos SQL estão em `backend/supabase/` (repositório codeengine-api). A pasta `supabase/` na raiz é apenas referência.

---

## SQL QUE PRECISA SER EXECUTADO

### ⚠️ MASTER_FIX.sql — OBRIGATÓRIO
**Caminho:** `backend/supabase/MASTER_FIX.sql`
**Status:** CORRIGIDO (syntax error `CREATE POLICY IF NOT EXISTS` → `DROP + CREATE`)
**Executar no:** Supabase SQL Editor

**O que faz:**
1. Backfill: cria `member_points` para todos os membros existentes (pontos=0, level=starter)
2. Trigger `trg_auto_member_points`: auto-cria pontos quando novo membro é inserido
3. Trigger `trg_auto_referral_link`: auto-cria link global de referral para novos membros
4. Backfill: cria links globais para membros que não possuem
5. RLS policies: permite service_role acesso total às tabelas de referral

### SQL JÁ EXECUTADOS (NÃO re-executar)
- `supabase/referral-system-schema.sql` — Schema base das tabelas de referral
- `supabase/fix-notifications-metadata.sql` — Fix da tabela notifications
- `supabase/fix-email-queue.sql` — Fix da fila de emails
- `supabase/fix-triggers-and-email-templates.sql` — Templates de email

---

## CORREÇÕES APLICADAS NESTA SESSÃO

### 1. Bloqueio de Compra Duplicada (BACKEND)
**Arquivo:** `backend/api/stripe/create-checkout.ts`
**Commit:** `fix: block duplicate purchases at checkout level`
**O que mudou:** Adicionado check de `purchases` antes de criar sessão Stripe. Retorna 409 se produto já comprado.
**NÃO MEXER:** A lógica de `safeInsertPurchase` e o workaround do trigger `sales_analytics`.

### 2. Bloqueio de Compra Duplicada (FRONTEND)
**Arquivo:** `src/components/ProductActionButton.tsx`
**Commit:** `fix: block duplicate purchases, clear session URL, remove alerts`
**O que mudou:**
- Guards `if (loading) return` e `if (ownsProduct) return` nos handlers
- Handle de resposta 409 do backend → refresh ownership state
- Removidos todos os `alert()` → substituídos por erros inline
**NÃO MEXER:** O contexto `useProductPurchaseOptional()` e as variáveis `ownsProduct`/`purchaseLoading`.

### 3. Segurança — URL Limpa (SUCCESS PAGE)
**Arquivo:** `src/pages/Success.tsx`
**O que mudou:** `window.history.replaceState({}, '', window.location.pathname)` após ler `session_id`
**NÃO MEXER:** O countdown e redirect automático para `member`.

### 4. SQL Syntax Fix
**Arquivo:** `backend/supabase/MASTER_FIX.sql`
**O que mudou:** `CREATE POLICY IF NOT EXISTS` → `DROP POLICY IF EXISTS` + `CREATE POLICY`
**Razão:** PostgreSQL não suporta `IF NOT EXISTS` em `CREATE POLICY`.

### 5. Referral Points Award Fix
**Arquivo:** `backend/lib/referral-service.ts`
**O que mudou:** Substituído `supabase.rpc('award_points')` por `awardPoints()` de `points-service.ts`
**Razão:** A RPC pode não existir no banco. A função direta é confiável.
**NÃO MEXER:** A lógica de `processReferralConversion` — fraud check, duplicate check, conversion insert.

### 6. LEVEL_ORDER Export
**Arquivo:** `src/hooks/usePoints.ts`
**O que mudou:** Adicionado `export const LEVEL_ORDER = ['starter', 'bronze', 'silver', 'gold', 'platinum'] as const;`
**Razão:** `LevelCard.tsx` importa mas o export não existia → erro de compilação.

### 7. NotificationPanel Graceful Empty
**Arquivo:** `src/components/member/NotificationPanel.tsx`
**O que mudou:** `throw new Error('Member ID não fornecido')` → `setNotifications([]); setLoading(false); return;`

---

## CORREÇÕES DE SESSÕES ANTERIORES (JÁ NO MAIN)

### Auth Guards
- `src/pages/Settings.tsx` — `getSession()` first, não redireciona em erro
- `src/pages/Member.tsx` — retry logic, não redireciona falsamente

### Referral Pipeline
- `src/hooks/useReferral.ts` — `VITE_API_URL` → `VITE_BACKEND_URL`
- `src/components/referral/ReferralShareCard.tsx` — auth check, loading, error state
- `backend/lib/referral-service.ts` — fix query `.is('product_id', null)` para links globais

### Post-Login Redirect
- `src/App.tsx` — parse referral URL, salva em localStorage, event-based navigation
- `src/pages/Auth.tsx` — detecta `pendingProductId` em sessionStorage

### Gamification Dashboard
- `src/components/member/MemberDashboard.tsx` — integrou LevelCard, ReferralShareCard, RewardsList

---

## ARQUIVOS CRÍTICOS — NÃO DELETAR

| Arquivo | Razão |
|---------|-------|
| `backend/lib/fulfill-purchase.ts` | Coração da entrega de produto. Idempotente. |
| `backend/lib/referral-service.ts` | Lógica completa de referral e conversão |
| `backend/lib/points-service.ts` | Award, upsert, level calculation |
| `backend/lib/notification-service.ts` | Envio de notificações + emails |
| `backend/api/stripe/create-checkout.ts` | Criação de sessão Stripe + duplicate check |
| `backend/api/products/claim-free.ts` | Produto gratuito + duplicate check |
| `src/hooks/usePoints.ts` | Hook de pontos/ranking + LEVEL_ORDER |
| `src/hooks/usePurchaseStatus.ts` | Verifica ownership do produto |
| `src/contexts/ProductPurchaseContext.tsx` | Context provider de ownership |

---

## BUGS CONHECIDOS (PENDENTES)

### 1. Trigger `sales_analytics` com coluna inexistente
**Problema:** A tabela `sales_analytics` tem trigger que referencia coluna `total_revenue` inexistente
**Impacto:** INSERT com `payment_status='completed'` falha
**Workaround atual:** `safeInsertPurchase()` insere com `pending` e depois tenta update
**Fix definitivo:** Executar SQL para dropar ou corrigir o trigger:
```sql
DROP TRIGGER IF EXISTS trigger_update_sales_analytics ON purchases;
```

### 2. RPC `increment_referral_progress` pode não existir
**Onde:** `backend/lib/referral-service.ts` linha ~205
**Impacto:** Desconto progressivo não é atualizado (silencioso)
**Fix:** Criar a função ou substituir por lógica direta

### 3. Emojis no sistema (UX pendente)
**Onde:** `src/hooks/usePoints.ts` (LEVEL_ICONS), `src/components/referral/LevelCard.tsx`
**Status:** Pendente — substituir emojis por ícones Lucide

### 4. Página explicativa do sistema de partilha
**Status:** NÃO IMPLEMENTADA
**Requisito:** Criar página separada explicando referral, pontos, ranking, níveis, descontos

### 5. Prêmios em página separada
**Status:** NÃO IMPLEMENTADO
**Requisito:** Mover RewardsList da dashboard para uma página dedicada

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### Frontend (.env.local)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=http://localhost:3001
VITE_APP_URL=http://localhost:3000
```

### Backend (backend/.env.backend)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

---

## COMO RODAR

```bash
# Frontend (porta 3000)
cd codeengine1.2
npm run dev

# Backend (porta 3001)
cd codeengine1.2/backend
npm run dev
```

---

## FLUXO DE COMPRA (SEQUÊNCIA COMPLETA)

```
1. User clica "Comprar Agora"
   → ProductActionButton.handlePaidCheckout()
   → POST /api/stripe/create-checkout (com duplicate check)
   → Stripe Checkout Session criada
   → Redirect para Stripe

2. User paga no Stripe
   → Webhook POST /api/stripe/webhook
   → fulfillCheckoutSession(session)
     → Verifica idempotência (stripe_session_id)
     → resolveMemberId(metadata)
     → safeInsertPurchase() (purchases table)
     → digital_deliveries insert
     → notifyPurchaseReceipt()
     → updateSalesAnalytics()
     → awardPoints() (10pts por compra)
     → processReferralConversion() (se tem referral code)

3. User volta para Success page
   → session_id lido da URL → URL limpa imediatamente
   → fetchSessionData() → mostra resumo
   → Auto-redirect para member panel em 10s

4. Member panel
   → usePurchaseStatus verifica ownership (realtime)
   → Produto aparece na biblioteca
   → Botão muda para "Baixar" / "Começar curso"
```

---

## GIT WORKFLOW

```bash
# Ver status
git status

# Commitar mudança
git add -A
git commit -m "fix: descrição curta"

# Push para branch
git push origin fix/critical-system-stabilization

# Quando tudo estiver estável, merge para main:
git checkout main
git merge fix/critical-system-stabilization
git push origin main
```

**NOTA:** O backend tem seu PRÓPRIO repositório git em `backend/`.
Rodar os comandos git dentro de `backend/` para commitar/push no codeengine-api.
