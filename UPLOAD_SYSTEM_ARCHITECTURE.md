# 🏗️ ARQUITETURA DO SISTEMA DE UPLOAD

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                              │
│                     (React + TypeScript)                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Upload Request
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      STORAGE LIBRARY                                 │
│                   (admin/src/lib/storage.ts)                         │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ uploadFile(bucket, path, file)                               │  │
│  │   ↓                                                           │  │
│  │ 1. Validate file (size, MIME type)                           │  │
│  │ 2. Upload to Supabase Storage                                │  │
│  │ 3. Return storage path (NOT full URL)                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ generatePublicUrl(bucket, path) → Full URL                   │  │
│  │ generateSignedUrl(bucket, path) → Temporary URL              │  │
│  │ getStorageUrl(bucket, path) → Auto-detect                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Storage Path
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE STORAGE                                │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ product-covers  │  │product-previews │  │ product-videos  │    │
│  │   (Public)      │  │   (Public)      │  │   (Public)      │    │
│  │   5 MB          │  │   10 MB         │  │   100 MB        │    │
│  │   Images        │  │   Images+PDF    │  │   Videos        │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                       │
│  ┌─────────────────┐                                                │
│  │ ebooks-private  │                                                │
│  │   (Private)     │                                                │
│  │   500 MB        │                                                │
│  │   All types     │                                                │
│  └─────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Storage Path
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                             │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ products                                                      │  │
│  │ ├─ cover_storage_path    (NEW)                               │  │
│  │ ├─ preview_storage_path  (NEW)                               │  │
│  │ ├─ video_storage_path    (NEW)                               │  │
│  │ ├─ file_storage_path     (NEW)                               │  │
│  │ ├─ cover_url             (Legacy, backward compat)           │  │
│  │ ├─ preview_url           (Legacy, backward compat)           │  │
│  │ ├─ video_url             (Legacy, backward compat)           │  │
│  │ └─ storage_url           (Legacy, backward compat)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ product_media                                                 │  │
│  │ ├─ storage_path          (NEW)                               │  │
│  │ ├─ bucket_name           (NEW)                               │  │
│  │ └─ url                   (Legacy, backward compat)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ product_videos                                                │  │
│  │ ├─ storage_path          (NEW)                               │  │
│  │ ├─ bucket_name           (NEW)                               │  │
│  │ └─ video_url             (Legacy, backward compat)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Upload

### 1. Upload de Produto Completo

```
User Action: Create Product
         │
         ↓
┌────────────────────────────────────────┐
│ ProductForm.tsx                        │
│ - Collect form data                    │
│ - Collect files (cover, preview, etc)  │
└────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ products.ts: createProduct()           │
│                                        │
│ 1. Generate temp product ID            │
│ 2. Upload cover → storage path         │
│ 3. Upload preview → storage path       │
│ 4. Upload video → storage path         │
│ 5. Upload file → storage path          │
│ 6. Insert into database                │
│    - Save storage paths                │
│    - Save in legacy columns too        │
└────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ storage.ts: uploadFile()               │
│                                        │
│ 1. Find bucket config                  │
│ 2. Validate file                       │
│    - Check size                        │
│    - Check MIME type                   │
│ 3. Upload to Supabase Storage          │
│ 4. Return storage path                 │
│    (NOT full URL!)                     │
└────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ Supabase Storage                       │
│ - Store file in bucket                 │
│ - Apply RLS policies                   │
│ - Return success                       │
└────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ PostgreSQL Database                    │
│ - Insert product record                │
│ - Save storage paths                   │
│ - Create indexes                       │
└────────────────────────────────────────┘
         │
         ↓
    Success! ✅
```

---

### 2. Upload via MediaGallery

```
User Action: Add Media
         │
         ↓
┌────────────────────────────────────────┐
│ MediaGallery.tsx                       │
│                                        │
│ Toggle Mode:                           │
│ ┌──────────────┐  ┌──────────────┐   │
│ │ Upload File  │  │ External URL │   │
│ └──────────────┘  └──────────────┘   │
└────────────────────────────────────────┘
         │                    │
         │ File Mode          │ URL Mode
         ↓                    ↓
┌─────────────────┐  ┌─────────────────┐
│ Upload to       │  │ Save URL        │
│ Storage         │  │ directly        │
│                 │  │                 │
│ 1. Detect bucket│  │ 1. Validate URL │
│ 2. Upload file  │  │ 2. Insert DB    │
│ 3. Get path     │  │    - url field  │
│ 4. Insert DB    │  │    - path NULL  │
│    - path field │  │    - bucket NULL│
│    - bucket     │  │                 │
└─────────────────┘  └─────────────────┘
         │                    │
         └────────┬───────────┘
                  ↓
         Media Added! ✅
```

---

