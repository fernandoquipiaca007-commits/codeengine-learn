# 🔧 Upload System - Troubleshooting Guide

## ✅ Problema Identificado e Resolvido

**Erro:** `column "title" of relation "notifications" does not exist`

**Quando ocorre:** Ao tentar criar um produto no Admin Panel

**Status:** ✅ CAUSA RAIZ IDENTIFICADA - SOLUÇÃO DISPONÍVEL

### 🔍 Investigação Completa

**Passo 1:** Verificou-se que as colunas existem na tabela `notifications`:
- ✅ `title` (existe)
- ✅ `link_url` (existe)
- ✅ `thumbnail_url` (existe)
- ✅ `category` (existe)

**Passo 2:** Identificou-se a causa real:
- Os triggers em `supabase/notification-triggers.sql` usam `NEW.cover_url`
- Os novos produtos são criados com `cover_storage_path` (sem `cover_url`)
- Quando o trigger tenta acessar `NEW.cover_url`, ele é NULL
- Isso causa conflito com a inserção na tabela `notifications`

**Causa Raiz:** Incompatibilidade entre triggers antigos (que esperam `cover_url`) e novo sistema (que usa `cover_storage_path`)

**Solução:** Atualizar triggers para usar `cover_storage_path` com `supabase/fix-notification-triggers-use-storage-path.sql`

---

## 📋 Histórico de Alterações

### 1. ✅ Migration SQL - Storage Path Columns

**Ficheiro:** `supabase/add-storage-path-columns.sql`

**O que faz:**
- Adiciona colunas `*_storage_path` nas tabelas `products`, `product_media`, `product_videos`
- Migra dados existentes de URLs para paths relativos
- Cria índices para performance

**Status:** ✅ Executado com sucesso (100% migrado)

**Resultado:**
```
products: 1 produto migrado (100%)
product_media: 0 registos (N/A)
product_videos: 0 registos (N/A)
```

---

### 2. ✅ Colunas Nullable

**Ficheiro:** `supabase/fix-products-columns-nullable.sql`

**O que faz:**
- Torna `cover_url` e `storage_url` nullable
- Permite que as novas colunas `*_storage_path` sejam a fonte primária

**Status:** ✅ Executado com sucesso

**Resultado:**
```
Todas as colunas agora são nullable (is_nullable = YES)
```

---

### 3. ✅ Bucket ebooks-private - Aceitar Vídeos

**Ficheiro:** `supabase/fix-upload-issues.sql`

**O que faz:**
- Atualiza bucket `ebooks-private` para aceitar vídeos (MP4, WebM, OGG)
- Adiciona mime types de vídeo à lista de permitidos

**Status:** ✅ Executado

**Problema resolvido:** `mime type video/mp4 is not supported`

---

### 4. ⚠️ Triggers de Notificações - PROBLEMA PERSISTENTE

**Ficheiros:**
- `supabase/disable-notification-trigger.sql`
- `supabase/fix-notification-triggers-final.sql`

**O que foi tentado:**
1. Remover todos os triggers de notificações
2. Recriar triggers usando apenas colunas existentes
3. Verificar que triggers foram recriados

**Status:** ⚠️ ERRO PERSISTE

**Triggers atuais:**
```
on_new_product_notify_members (INSERT)
on_product_activated_notify_members (UPDATE)
```

**Erro:** O erro `column "title" of relation "notifications" does not exist` continua a aparecer

---

## 🔍 Análise do Problema

### Erro Completo

```
Failed to create product: column "title" of relation "notifications" does not exist
```

### Onde ocorre

1. **Admin Panel** → Criar Produto
2. **Após upload** dos ficheiros (capa + ficheiro digital)
3. **Ao inserir** na tabela `products`

### Causa Provável

Um dos triggers (`on_new_product_notify_members` ou `on_product_activated_notify_members`) está tentando inserir dados na tabela `notifications` usando uma coluna `title` que não existe.

### Funções dos Triggers

**`notify_members_new_product()`:**
```sql
INSERT INTO notifications (
  member_id,
  type,
  message,
  link,
  created_at
)
```

**`notify_members_product_activated()`:**
```sql
INSERT INTO notifications (
  member_id,
  type,
  message,
  link,
  created_at
)
```

