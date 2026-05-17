# 🚀 Fix Product Creation - Execute Agora

## 🔍 PASSO 0: Diagnóstico (RECOMENDADO)

**Antes de aplicar qualquer correção, execute o diagnóstico para identificar o problema exato.**

### Executar Diagnóstico

1. Abrir Supabase SQL Editor
2. Copiar TODO o conteúdo de `supabase/DIAGNOSTIC_PRODUCT_CREATION_ERROR.sql`
3. Colar e executar
4. Ler as Seções 7, 10 e 11 para identificar o problema

**Guia completo:** [`DIAGNOSTIC_GUIDE.md`](./DIAGNOSTIC_GUIDE.md)

**Tempo:** 2 minutos

---

## ❌ Problema

Ao criar produtos no Admin Panel, aparece o erro:
```
Failed to create product: column "title" of relation "notifications" does not exist
```

## ✅ Diagnóstico

**Status:** As colunas existem na tabela `notifications` ✅

**Causa Real:** Os triggers de notificação estão usando `cover_url` mas os novos produtos usam `cover_storage_path`

## ✅ Solução (2 minutos)

### Passo 1: Abrir Supabase SQL Editor

1. Ir para [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar o projeto
3. Clicar em **SQL Editor** no menu lateral

### Passo 2: Executar este SQL

**Opção A - Copiar e colar este SQL simplificado:**

```sql
-- Remove todos os triggers de notificação antigos
DROP TRIGGER IF EXISTS on_product_created ON products CASCADE;
DROP TRIGGER IF EXISTS on_product_marked_new ON products CASCADE;
DROP TRIGGER IF EXISTS on_new_product_notify_members ON products CASCADE;
DROP TRIGGER IF EXISTS on_product_activated_notify_members ON products CASCADE;

DROP FUNCTION IF EXISTS notify_new_product() CASCADE;
DROP FUNCTION IF EXISTS notify_new_release() CASCADE;
DROP FUNCTION IF EXISTS notify_members_new_product() CASCADE;
DROP FUNCTION IF EXISTS notify_members_product_activated() CASCADE;

-- Verificar que triggers foram removidos
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'products';
```

**Opção B - Usar ficheiro completo (recomendado):**

Copiar todo o conteúdo de `supabase/fix-notification-triggers-use-storage-path.sql` e executar.

Este ficheiro:
- Remove todos os triggers antigos
- Cria função helper para converter storage paths em URLs
- Cria novos triggers que usam `cover_storage_path`
- Mantém compatibilidade com `cover_url` antigo

### Passo 3: Clicar em "Run"

Aguardar a execução (2-5 segundos)

### Passo 4: Verificar Resultado

**Opção A:** Deve mostrar 0 triggers restantes
**Opção B:** Deve mostrar os novos triggers criados:
- `on_product_created`
- `on_product_activated`
- `on_product_marked_new`

### Passo 5: Testar

1. Ir para Admin Panel
2. Tentar criar um produto
3. ✅ **Sucesso!** Produto criado sem erros

---

## 📋 O que foi corrigido?

Os triggers antigos em `supabase/notification-triggers.sql` tentavam usar `NEW.cover_url`, mas os novos produtos são criados com `cover_storage_path` (sem `cover_url`).

**Solução:**
- **Opção A:** Remove triggers temporariamente (produtos criados sem notificações)
- **Opção B:** Atualiza triggers para usar `cover_storage_path` (produtos criados com notificações)

---

## 📁 Ficheiros SQL

**Solução Rápida (Opção A):**
- SQL inline acima - remove triggers

**Solução Completa (Opção B - Recomendada):**
- **Ficheiro:** `supabase/fix-notification-triggers-use-storage-path.sql`
- **Contém:** 
  - Remove triggers antigos
  - Cria função helper `get_public_url()`
  - Cria novos triggers compatíveis
  - Verificações e testes

---

## 🆘 Se ainda não funcionar

### Diagnóstico Adicional

Execute este SQL para ver todos os triggers ativos:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products'
ORDER BY trigger_name;
```

Se aparecerem triggers com nomes diferentes, adicione-os ao DROP:

```sql
DROP TRIGGER IF EXISTS <nome_do_trigger> ON products CASCADE;
DROP FUNCTION IF EXISTS <nome_da_funcao>() CASCADE;
```

### Passos de Troubleshooting

1. Verificar que todos os triggers foram removidos
2. Limpar cache do browser (Ctrl+Shift+R)
3. Tentar criar produto novamente
4. Se persistir, executar diagnóstico completo: `supabase/diagnose-notification-issue.sql`
5. Verificar logs do Supabase para erros específicos

---

## 📚 Documentação Completa

Para entender todo o contexto e alterações feitas:
- `UPLOAD_SYSTEM_INDEX.md` - Índice mestre
- `UPLOAD_SYSTEM_TROUBLESHOOTING.md` - Guia completo de troubleshooting
- `UPLOAD_SYSTEM_COMPLETE.md` - Documentação técnica completa

---

**Data:** 15 de Maio de 2026  
**Status:** ✅ Causa raiz identificada - Triggers usam cover_url mas produtos usam cover_storage_path  
**Tempo estimado:** 2 minutos (Opção A) ou 5 minutos (Opção B)

🚀 **Recomendação: Use Opção B para manter notificações funcionando!**