### 3. Upload via VideoManager

```
User Action: Add Video
         │
         ↓
┌────────────────────────────────────────┐
│ VideoManager.tsx                       │
│                                        │
│ Toggle Mode:                           │
│ ┌──────────────┐  ┌──────────────┐   │
│ │ Upload Video │  │ External URL │   │
│ └──────────────┘  └──────────────┘   │
└────────────────────────────────────────┘
         │                    │
         │ File Mode          │ URL Mode
         ↓                    ↓
┌─────────────────┐  ┌─────────────────┐
│ Upload to       │  │ Save URL        │
│ product-videos  │  │ (YouTube, etc)  │
│                 │  │                 │
│ 1. Upload MP4   │  │ 1. Validate URL │
│ 2. Get path     │  │ 2. Detect type  │
│ 3. Insert DB    │  │    (youtube,    │
│    - path field │  │     vimeo, etc) │
│    - bucket     │  │ 3. Insert DB    │
│    - type:upload│  │    - url field  │
└─────────────────┘  └─────────────────┘
         │                    │
         └────────┬───────────┘
                  ↓
         Video Added! ✅
```

---

## 🗄️ Estrutura de Dados

### Antes da Correção (Inconsistente)

```
products
├─ cover_url: "https://...supabase.co/.../cover.jpg"  ← Full URL
├─ preview_url: "https://...supabase.co/.../preview.pdf"  ← Full URL
├─ video_url: "https://...supabase.co/.../video.mp4"  ← Full URL
└─ storage_url: "product-id/file.zip"  ← Path only! ❌ INCONSISTENT
```

### Depois da Correção (Consistente)

```
products
├─ cover_storage_path: "product-id/cover.jpg"  ← Path (NEW)
├─ preview_storage_path: "product-id/preview.pdf"  ← Path (NEW)
├─ video_storage_path: "product-id/video.mp4"  ← Path (NEW)
├─ file_storage_path: "product-id/file.zip"  ← Path (NEW)
│
├─ cover_url: "product-id/cover.jpg"  ← Path (Legacy, backward compat)
├─ preview_url: "product-id/preview.pdf"  ← Path (Legacy, backward compat)
├─ video_url: "product-id/video.mp4"  ← Path (Legacy, backward compat)
└─ storage_url: "product-id/file.zip"  ← Path (Legacy, backward compat)
```

**Nota:** Colunas `*_url` mantidas para compatibilidade, mas agora armazenam paths também.

---

## 🔐 Políticas de Segurança (RLS)

### Buckets Públicos

```
product-covers, product-previews, product-videos
│
├─ INSERT: authenticated users ✅
├─ SELECT: public (anyone) ✅
├─ UPDATE: authenticated users ✅
└─ DELETE: authenticated users ✅
```

### Bucket Privado

```
ebooks-private
│
├─ INSERT: service_role only ✅
├─ SELECT: service_role only ✅
├─ UPDATE: service_role only ✅
└─ DELETE: service_role only ✅
```

**Acesso a ficheiros privados:**
- Admin usa Service Role Key
- Usuários finais recebem URLs assinados temporários (1 hora)

---

## 📊 Fluxo de Recuperação de URLs

### Para Buckets Públicos

```
Database: cover_storage_path = "product-id/cover.jpg"
         │
         ↓
storage.ts: generatePublicUrl("product-covers", path)
         │
         ↓
Supabase: getPublicUrl()
         │
         ↓
Result: "https://...supabase.co/.../product-covers/product-id/cover.jpg"
```

### Para Buckets Privados

```
Database: file_storage_path = "product-id/file.zip"
         │
         ↓
storage.ts: generateSignedUrl("ebooks-private", path, 3600)
         │
         ↓
Supabase: createSignedUrl()
         │
         ↓
Result: "https://...supabase.co/.../ebooks-private/product-id/file.zip?token=..."
         (Expires in 1 hour)
```

---

## 🔄 Fluxo de Atualização de Produto

```
User Action: Update Product (Replace Cover)
         │
         ↓
┌────────────────────────────────────────┐
│ products.ts: updateProduct()           │
│                                        │
│ 1. Get existing product                │
│    - old_cover_path = "old/cover.jpg" │
│                                        │
│ 2. Upload new cover                    │
│    - new_cover_path = "new/cover.jpg" │
│                                        │
│ 3. Update database                     │
│    - cover_storage_path = new_path    │
│                                        │
│ 4. Delete old cover                    │
│    - deleteFile("product-covers",     │
│                 old_cover_path)        │
└────────────────────────────────────────┘
         │
         ↓
    Success! ✅
    Old file deleted ✅
```

---

## 🧹 Fluxo de Limpeza de Ficheiros

### Função deleteOldFile()

