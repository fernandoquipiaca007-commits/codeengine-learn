# 🔔 NOTIFICATION SYSTEM + FAVORITES FIX — IMPLEMENTATION PLAN

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ JÁ EXISTE
- [x] Tabela `notifications` no banco
- [x] Tabela `favorites` no banco
- [x] NotificationDropdown component
- [x] Badge de contador no navbar
- [x] Sistema de realtime para notificações
- [x] FavoritesList component
- [x] Favorites page

### 🔧 PRECISA IMPLEMENTAR

#### 1. NOTIFICATION BADGE (Navbar)
- [ ] Badge já existe mas precisa melhorar visual
- [ ] Adicionar glow effect
- [ ] Melhorar animação pulse
- [ ] Garantir responsividade

#### 2. CLICKABLE NOTIFICATIONS
- [ ] Implementar navegação por tipo
- [ ] Marcar como lida ao clicar
- [ ] Adicionar link_url nas notificações
- [ ] Routing inteligente

#### 3. FAVORITES SYSTEM
- [ ] Migrar de localStorage para Supabase
- [ ] Criar hook useFavorites
- [ ] Adicionar botão favorito em ProductCard
- [ ] Sincronizar em tempo real
- [ ] Atualizar contador no dashboard

#### 4. ADMIN NOTIFICATIONS
- [ ] Trigger ao criar produto
- [ ] Trigger ao criar notícia
- [ ] Trigger ao criar lançamento
- [ ] Sistema de broadcast

---

## 🗄️ DATABASE SCHEMA

### Tabela: notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  type VARCHAR, -- 'new_product', 'new_news', 'new_release', 'promotion'
  title VARCHAR,
  message TEXT,
  link_url VARCHAR, -- URL para navegação
  thumbnail_url VARCHAR,
  category VARCHAR,
  read_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

