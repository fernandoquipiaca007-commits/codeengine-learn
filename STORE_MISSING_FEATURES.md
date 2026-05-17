# 🎯 Store Frontend - Features Faltantes

**Data**: 12 de Maio de 2026

## ✅ O Que Já Está Implementado

### Páginas Existentes
- ✅ **Home** - Hero section + Featured products (mockup)
- ✅ **Library** - Lista de produtos conectada ao Supabase
- ✅ **Product** - Detalhes do produto conectado ao Supabase
- ✅ **Auth** - Login/Signup/Password Reset

### Funcionalidades Implementadas
- ✅ Navegação entre páginas (Home, Library, Product, Auth)
- ✅ Background 3D animado
- ✅ NavBar com botão "Entrar"
- ✅ Footer
- ✅ Conexão com Supabase
- ✅ Realtime subscriptions (produtos)
- ✅ Filtro por categorias
- ✅ Design cinematográfico 100% preservado
- ✅ Animações e transições
- ✅ Glass panels e glow effects

### Problemas Conhecidos
- ⚠️ Auth signup precisa executar `supabase/complete-auth-fix.sql`
- ⚠️ Página "Member" não existe (referenciada em Auth.tsx)

---

## ❌ O Que Falta Implementar

### 1. 🔐 Área de Membros (CRÍTICO)
**Status**: Não implementada
**Prioridade**: ALTA

#### Página: `src/pages/Member.tsx`
Precisa criar a página completa de área de membros com:

**Componentes Necessários**:
- **MemberDashboard** - Dashboard principal
  - Informações do perfil
  - Estatísticas (produtos comprados, downloads)
  - Navegação para seções

- **PurchaseHistory** - Histórico de compras
  - Lista de produtos comprados
  - Data da compra
  - Valor pago
  - Status do pagamento
  - Filtros por data e categoria

- **DownloadList** - Lista de downloads
  - Produtos comprados com links de download
  - Botão "Baixar Produto"
  - Expiração do link (24h)
  - Botão "Solicitar Novo Link"

- **NotificationPanel** - Painel de notificações
  - Notificações não lidas
  - Marcar como lida
  - Tipos: compra, download, sistema

**Design Requirements**:
- ✅ Manter glass panels
- ✅ Usar cores: primary, secondary, tertiary
- ✅ Animações com motion/react
- ✅ Glow effects
- ✅ Typography: font-display, font-sans, font-mono

**Queries Supabase**:
```typescript
// Buscar compras do membro
const { data: purchases } = await supabase
  .from('purchases')
  .select(`
    *,
    products (*)
  `)
  .eq('member_id', memberId)
  .order('purchase_date', { ascending: false });

// Buscar downloads do membro
const { data: downloads } = await supabase
  .from('downloads')
  .select(`
    *,
    products (*)
  `)
  .eq('member_id', memberId)
  .order('download_timestamp', { ascending: false });

// Buscar notificações
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('member_id', memberId)
  .eq('read_status', false)
  .order('created_at', { ascending: false });
```

---

### 2. 💳 Integração com Stripe (CRÍTICO)
**Status**: Não implementada
**Prioridade**: ALTA

#### Arquivo: `src/lib/stripe.ts`
Precisa criar o cliente Stripe e funções de checkout:

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export async function createCheckoutSession(
  productId: string,
  productTitle: string,
  price: number,
  couponCode?: string
) {
  // Chamar backend para criar sessão de checkout
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      productTitle,
      price,
      couponCode,
    }),
  });

  const { sessionId } = await response.json();
  
  // Redirecionar para Stripe Checkout
  const stripe = await stripePromise;
  await stripe?.redirectToCheckout({ sessionId });
}
```

#### Componente: `src/components/CheckoutButton.tsx`
Botão de compra que inicia o checkout:

```typescript
<button
  onClick={() => createCheckoutSession(product.id, product.title, product.price)}
  className="bg-on-surface text-background font-display text-2xl font-bold px-8 py-5 rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-300 w-full md:w-auto text-center flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(192,193,255,0.3)] group"
>
  {product.cta_text}
  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