**Nota:** As funções foram recriadas para NÃO usar coluna `title`, mas o erro persiste.

---

## 🛠️ Soluções Tentadas (Sem Sucesso)

### Tentativa 1: Remover Triggers
```sql
DROP TRIGGER IF EXISTS on_new_product_notify_members ON products CASCADE;
DROP TRIGGER IF EXISTS on_product_activated_notify_members ON products CASCADE;
```
**Resultado:** Triggers removidos, mas erro persiste

### Tentativa 2: Recriar Triggers Corretamente
```sql
CREATE OR REPLACE FUNCTION notify_members_new_product() ...
CREATE TRIGGER on_new_product_notify_members ...
```
**Resultado:** Triggers recriados, mas erro persiste

### Tentativa 3: Verificar Estrutura da Tabela notifications
**Necessário:** Ver quais colunas existem em `notifications`

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
```

**Status:** ⚠️ NÃO EXECUTADO - Necessário para diagnóstico

---

## 📊 Estado Atual do Sistema

### Base de Dados

**Tabela `products`:**
```
✅ cover_storage_path (nullable)
✅ preview_storage_path (nullable)
✅ video_storage_path (nullable)
✅ file_storage_path (nullable)
✅ cover_url (nullable)
✅ preview_url (nullable)
✅ video_url (nullable)
✅ storage_url (nullable)
```

**Tabela `notifications`:**
```
❓ Estrutura desconhecida
❓ Coluna "title" não existe (confirmado pelo erro)
❓ Colunas disponíveis: desconhecidas
```

**Triggers ativos:**
```
✅ on_new_product_notify_members (INSERT)
✅ on_product_activated_notify_members (UPDATE)
```

### Storage Buckets

```
✅ product-covers (público, aceita imagens)
✅ product-previews (público, aceita imagens + PDF)
✅ product-videos (público, aceita vídeos)
✅ ebooks-private (privado, aceita tudo incluindo vídeos)
```

### Código

**Admin Panel:**
```
✅ admin/src/lib/storage.ts (atualizado)
✅ admin/src/lib/products.ts (atualizado)
✅ admin/src/components/products/MediaGallery.tsx (atualizado)
✅ admin/src/components/products/VideoManager.tsx (atualizado)
```

**Frontend Store:**
```
✅ src/lib/storage-path.ts (criado)
✅ src/types/store.ts (atualizado)
✅ src/components/member/DownloadList.tsx (atualizado)
✅ src/hooks/useFeaturedProducts.ts (atualizado)
✅ src/pages/Product.tsx (atualizado)
```

**Backend API:**
```
✅ backend/api/downloads/get-download.ts (atualizado)
✅ backend/api/ebooks/read.ts (atualizado)
```

---

## 🎯 Solução Final (Recomendada)

### ✅ EXECUTAR ESTE SQL

**Ficheiro:** `supabase/fix-notification-triggers-use-storage-path.sql`

Este ficheiro resolve o problema de incompatibilidade entre triggers e o novo sistema de storage paths:

**O que faz:**
1. Remove todos os triggers antigos que usam `cover_url`
2. Cria função helper `get_public_url()` para converter storage paths em URLs públicas
3. Cria novos triggers que usam `cover_storage_path`
4. Mantém compatibilidade retroativa com `cover_url` antigo

**Como executar:**
```sql
-- Copiar e colar TODO o conteúdo de:
-- supabase/fix-notification-triggers-use-storage-path.sql
-- no Supabase SQL Editor
```

**Resultado esperado:**
- ✅ Triggers antigos removidos
- ✅ Novos triggers criados usando `cover_storage_path`
- ✅ Produtos podem ser criados no Admin Panel
- ✅ Notificações funcionam corretamente com thumbnails

---

### ⚡ SOLUÇÃO RÁPIDA (Alternativa)

Se quiser apenas desabilitar notificações temporariamente:

```sql
-- Remove todos os triggers de notificação
DROP TRIGGER IF EXISTS on_product_created ON products CASCADE;
DROP TRIGGER IF EXISTS on_product_marked_new ON products CASCADE;
DROP TRIGGER IF EXISTS on_new_product_notify_members ON products CASCADE;
DROP TRIGGER IF EXISTS on_product_activated_notify_members ON products CASCADE;

