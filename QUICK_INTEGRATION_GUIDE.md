# 🚀 QUICK INTEGRATION GUIDE — Notifications + Favorites

## ⚡ IMPLEMENTAÇÃO RÁPIDA (5 Passos)

### 1️⃣ EXECUTAR SQL TRIGGERS
```bash
# No Supabase SQL Editor:
# Copiar e executar: supabase/notification-triggers.sql
```

### 2️⃣ ADICIONAR FAVORITOS NO PRODUCTCARD
```tsx
// src/components/ProductCard.tsx (ou similar)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteButton } from './FavoriteButton';

// Dentro do component:
const [user, setUser] = useState<any>(null);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
  });
}, []);

const { isFavorite, toggleFavorite } = useFavorites(user?.id);

// No JSX (top-right do card):
<div className="absolute top-4 right-4 z-10">
  {user && (
    <FavoriteButton
      isFavorite={isFavorite(product.id)}
      onToggle={() => toggleFavorite(product.id)}
      size="md"
    />
  )}
</div>
```

### 3️⃣ ATUALIZAR FAVORITESLIST
```tsx
// src/components/member/FavoritesList.tsx
import { useFavorites } from '../../hooks/useFavorites';

// Substituir a lógica de localStorage por:
export function FavoritesList({ memberId, onViewProduct }: FavoritesListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const { favorites, loading: favLoading, toggleFavorite } = useFavorites(user?.id);

  useEffect(() => {
    if (favorites.length > 0) {
      loadProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [favorites]);

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', favorites);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  // Usar toggleFavorite ao remover
}
```

### 4️⃣ ATUALIZAR MEMBER DASHBOARD
```tsx
// src/pages/Member.tsx
import { useFavorites } from '../hooks/useFavorites';

// Dentro do component:
const { favorites } = useFavorites(user?.id);
const favoriteCount = favorites.length;

// Remover lógica de localStorage
```

### 5️⃣ MELHORAR NOTIFICATION BADGE (Opcional)
```tsx
// src/components/NavBar.tsx
// Substituir o badge atual por:
{unreadCount > 0 && (
  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 
    bg-gradient-to-br from-red-500 to-red-600 
    rounded-full flex items-center justify-center 
    border-[1.5px] border-surface 
    shadow-[0_0_12px_rgba(239,68,68,0.6)]
    animate-pulse">
    <span className="font-display text-[9px] font-bold text-white leading-none">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  </span>
)}
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Após Implementação:
- [ ] SQL triggers executados
- [ ] FavoriteButton aparece nos cards
- [ ] Clicar no coração adiciona/remove favorito
- [ ] Favoritos persistem após reload
- [ ] Contador no dashboard atualiza
- [ ] Página de favoritos carrega produtos
- [ ] Notificações navegam corretamente
- [ ] Badge mostra contador correto

---

## 🧪 TESTE RÁPIDO

### Testar Favoritos:
```bash
1. Login como usuário
2. Ir para Library
3. Clicar no coração de um produto
4. Recarregar página
5. Verificar se coração continua preenchido
6. Ir para Dashboard → Ver contador
7. Ir para Favoritos → Ver produto listado
```

### Testar Notificações:
```bash
1. Login como admin
2. Criar novo produto
3. Login como usuário normal
4. Verificar badge com "1"
5. Clicar na notificação
6. Verificar navegação para produto
7. Verificar badge zerou
```

---

## 🐛 TROUBLESHOOTING

### Favoritos não salvam:
```bash
# Verificar se tabela existe:
SELECT * FROM favorites LIMIT 1;

# Verificar RLS:
SELECT * FROM pg_policies WHERE tablename = 'favorites';
```

### Notificações não aparecem:
```bash
# Verificar triggers:
SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';

# Testar manualmente:
SELECT create_promotion_notification('Teste', 'Mensagem teste', '/library', NULL);
```

### Badge não atualiza:
```bash
# Verificar realtime:
# No NavBar.tsx, adicionar console.log no useEffect de loadUnreadCount
```

---

## 📚 REFERÊNCIAS

- **Hook:** `src/hooks/useFavorites.ts`
- **Button:** `src/components/FavoriteButton.tsx`
- **Triggers:** `supabase/notification-triggers.sql`
- **Docs:** `NOTIFICATION_FAVORITES_IMPLEMENTATION_COMPLETE.md`

---

**Tempo Estimado:** 30-45 minutos  
**Dificuldade:** Média  
**Impacto:** Alto