</button>
```

#### Componente: `src/components/CouponInput.tsx`
Input para aplicar cupom de desconto:

```typescript
const [couponCode, setCouponCode] = useState('');
const [discount, setDiscount] = useState(0);
const [error, setError] = useState('');

async function applyCoupon() {
  // Validar cupom no Supabase
  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', couponCode)
    .single();

  if (!coupon) {
    setError('Cupom inválido');
    return;
  }

  // Verificar expiração
  if (new Date(coupon.expiration_date) < new Date()) {
    setError('Cupom expirado');
    return;
  }

  // Verificar limite de uso
  if (coupon.usage_count >= coupon.usage_limit) {
    setError('Cupom esgotado');
    return;
  }

  // Calcular desconto
  if (coupon.discount_type === 'percentage') {
    setDiscount((price * coupon.discount_value) / 100);
  } else {
    setDiscount(coupon.discount_value);
  }
}
```

---

### 3. 🔍 Busca Avançada (MÉDIA)
**Status**: Não implementada
**Prioridade**: MÉDIA

#### Componente: `src/components/SearchBar.tsx`
Barra de busca com autocomplete:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<Product[]>([]);

async function handleSearch(query: string) {
  setSearchQuery(query);
  
  if (query.length < 2) {
    setSearchResults([]);
    return;
  }

  // Buscar produtos por título, descrição e tags
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(10);

  setSearchResults(data || []);
}
```

**Features**:
- Busca em tempo real (debounced)
- Autocomplete com sugestões
- Highlight de termos encontrados
- Filtros combinados (categoria + busca)
- Ordenação (relevância, preço, data)

---

### 4. 📱 Melhorias de UX (BAIXA)
**Status**: Parcialmente implementada
**Prioridade**: BAIXA

#### Features Faltantes:
- **Loading States** - Skeletons para carregamento
- **Empty States** - Mensagens quando não há produtos
- **Error Boundaries** - Captura de erros React
- **Toast Notifications** - Notificações de sucesso/erro
- **Infinite Scroll** - Carregar mais produtos ao rolar
- **Product Comparison** - Comparar produtos lado a lado
- **Wishlist** - Lista de desejos
- **Product Reviews** - Avaliações de produtos

---

### 5. 🔔 Notificações Realtime (MÉDIA)
**Status**: Não implementada
**Prioridade**: MÉDIA

#### Subscription para Notificações:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('notifications-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `member_id=eq.${memberId}`,
      },
      (payload) => {
        // Mostrar toast notification
        showToast(payload.new.message);
        // Atualizar contador de notificações
        setUnreadCount((prev) => prev + 1);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [memberId]);
```

---

### 6. 🎨 Componentes de UI Faltantes

#### `src/components/Toast.tsx`
Notificações temporárias:
```typescript
<motion.div
  initial={{ opacity: 0, y: -50 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -50 }}
  className="fixed top-4 right-4 z-50 glass-panel rounded-xl p-4 border border-white/10 shadow-lg"
>
  <p className="font-sans text-sm text-white">{message}</p>
</motion.div>
```

#### `src/components/Modal.tsx`
Modal genérico para confirmações:
```typescript
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-panel rounded-2xl p-8 max-w-md w-full border border-white/10"
      >
        {children}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

#### `src/components/Skeleton.tsx`
Loading placeholders:
```typescript
<div className="glass-panel rounded-2xl p-6 animate-pulse">
  <div className="h-48 bg-surface-high rounded-xl mb-4"></div>
  <div className="h-6 bg-surface-high rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-surface-high rounded w-full"></div>
</div>
```

---

## 📋 Priorização de Implementação

### 🔴 CRÍTICO (Implementar Agora)
1. **Corrigir Auth** - Executar `supabase/complete-auth-fix.sql`
2. **Área de Membros** - Criar `src/pages/Member.tsx`
3. **Integração Stripe** - Criar `src/lib/stripe.ts` + CheckoutButton

### 🟡 IMPORTANTE (Próxima Sprint)
4. **Busca Avançada** - SearchBar com autocomplete
5. **Notificações Realtime** - Subscription + Toast
6. **CouponInput** - Aplicar cupons no checkout