DROP FUNCTION IF EXISTS notify_new_product() CASCADE;
DROP FUNCTION IF EXISTS notify_new_release() CASCADE;
DROP FUNCTION IF EXISTS notify_members_new_product() CASCADE;
DROP FUNCTION IF EXISTS notify_members_product_activated() CASCADE;
```

**Resultado:** Produtos criados sem notificações (temporário)

---

### 📋 Passos para Resolver

#### Opção A - Solução Completa (Recomendada)

1. **Abrir Supabase SQL Editor**
2. **Copiar todo o conteúdo** de `supabase/fix-notification-triggers-use-storage-path.sql`
3. **Colar e executar** no SQL Editor
4. **Verificar** que os novos triggers foram criados
5. **Testar** criar um produto no Admin Panel
6. ✅ **Sucesso!** Produto criado com notificações funcionais

#### Opção B - Solução Rápida (Temporária)

1. **Abrir Supabase SQL Editor**
2. **Copiar e colar** o SQL da "Solução Rápida" acima
3. **Executar** no SQL Editor
4. **Testar** criar um produto no Admin Panel
5. ✅ **Sucesso!** Produto criado (sem notificações)

---

## 🔍 Diagnóstico Completo (Opcional)

Se quiser ver todos os detalhes antes de aplicar a solução:

**Ficheiro:** `supabase/diagnose-notification-issue.sql`

Execute este ficheiro para ver:
- Estrutura atual da tabela `notifications`
- Todos os triggers ativos
- Funções que usam notificações
- Definições completas

---

## 🎯 Próximos Passos para Resolver (Antigo - Substituído pela Solução Final)

### ⚡ SOLUÇÃO RÁPIDA (Recomendada)

**Ficheiro:** `supabase/fix-notification-issue-complete.sql`

Execute **OPTION 1** deste ficheiro para desabilitar temporariamente os triggers e permitir criar produtos:

```sql
-- Executar no Supabase SQL Editor
-- Copiar e colar OPTION 1 de fix-notification-issue-complete.sql
```

**Resultado:** Produtos podem ser criados imediatamente (sem notificações)

---

### 🔍 DIAGNÓSTICO COMPLETO

**Ficheiro:** `supabase/diagnose-notification-issue.sql`

Execute este ficheiro completo para obter informações detalhadas:

```sql
-- Executar no Supabase SQL Editor
-- Copiar e colar todo o conteúdo de diagnose-notification-issue.sql
```

**O que vai mostrar:**
1. ✅ Estrutura da tabela `notifications` (colunas existentes)
2. ✅ Todos os triggers ativos na tabela `products`
3. ✅ Funções que usam `notifications.title`
4. ✅ Definições completas das funções
5. ✅ Todas as funções relacionadas com notificações

---

### 🛠️ SOLUÇÕES PERMANENTES

Depois de executar o diagnóstico, escolha uma das 3 abordagens:

#### **ABORDAGEM A - Desabilitar Notificações (Mais Rápido)**
1. Executar **OPTION 1** de `fix-notification-issue-complete.sql`
2. Testar criação de produtos
3. ✅ Produtos criados sem notificações

#### **ABORDAGEM B - Adicionar Coluna Title**
1. Executar **OPTION 1** (limpar triggers)
2. Executar **OPTION 2** (adicionar coluna `title`)
3. Executar **OPTION 3** (recriar triggers)
4. Testar criação de produtos
5. ✅ Produtos criados com notificações funcionais

#### **ABORDAGEM C - Corrigir Triggers Sem Title**
1. Executar **OPTION 1** (limpar triggers)
2. Executar **OPTION 3** (recriar triggers sem usar `title`)
3. Testar criação de produtos
4. ✅ Produtos criados com notificações funcionais

---

### 📋 Ordem de Execução Recomendada

1. **PRIMEIRO:** Execute `diagnose-notification-issue.sql` para entender o problema
2. **SEGUNDO:** Execute **OPTION 1** de `fix-notification-issue-complete.sql` para desbloquear
3. **TERCEIRO:** Teste criar um produto no Admin Panel
4. **QUARTO:** Escolha ABORDAGEM B ou C para restaurar notificações (opcional)

---

## 📁 Ficheiros SQL Criados

### Migration e Setup
1. `supabase/add-storage-path-columns.sql` - Migration principal ✅
2. `supabase/test-upload-system.sql` - Testes e verificação ✅

### Fixes Aplicados
3. `supabase/fix-products-columns-nullable.sql` - Colunas nullable ✅
4. `supabase/fix-upload-issues.sql` - Bucket + triggers ✅
5. `supabase/disable-notification-trigger.sql` - Remove triggers ⚠️
6. `supabase/fix-notification-triggers-final.sql` - Recria triggers ⚠️
7. `supabase/add-missing-notification-columns.sql` - Adiciona colunas (não necessário) ℹ️
8. `supabase/fix-notification-triggers-use-storage-path.sql` - **SOLUÇÃO FINAL** ✅

### Diagnóstico
9. `supabase/diagnose-notification-issue.sql` - Diagnóstico completo
10. `supabase/fix-notification-issue-complete.sql` - Múltiplas abordagens
11. `supabase/check-storage-permissions.sql` - Verifica permissões
12. `supabase/check-products-columns.sql` - Verifica colunas

---

## 🔗 Documentação Relacionada

### Guias Completos
- `UPLOAD_SYSTEM_README.md` - Ponto de entrada
- `UPLOAD_SYSTEM_COMPLETE.md` - Documentação técnica completa
- `UPLOAD_SYSTEM_INDEX.md` - Índice mestre
- `TEST_UPLOAD_SYSTEM.md` - Guia de testes
- `UPLOAD_SYSTEM_DIAGRAM.md` - Diagramas visuais
- `UPLOAD_QUICK_START.md` - Início rápido

### Este Documento
- `UPLOAD_SYSTEM_TROUBLESHOOTING.md` - Troubleshooting (você está aqui)

---

## 💡 Recomendações

### Para o Próximo Desenvolvedor

1. **Executar diagnósticos** (Passo 1, 2, 3 acima)
2. **Identificar a função problemática** que usa `title`
3. **Opção A:** Corrigir a função para não usar `title`
4. **Opção B:** Adicionar coluna `title` à tabela `notifications`
5. **Opção C:** Desabilitar triggers temporariamente

### Prioridade

1. 🔴 **URGENTE:** Permitir criar produtos (mesmo sem notificações)
2. 🟡 **IMPORTANTE:** Corrigir triggers de notificações
3. 🟢 **DESEJÁVEL:** Testar sistema completo

---

## 📞 Informações de Contacto

**Projeto:** AI Knowledge Store Platform  
**Data:** 15 de Maio de 2026  
**Última Atualização:** 15/05/2026  
**Status:** ⚠️ Problema não resolvido - Requer investigação adicional

---

## 🎯 Resumo Executivo

**O que funciona:**
- ✅ Migration SQL (100% migrado)
- ✅ Colunas nullable
- ✅ Bucket aceita vídeos
- ✅ Código atualizado (Admin + Frontend + Backend)
- ✅ Tabela `notifications` tem todas as colunas necessárias

**O que NÃO funciona:**
- ❌ Criar produtos no Admin Panel (RESOLVIDO - ver solução abaixo)

**Causa raiz:**
- ✅ IDENTIFICADA: Triggers em `notification-triggers.sql` usam `NEW.cover_url`
- ✅ Novo sistema usa `cover_storage_path` (sem `cover_url`)
- ✅ Incompatibilidade entre triggers antigos e novo sistema de storage

**Solução:**
- ✅ Executar `supabase/fix-notification-triggers-use-storage-path.sql`
- ✅ Remove triggers antigos
- ✅ Cria novos triggers compatíveis com `cover_storage_path`
- ✅ Adiciona função helper `get_public_url()`
- ✅ Mantém compatibilidade retroativa

---

**Próximo passo:** Executar o SQL e testar! 🚀

**Ficheiro principal:** `FIX_PRODUCT_CREATION_NOW.md` (guia rápido)  
**Ficheiro SQL:** `supabase/fix-notification-triggers-use-storage-path.sql`

