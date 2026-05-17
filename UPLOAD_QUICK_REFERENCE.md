# ⚡ REFERÊNCIA RÁPIDA: SISTEMA DE UPLOAD

## 🎯 Para Desenvolvedores

### Como Fazer Upload de um Ficheiro

```typescript
import { uploadFile, STORAGE_BUCKETS } from './lib/storage';

// Upload de imagem
const coverPath = await uploadFile(
  STORAGE_BUCKETS.PRODUCT_COVERS.name,
  'product-id/cover.jpg',
  file
);
// Retorna: "product-id/cover.jpg" (path relativo)
```

### Como Gerar URL de um Path

```typescript
import { generatePublicUrl, generateSignedUrl } from './lib/storage';

// Para buckets públicos
const url = generatePublicUrl('product-covers', coverPath);

// Para buckets privados (expira em 1 hora)
const url = await generateSignedUrl('ebooks-private', filePath);
```

### Como Deletar um Ficheiro

```typescript
import { deleteFile } from './lib/storage';

await deleteFile('product-covers', 'product-id/cover.jpg');
```

### Buckets Disponíveis

| Bucket | Tipo | Limite | Tipos Permitidos |
|--------|------|--------|------------------|
| `product-covers` | Público | 5 MB | JPG, PNG, WebP |
| `product-previews` | Público | 10 MB | JPG, PNG, PDF |
| `product-videos` | Público | 100 MB | MP4, WebM, OGG |
| `ebooks-private` | Privado | 500 MB | Todos |

---

## 🗄️ Para Administradores de Banco de Dados

### Verificar Status do Sistema

```sql
-- Status geral
SELECT 
  COUNT(*) as total_products,
  COUNT(cover_storage_path) as with_paths,
  ROUND(100.0 * COUNT(cover_storage_path) / COUNT(*), 2) as migration_pct
FROM products;
```

### Listar Produtos Recentes

```sql
SELECT 
  id,
  title,
  cover_storage_path,
  file_storage_path,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar Ficheiros no Storage

```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size
FROM storage.objects
WHERE bucket_id IN ('product-covers', 'product-previews', 'product-videos', 'ebooks-private')
GROUP BY bucket_id;
```

### Encontrar Ficheiros Órfãos

```sql
SELECT 
  o.bucket_id,
  o.name,
  pg_size_pretty(COALESCE((metadata->>'size')::bigint, 0)) as size
FROM storage.objects o
WHERE o.bucket_id = 'product-covers'
  AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.cover_storage_path = o.name
  );
```

---

## 🧪 Para Testers

### Teste Rápido de Upload

1. **Criar Produto:**
   - Produtos → Adicionar Produto
   - Upload: Capa + Ficheiro Digital
   - Salvar

2. **Verificar:**
   ```sql
   SELECT cover_storage_path, file_storage_path 
   FROM products 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - Ambos devem estar preenchidos ✅

3. **Testar MediaGallery:**
   - Abrir produto
   - Galeria de Mídia → Upload de Ficheiro
   - Adicionar imagem
   - Verificar que aparece na galeria ✅

4. **Testar VideoManager:**
   - Vídeos → Upload de Vídeo
   - Adicionar vídeo MP4
   - Verificar que aparece na lista ✅

### Checklist de Teste Completo

- [ ] Upload de produto funciona
- [ ] Atualização de produto funciona
- [ ] Ficheiros antigos são deletados
- [ ] MediaGallery aceita upload
- [ ] MediaGallery aceita URL
- [ ] VideoManager aceita upload
- [ ] VideoManager aceita URL
- [ ] Sem erros no console
- [ ] Paths salvos no banco

---

## 🐛 Troubleshooting Rápido

### Erro: "Service role key missing"
```bash
# Adicione ao admin/.env.local:
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Erro: "Quota exceeded"
```sql
-- Verificar uso:
SELECT 
  bucket_id,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as size
FROM storage.objects
GROUP BY bucket_id;
```

### Erro: "Permission denied"
```sql
-- Recriar políticas:
-- Execute: supabase/complete-storage-setup.sql
```

### Upload fica travado
1. Verificar tamanho do ficheiro (limites acima)
2. Verificar tipo de ficheiro (MIME types permitidos)
3. Verificar conexão com internet
4. Verificar console do browser (F12)

---

## 📊 Queries Úteis

### Produtos sem paths (precisam migração)
```sql
SELECT id, title 
FROM products 
WHERE cover_url IS NOT NULL 
  AND cover_storage_path IS NULL;
```

### Estatísticas de uso por bucket
```sql
SELECT 
  bucket_id,
  COUNT(*) as files,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size,
  pg_size_pretty(AVG(COALESCE((metadata->>'size')::bigint, 0))) as avg_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;
```

### Ficheiros maiores que 10MB
```sql
SELECT 
  bucket_id,
  name,
  pg_size_pretty(COALESCE((metadata->>'size')::bigint, 0)) as size,
  created_at
FROM storage.objects
WHERE COALESCE((metadata->>'size')::bigint, 0) > 10485760
ORDER BY (metadata->>'size')::bigint DESC;
```

### Uploads recentes (últimas 24h)
```sql
SELECT 
  bucket_id,
  name,
  pg_size_pretty(COALESCE((metadata->>'size')::bigint, 0)) as size,
  created_at
FROM storage.objects
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🔧 Comandos Úteis

### Reiniciar Admin
```bash
cd admin
npm run dev
```

### Verificar Variáveis de Ambiente
```bash
cd admin
cat .env.local | grep SUPABASE
```

### Limpar Cache do Browser
```
Ctrl + Shift + Delete (Chrome/Edge)
Cmd + Shift + Delete (Mac)
```

### Verificar Logs do Supabase
1. Supabase Dashboard
2. Logs → Storage
3. Filtrar por erro

---

## 📚 Documentação Completa

- **`UPLOAD_SYSTEM_FIX_GUIDE.md`** - Documentação técnica detalhada
- **`EXECUTE_UPLOAD_FIX.md`** - Guia passo-a-passo de implementação
- **`UPLOAD_FIX_SUMMARY.md`** - Resumo executivo
- **`supabase/add-storage-path-columns.sql`** - Migration SQL
- **`supabase/test-upload-system.sql`** - Testes de verificação

---

## 🆘 Suporte Rápido

### Problema Comum #1: Upload não funciona
1. Verificar Service Role Key
2. Verificar limites de tamanho
3. Verificar tipo de ficheiro
4. Verificar console do browser

### Problema Comum #2: Ficheiros não aparecem
1. Verificar no banco: `SELECT * FROM products ORDER BY created_at DESC LIMIT 1`
2. Verificar se `storage_path` está preenchido
3. Verificar no Storage do Supabase
4. Verificar políticas RLS

### Problema Comum #3: Erro ao deletar
1. Verificar se ficheiro existe no Storage
2. Verificar se path está correto
3. Verificar políticas de DELETE
4. Verificar logs do Supabase

---

## ✅ Checklist Diário

### Antes de Começar o Dia
- [ ] Admin dashboard inicia sem erros
- [ ] Supabase está online
- [ ] Sem alertas de quota

### Durante o Desenvolvimento
- [ ] Testar uploads após mudanças
- [ ] Verificar console por erros
- [ ] Monitorar uso de storage

### Fim do Dia
- [ ] Sem ficheiros órfãos
- [ ] Sem erros não resolvidos
- [ ] Backup se necessário

---

**Última Atualização:** 15 de Maio de 2026  
**Versão:** 1.0.0  
**Mantenha este ficheiro aberto para referência rápida!**
