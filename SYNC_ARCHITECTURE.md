# 🔄 Arquitetura de Sincronização - AI Knowledge Store

## Visão Geral

```
┌─────────────────┐
│  ADMIN DASHBOARD│  (Service Role Key - Acesso Total)
│   localhost:5175│
└────────┬────────┘
         │ CREATE/UPDATE/DELETE
         ↓
┌─────────────────────────────────────────┐
│           SUPABASE (HUB CENTRAL)        │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  PostgreSQL  │  │  Realtime       │ │
│  │  Database    │→ │  Subscriptions  │ │
│  └──────────────┘  └─────────────────┘ │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  Storage     │  │  RLS Policies   │ │
│  │  Buckets     │  │  (Security)     │ │
│  └──────────────┘  └─────────────────┘ │
└────────┬────────────────────────────────┘
         │ REALTIME SYNC
         ↓
┌─────────────────┐
│  STORE FRONTEND │  (Anon Key - Acesso Público)
│   localhost:5173│
└─────────────────┘
```

## Fluxo de Dados

### 1. Criação de Produto (Admin → Supabase → Store)

```
ADMIN DASHBOARD
  ↓ 1. Usuário preenche formulário
  ↓ 2. Upload de arquivos para Storage
  ↓ 3. INSERT na tabela products
  ↓
SUPABASE
  ↓ 4. Valida dados
  ↓ 5. Salva no PostgreSQL
  ↓ 6. Dispara evento Realtime
  ↓
STORE FRONTEND
  ↓ 7. Recebe evento via WebSocket
  ↓ 8. Atualiza lista de produtos
  ✓ 9. Produto aparece SEM refresh
```

### 2. Atualização de Produto (Admin → Supabase → Store)

```
ADMIN DASHBOARD
  ↓ 1. Usuário edita produto
  ↓ 2. UPDATE na tabela products
  ↓
SUPABASE
  ↓ 3. Atualiza registro
  ↓ 4. Dispara evento Realtime
  ↓
STORE FRONTEND
  ↓ 5. Recebe evento via WebSocket
  ↓ 6. Atualiza produto na lista
  ✓ 7. Mudanças aparecem SEM refresh
```

### 3. Deleção de Produto (Admin → Supabase → Store)

```
ADMIN DASHBOARD
  ↓ 1. Usuário deleta produto
  ↓ 2. DELETE arquivos do Storage
  ↓ 3. DELETE da tabela products
  ↓
SUPABASE
  ↓ 4. Remove registro
  ↓ 5. Dispara evento Realtime
  ↓
STORE FRONTEND
  ↓ 6. Recebe evento via WebSocket
  ↓ 7. Remove produto da lista
  ✓ 8. Produto desaparece SEM refresh
```

## Componentes da Sincronização

### 1. Supabase Realtime

**O que é:**
- Sistema de WebSocket do Supabase
- Envia eventos em tempo real quando dados mudam
- Funciona automaticamente para todas as tabelas

**Como funciona:**
```typescript
// No Store Frontend
supabase
  .channel('products-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'products' },
    (payload) => {
      // payload.eventType: 'INSERT', 'UPDATE', 'DELETE'
      // payload.new: novo registro
      // payload.old: registro antigo
      handleProductChange(payload);
    }
  )
  .subscribe();
```

### 2. Row Level Security (RLS)

**Admin Dashboard (Service Role Key):**
```sql
-- Acesso TOTAL - bypassa RLS
-- Pode ver, criar, editar, deletar TUDO
```

**Store Frontend (Anon Key):**
```sql
-- Política: Apenas produtos ativos
CREATE POLICY "Public can view active products"
ON products FOR SELECT
USING (status = 'active');

-- Resultado: Store vê apenas produtos com status='active'
```

### 3. Storage Buckets

**Buckets Públicos:**
- `product-covers` → Capas dos produtos
- `product-previews` → Previews/demos
- `product-videos` → Vídeos promocionais

**Buckets Privados:**
- `ebooks-private` → Produtos digitais (apenas após compra)