### Tabela: favorites
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMP
);
```

---

## 🎯 IMPLEMENTAÇÃO DETALHADA

### 1. NOTIFICATION BADGE PREMIUM

**Localização:** `src/components/NavBar.tsx`

**Visual:**
```tsx
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 
    bg-gradient-to-br from-red-500 to-red-600 
    rounded-full flex items-center justify-center 
    border-2 border-surface 
    shadow-[0_0_12px_rgba(239,68,68,0.6)]
    animate-pulse">
    <span className="font-display text-[9px] font-bold text-white leading-none">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  </span>
)}
```

---

### 2. CLICKABLE NOTIFICATIONS

**Localização:** `src/components/NotificationDropdown.tsx`

**Lógica de Navegação:**
```tsx
async function handleNotificationClick(notification: Notification) {
  // Marcar como lida
  await markAsRead(notification.id);
  
  // Fechar dropdown
  if (onClose) onClose();
  
  // Navegar baseado no tipo
  switch (notification.type) {
    case 'new_product':
      if (notification.link_url) {
        // Extrair product_id da URL
        const productId = notification.link_url.split('/').pop();
        onNavigate('product', productId);
      } else {
        onNavigate('library');
      }
      break;
      
    case 'new_news':
      onNavigate('news');
      break;
      
    case 'new_release':
      onNavigate('releases');
      break;
      
    case 'promotion':
      if (notification.link_url) {
        onNavigate(notification.link_url);
      }
      break;
      
    default:
      onNavigate('member', 'notifications');
  }
}
```

---

### 3. FAVORITES HOOK

**Criar:** `src/hooks/useFavorites.ts`

```tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    
    loadFavorites();
  }, [userId]);

  async function loadFavorites() {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!member) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('member_id', member.id);

      if (error) throw error;

      setFavorites(data?.map(f => f.product_id) || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(productId: string) {
    if (!userId) return;

    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!member) return;

      const isFavorite = favorites.includes(productId);

      if (isFavorite) {
        // Remove
        await supabase
          .from('favorites')
          .delete()
          .eq('member_id', member.id)
          .eq('product_id', productId);

        setFavorites(prev => prev.filter(id => id !== productId));
      } else {
        // Add
        await supabase
          .from('favorites')
          .insert({
            member_id: member.id,
            product_id: productId
          });

        setFavorites(prev => [...prev, productId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  return {
    favorites,
    loading,
    isFavorite: (productId: string) => favorites.includes(productId),
    toggleFavorite
  };
}
```

---

### 4. FAVORITE BUTTON COMPONENT

**Criar:** `src/components/FavoriteButton.tsx`

```tsx
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ isFavorite, onToggle, size = 'md' }: FavoriteButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center
        ${isFavorite 
          ? 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
          : 'bg-white/5 text-on-surface-variant hover:text-red-500'
        } 
        backdrop-blur-sm border border-white/10 transition-all`}
    >
      <Heart 
        className={`${iconSizes[size]} ${isFavorite ? 'fill-current' : ''}`}
      />
    </motion.button>
  );
}
```

---

### 5. ADMIN NOTIFICATION TRIGGERS

**Criar:** `supabase/notification-triggers.sql`

```sql
-- Trigger para novo produto
CREATE OR REPLACE FUNCTION notify_new_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificação para todos os membros
  INSERT INTO notifications (member_id, type, title, message, link_url, thumbnail_url, category)
  SELECT 
    m.id,
    'new_product',
    'Novo Produto Disponível',
    'Confira: ' || NEW.name,
    '/product/' || NEW.id,
    NEW.thumbnail_url,
    NEW.category
  FROM members m
  WHERE m.email_verified = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_product_created
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION notify_new_product();

-- Trigger para nova notícia
CREATE OR REPLACE FUNCTION notify_new_news()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (member_id, type, title, message, link_url, category)
  SELECT 
    m.id,
    'new_news',
    'Nova Notícia',
    NEW.title,
    '/news',
    'news'
  FROM members m
  WHERE m.email_verified = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_news_created
AFTER INSERT ON news
FOR EACH ROW
EXECUTE FUNCTION notify_new_news();
```

---

## 📱 INTEGRATION POINTS

### ProductCard
```tsx
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteButton } from './FavoriteButton';

// Inside component
const { isFavorite, toggleFavorite } = useFavorites(user?.id);

// In render
<FavoriteButton
  isFavorite={isFavorite(product.id)}
  onToggle={() => toggleFavorite(product.id)}
/>
```

### Library Page
- Adicionar FavoriteButton em cada ProductCard
- Filtro "Apenas Favoritos"

### Product Page
- FavoriteButton grande no header
- Animação ao favoritar

---

## 🎨 UX ENHANCEMENTS

### Notification Badge
- Glow vermelho vibrante
- Pulse animation
- Contador 99+
- Responsive sizing

### Favorite Button
- Heart fill animation
- Glow effect quando favoritado
- Haptic feedback (mobile)
- Instant UI update

### Notification Click
- Smooth navigation
- Auto-close dropdown
- Mark as read
- Loading state

---

## ✅ TESTING CHECKLIST

### Notifications
- [ ] Badge aparece com contador correto
- [ ] Clicar notificação navega corretamente
- [ ] Marca como lida ao clicar
- [ ] Realtime updates funcionam
- [ ] Responsive em mobile

### Favorites
- [ ] Adicionar favorito persiste
- [ ] Remover favorito persiste
- [ ] Sincroniza entre páginas
- [ ] Contador atualiza no dashboard
- [ ] Lista de favoritos carrega corretamente

### Admin
- [ ] Criar produto gera notificações
- [ ] Criar notícia gera notificações
- [ ] Notificações aparecem para todos

---

## 🚀 DEPLOYMENT ORDER

1. ✅ Database triggers (notification-triggers.sql)
2. ✅ useFavorites hook
3. ✅ FavoriteButton component
4. ✅ Update NotificationDropdown navigation
5. ✅ Update ProductCard with FavoriteButton
6. ✅ Update FavoritesList to use Supabase
7. ✅ Update Member dashboard counter
8. ✅ Test end-to-end

---

**Status:** Ready for Implementation  
**Priority:** High  
**Complexity:** Medium  
**Impact:** High UX Improvement