### 🟢 DESEJÁVEL (Futuro)
7. **Loading States** - Skeletons e spinners
8. **Empty States** - Mensagens amigáveis
9. **Error Boundaries** - Captura de erros
10. **Infinite Scroll** - Paginação infinita
11. **Wishlist** - Lista de desejos
12. **Product Reviews** - Sistema de avaliações

---

## 🎨 Regras de Design (OBRIGATÓRIO)

### ❌ NUNCA FAZER:
- Alterar cores (primary, secondary, tertiary, surface, on-surface)
- Remover glass panels ou glow effects
- Mudar typography (font-display, font-sans, font-mono)
- Quebrar animações existentes
- Alterar estrutura de layout
- Misturar estilos diferentes

### ✅ SEMPRE FAZER:
- Usar componentes existentes como base
- Manter motion animations
- Preservar glass-panel aesthetic
- Usar cores do design system
- Seguir padrões de spacing e sizing
- Manter atmosfera cinematográfica

---

## 📊 Progresso Atual

### Store Frontend
- **Implementado**: 60%
- **Faltando**: 40%

### Breakdown:
- ✅ Estrutura base: 100%
- ✅ Navegação: 100%
- ✅ Páginas estáticas: 100%
- ✅ Conexão Supabase: 100%
- ✅ Realtime (produtos): 100%
- ⚠️ Auth: 90% (falta corrigir trigger)
- ❌ Área de Membros: 0%
- ❌ Checkout Stripe: 0%
- ❌ Busca Avançada: 0%
- ❌ Notificações: 0%
- ❌ Cupons: 0%

---

## 🚀 Próximos Passos

### Passo 1: Corrigir Auth (5 min)
1. Executar `supabase/complete-auth-fix.sql`
2. Testar signup e login
3. Verificar que funciona

### Passo 2: Criar Área de Membros (2-3 horas)
1. Criar `src/pages/Member.tsx`
2. Implementar MemberDashboard
3. Implementar PurchaseHistory
4. Implementar DownloadList
5. Implementar NotificationPanel
6. Adicionar rota no App.tsx

### Passo 3: Integrar Stripe (1-2 horas)
1. Criar `src/lib/stripe.ts`
2. Criar CheckoutButton component
3. Criar CouponInput component
4. Testar checkout flow

### Passo 4: Implementar Busca (1 hora)
1. Criar SearchBar component
2. Adicionar ao NavBar
3. Implementar autocomplete
4. Testar busca

---

## 📁 Estrutura de Arquivos Faltantes

```
src/
├── pages/
│   └── Member.tsx                    ❌ CRIAR
├── components/
│   ├── checkout/
│   │   ├── CheckoutButton.tsx        ❌ CRIAR
│   │   └── CouponInput.tsx           ❌ CRIAR
│   ├── member/
│   │   ├── MemberDashboard.tsx       ❌ CRIAR
│   │   ├── PurchaseHistory.tsx       ❌ CRIAR
│   │   ├── DownloadList.tsx          ❌ CRIAR
│   │   └── NotificationPanel.tsx     ❌ CRIAR
│   ├── search/
│   │   └── SearchBar.tsx             ❌ CRIAR
│   └── ui/
│       ├── Toast.tsx                 ❌ CRIAR
│       ├── Modal.tsx                 ❌ CRIAR
│       └── Skeleton.tsx              ❌ CRIAR
└── lib/
    └── stripe.ts                     ❌ CRIAR
```

---

## ✨ Resumo

**O que está pronto**:
- ✅ Design 100% implementado e preservado
- ✅ Navegação funcionando
- ✅ Conexão com Supabase
- ✅ Realtime subscriptions
- ✅ Auth (precisa corrigir trigger)

**O que falta**:
- ❌ Área de Membros (CRÍTICO)
- ❌ Integração Stripe (CRÍTICO)
- ❌ Busca Avançada (IMPORTANTE)
- ❌ Notificações Realtime (IMPORTANTE)
- ❌ Componentes de UI (DESEJÁVEL)

**Próxima ação**: Corrigir auth e implementar Área de Membros! 🚀