**Acesso:**
```typescript
// Público (qualquer um pode ver)
const publicUrl = supabase.storage
  .from('product-covers')
  .getPublicUrl('cover.jpg');

// Privado (requer signed URL)
const { data } = await supabase.storage
  .from('ebooks-private')
  .createSignedUrl('ebook.pdf', 86400); // 24h
```

## Implementação no Código

### Admin Dashboard

**Criar Produto:**
```typescript
// admin/src/lib/products.ts
export async function createProduct(formData: ProductFormData) {
  // 1. Upload de arquivos
  const coverUrl = await uploadFile('product-covers', coverFile);
  const storageUrl = await uploadFile('ebooks-private', digitalFile);
  
  // 2. Inserir no banco
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      title: formData.title,
      cover_url: coverUrl,
      storage_url: storageUrl,
      status: 'active'
    })
    .select()
    .single();
  
  // 3. Supabase dispara evento Realtime automaticamente
  return { success: true, product: data };
}
```

### Store Frontend

**Receber Atualizações:**
```typescript
// src/pages/Library.tsx
useEffect(() => {
  // 1. Carregar produtos iniciais
  loadProducts();
  
  // 2. Subscrever a mudanças
  const subscription = supabase
    .channel('products-channel')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'products' },
      (payload) => {
        // Novo produto criado
        if (payload.new.status === 'active') {
          setProducts(prev => [payload.new, ...prev]);
        }
      }
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'products' },
      (payload) => {
        // Produto atualizado
        setProducts(prev => 
          prev.map(p => p.id === payload.new.id ? payload.new : p)
        );
      }
    )
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'products' },
      (payload) => {
        // Produto deletado
        setProducts(prev => 
          prev.filter(p => p.id !== payload.old.id)
        );
      }
    )
    .subscribe();
  
  // 3. Cleanup
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Vantagens da Arquitetura

### ✅ Sincronização Automática
- Mudanças no Admin aparecem no Store instantaneamente
- Sem necessidade de polling ou refresh manual
- Experiência fluida para usuários

### ✅ Segurança
- RLS garante que Store vê apenas produtos ativos
- Admin tem acesso total via service role key
- Storage privado protege produtos digitais

### ✅ Escalabilidade
- Supabase gerencia conexões WebSocket
- PostgreSQL otimizado para performance
- CDN para arquivos estáticos

### ✅ Simplicidade
- Não precisa de backend customizado para sync
- Supabase Realtime funciona automaticamente
- Menos código para manter

## Limitações e Considerações

### 1. Latência
- Realtime tem latência de ~100-500ms
- Aceitável para maioria dos casos
- Para sync crítico, considerar confirmação explícita

### 2. Conexão
- Requer conexão WebSocket ativa
- Se desconectar, reconecta automaticamente
- Implementar fallback para offline

### 3. Escala
- Supabase Realtime suporta milhares de conexões
- Para milhões de usuários, considerar sharding
- Monitorar uso de conexões

## Monitoramento

### Verificar Realtime no Console

```typescript
// Adicionar logs para debug
supabase
  .channel('products-channel')
  .on('postgres_changes', { ... }, (payload) => {
    console.log('Realtime event:', payload.eventType);
    console.log('New data:', payload.new);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
    // status: 'SUBSCRIBED', 'CLOSED', 'CHANNEL_ERROR'
  });
```

### Métricas Importantes

- **Tempo de sincronização**: Admin → Store
- **Taxa de sucesso**: % de eventos recebidos
- **Reconexões**: Quantas vezes reconectou
- **Erros**: Falhas de subscription

## Próximos Passos

1. ✅ **Fase Atual**: Admin Dashboard funcional
2. 🔄 **Próximo**: Implementar Store Frontend completo
3. 📊 **Depois**: Analytics e métricas de sync
4. 🔔 **Futuro**: Notificações push para usuários

---

**Resumo**: O Supabase é o HUB CENTRAL que sincroniza automaticamente Admin e Store via Realtime, garantindo que mudanças apareçam instantaneamente sem refresh manual.
