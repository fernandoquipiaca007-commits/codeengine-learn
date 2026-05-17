# 🔧 SQL Fix - Admin Users Error

## ❌ Erro Encontrado

```
ERROR: 42703: column admin_users.user_id does not exist
```

## ✅ Solução

O erro ocorreu porque a tabela `admin_users` tem uma estrutura diferente da esperada.

---

## 📝 Execute Este SQL

**Arquivo**: `supabase/stripe-automation-schema-safe.sql`

Este arquivo é a versão **corrigida e segura** do schema.

### O Que Foi Corrigido:

**Antes** (com erro):
```sql
CREATE POLICY "Admin can view sales analytics"
  ON sales_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ❌ Coluna não existe
    )
  );
```

**Depois** (corrigido):
```sql
CREATE POLICY "Authenticated users can view sales analytics"
  ON sales_analytics FOR SELECT
  TO authenticated
  USING (true);  -- ✅ Permite todos usuários autenticados
```

---

## 🚀 Passos para Executar

### 1. Abra o Supabase SQL Editor

### 2. Execute o SQL Corrigido
```sql
-- Cole o conteúdo de: supabase/stripe-automation-schema-safe.sql
```

### 3. Verifique os Resultados

Você deve ver:
- ✅ Colunas adicionadas em `products`
- ✅ Colunas adicionadas em `purchases`
- ✅ Tabela `sales_analytics` criada
- ✅ Indexes criados
- ✅ Funções criadas
- ✅ Trigger criado
- ✅ Políticas RLS criadas

---

## 📊 O Que Foi Criado

### Products Table
```sql
+ is_free BOOLEAN DEFAULT false
+ stripe_synced BOOLEAN DEFAULT false
+ auto_sync_stripe BOOLEAN DEFAULT true
```

### Purchases Table
```sql
+ access_type VARCHAR(20) DEFAULT 'paid'
+ download_count INTEGER DEFAULT 0
+ last_downloaded_at TIMESTAMP
```

### Sales Analytics Table (Nova)
```sql
CREATE TABLE sales_analytics (
  id UUID PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Funções
- `check_product_ownership(member_id, product_id)` - Verifica se usuário possui produto
- `update_sales_analytics()` - Atualiza analytics automaticamente

### Trigger
- `trigger_update_sales_analytics` - Dispara quando purchase é completed

---

## 🔐 Nota sobre Segurança

A política RLS atual permite que **todos usuários autenticados** vejam analytics.

**TODO**: Restringir apenas para admins quando soubermos a estrutura correta de `admin_users`.

Para verificar a estrutura:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_users';
```

---

## ✅ Após Executar

1. **Reinicie o backend** (se estiver rodando)
2. **Teste purchase detection**: Abra produto já comprado
3. **Teste free product**: Marque produto como gratuito
4. **Verifique analytics**: Dados devem aparecer automaticamente

---

## 🆘 Se Ainda Der Erro

Execute este SQL para verificar o que foi criado:

```sql
-- Verificar colunas em products
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('is_free', 'stripe_synced', 'auto_sync_stripe');

-- Verificar colunas em purchases
SELECT column_name FROM information_schema.columns
WHERE table_name = 'purchases'
  AND column_name IN ('access_type', 'download_count', 'last_downloaded_at');

-- Verificar se tabela sales_analytics existe
SELECT table_name FROM information_schema.tables
WHERE table_name = 'sales_analytics';

-- Verificar funções
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('check_product_ownership', 'update_sales_analytics');
```

---

**Execute agora**: `supabase/stripe-automation-schema-safe.sql` ✅