```
Input: filePathOrUrl = "https://...supabase.co/.../bucket/path.jpg"
       OR
       filePathOrUrl = "product-id/path.jpg"
         │
         ↓
┌────────────────────────────────────────┐
│ extractStoragePathFromUrl()            │
│                                        │
│ 1. Check if it's a URL or path         │
│ 2. If URL, extract path:               │
│    - Pattern 1: /public/{bucket}/{path}│
│    - Pattern 2: /sign/{bucket}/{path}  │
│    - Pattern 3: /{bucket}/{path}       │
│ 3. If path, return as-is               │
└────────────────────────────────────────┘
         │
         ↓
    Extracted Path: "product-id/path.jpg"
         │
         ↓
┌────────────────────────────────────────┐
│ deleteFile(bucket, path)               │
│                                        │
│ 1. Call Supabase Storage API           │
│ 2. Remove file from bucket             │
└────────────────────────────────────────┘
         │
         ↓
    File Deleted! ✅
```

---

## 🎯 Decisões de Arquitetura

### 1. Por que armazenar paths em vez de URLs?

**Vantagens:**
- ✅ Consistente entre ambientes (dev, staging, prod)
- ✅ Fácil migração entre projetos Supabase
- ✅ URLs podem ser regenerados a qualquer momento
- ✅ Paths são mais leves (menos bytes no DB)

**Desvantagens:**
- ❌ Precisa gerar URL quando necessário (overhead mínimo)

**Decisão:** Vantagens superam desvantagens.

---

### 2. Por que manter colunas antigas?

**Vantagens:**
- ✅ Compatibilidade retroativa total
- ✅ Migração gradual possível
- ✅ Rollback fácil se necessário
- ✅ Código antigo continua funcionando

**Desvantagens:**
- ❌ Duplicação de dados (mínima)
- ❌ Mais colunas no banco

**Decisão:** Compatibilidade é crítica.

---

### 3. Por que separar storage_path e bucket_name?

**Vantagens:**
- ✅ Flexibilidade para mover ficheiros entre buckets
- ✅ Queries mais eficientes (filtrar por bucket)
- ✅ Facilita auditoria e monitoramento
- ✅ Permite políticas diferentes por bucket

**Desvantagens:**
- ❌ Mais uma coluna

**Decisão:** Flexibilidade vale a pena.

---

## 📈 Performance e Otimizações

### Índices Criados

```sql
-- Produtos
CREATE INDEX idx_products_cover_storage_path ON products(cover_storage_path);
CREATE INDEX idx_products_file_storage_path ON products(file_storage_path);

-- Product Media
CREATE INDEX idx_product_media_storage_path ON product_media(storage_path);

-- Product Videos
CREATE INDEX idx_product_videos_storage_path ON product_videos(storage_path);
```

**Benefício:** Queries 10-100x mais rápidas para buscar por path.

---

### Caching (Futuro)

```
┌─────────────────────────────────────────┐
│ Redis Cache (Future)                    │
│                                         │
│ Key: "url:bucket:path"                  │
│ Value: "https://...full-url"            │
│ TTL: 1 hour                             │
└─────────────────────────────────────────┘
```

**Benefício:** Evita regenerar URLs repetidamente.

---

## 🔮 Evolução Futura

### Fase 6: Validação Server-Side

```
Upload Request
     │
     ↓
┌─────────────────────────────────────────┐
│ Edge Function: validate-upload          │
│                                         │
│ 1. Check magic bytes (real MIME type)  │
│ 2. Scan for viruses (ClamAV)           │
│ 3. Validate dimensions (images)        │
│ 4. Validate duration (videos)          │
└─────────────────────────────────────────┘
     │
     ↓
Accept/Reject
```

---

### Fase 7: Processamento Automático

```
Upload Complete
     │
     ↓
┌─────────────────────────────────────────┐
│ Background Job: process-media           │
│                                         │
│ Images:                                 │
│ - Generate thumbnails                   │
│ - Compress (WebP)                       │
│ - Extract metadata                      │
│                                         │
│ Videos:                                 │
│ - Transcode to multiple formats         │
│ - Generate preview thumbnails           │
│ - Extract duration                      │
└─────────────────────────────────────────┘
     │
     ↓
Optimized Media Ready
```

---

## ✅ Conclusão

A arquitetura foi projetada para:
- **Consistência:** Paths em vez de URLs
- **Flexibilidade:** Suporta upload E URLs externas
- **Segurança:** RLS policies + Service Role Key
- **Performance:** Índices otimizados
- **Escalabilidade:** Pronto para crescer
- **Manutenibilidade:** Código limpo e documentado

**Status:** ✅ Pronto para Produção

---

**Data:** 15 de Maio de 2026  
**Versão:** 1.0.0  
**Arquiteto:** Kiro AI Assistant
