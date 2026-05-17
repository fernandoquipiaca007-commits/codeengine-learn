# 🚀 GUIA DE EXECUÇÃO: CORREÇÃO DO SISTEMA DE UPLOAD

## ⚠️ IMPORTANTE: LEIA ANTES DE COMEÇAR

Este guia contém os passos exatos para aplicar todas as correções do sistema de upload.
Siga a ordem indicada para evitar problemas.

---

## 📋 PRÉ-REQUISITOS

Antes de começar, certifique-se de que tem:

- ✅ Acesso ao Supabase SQL Editor
- ✅ Acesso ao código do admin (VS Code ou similar)
- ✅ Node.js instalado (para executar o admin)
- ✅ Backup do banco de dados (recomendado)

---

## 🔧 PASSO 1: EXECUTAR MIGRATION SQL

### 1.1. Abrir Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral

### 1.2. Executar Script de Migration

1. Abra o ficheiro: `supabase/add-storage-path-columns.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 1.3. Verificar Resultado

Você deve ver várias tabelas de resultado mostrando:

```
✅ Colunas adicionadas com sucesso
✅ Dados migrados automaticamente
✅ Índices criados
```

**Exemplo de saída esperada:**
```
| total_products | with_cover_path | with_file_path |
|----------------|-----------------|----------------|
| 10             | 10              | 10             |
```

Se houver erros, **NÃO CONTINUE**. Contacte suporte ou revise o erro.

---

## 🧪 PASSO 2: EXECUTAR TESTES DE VERIFICAÇÃO

### 2.1. Executar Script de Teste

1. Abra o ficheiro: `supabase/test-upload-system.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**

### 2.2. Verificar Relatório Final

Role até o final dos resultados e procure por:

```
| status                  | buckets      | policies      | columns      | indexes      |
|-------------------------|--------------|---------------|--------------|--------------|
| ✅ SISTEMA DE UPLOAD    | ✅ Buckets OK | ✅ Políticas OK | ✅ Colunas OK | ✅ Índices OK |
```

**Se algum item mostrar ❌:**

- **Buckets Incompletos**: Execute `supabase/complete-storage-setup.sql`
- **Políticas Incompletas**: Execute `supabase/complete-storage-setup.sql`
- **Colunas Faltando**: Re-execute `supabase/add-storage-path-columns.sql`
- **Índices Incompletos**: Verifique logs de erro na migration

---

## 💻 PASSO 3: ATUALIZAR CÓDIGO DO ADMIN

### 3.1. Verificar Alterações de Código

Os seguintes ficheiros foram modificados:

1. ✅ `admin/src/lib/storage.ts` - Funções de upload padronizadas
2. ✅ `admin/src/lib/products.ts` - Uso de storage_path
3. ✅ `admin/src/components/products/MediaGallery.tsx` - Upload integrado
4. ✅ `admin/src/components/products/VideoManager.tsx` - Upload integrado
5. ✅ `admin/src/types/admin.ts` - Tipos atualizados

### 3.2. Verificar Service Role Key

1. Abra: `admin/.env.local`
2. Verifique se existe:
   ```env
   VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. Se não existir, obtenha no Supabase Dashboard:
   - Settings → API → service_role key (secret)
   - Copie e adicione ao `.env.local`

### 3.3. Reinstalar Dependências (se necessário)

```bash
cd admin
npm install
```

---

## 🎯 PASSO 4: TESTAR O SISTEMA

### 4.1. Iniciar Admin Dashboard

```bash
cd admin
npm run dev
```

Aguarde até ver:
```
  ➜  Local:   http://localhost:5174/
```

### 4.2. Fazer Login

1. Acesse: http://localhost:5174/
2. Faça login com suas credenciais de admin

### 4.3. Teste 1: Upload de Produto Completo

1. Vá para **Produtos** → **Adicionar Produto**
2. Preencha todos os campos:
   - Título: "Teste Upload Sistema"
   - Descrição: "Produto de teste"
   - Categoria: Selecione qualquer uma
   - Preço: 10
3. **Faça upload de ficheiros:**
   - ✅ Capa (imagem JPG/PNG)
   - ✅ Preview (PDF ou imagem)
   - ✅ Vídeo (MP4)
   - ✅ Ficheiro Digital (PDF/ZIP)
4. Clique em **Criar Produto**

**Resultado Esperado:**
- ✅ Produto criado com sucesso
- ✅ Todos os ficheiros aparecem no produto
- ✅ Sem erros no console

### 4.4. Teste 2: MediaGallery com Upload

1. Abra o produto criado
2. Vá para a aba **Galeria de Mídia**
3. **Teste modo "Upload de Ficheiro":**
   - Selecione tipo: Imagem
   - Escolha um ficheiro de imagem
   - Adicione título: "Teste Upload Imagem"
   - Clique em **Fazer Upload**
4. **Teste modo "URL Externa":**
   - Mude para "URL Externa"
   - Cole uma URL: `https://via.placeholder.com/400x300`
   - Adicione título: "Teste URL Externa"
   - Clique em **Adicionar Mídia**

**Resultado Esperado:**
- ✅ Ambas as mídias aparecem na galeria
- ✅ Upload mostra progresso
- ✅ Imagens são exibidas corretamente

### 4.5. Teste 3: VideoManager com Upload

1. No mesmo produto, vá para **Vídeos**
2. **Teste modo "Upload de Vídeo":**
   - Selecione um ficheiro MP4 (pequeno, <10MB)
   - Adicione título: "Teste Upload Vídeo"
   - Clique em **Fazer Upload**
3. **Teste modo "URL Externa":**
   - Mude para "URL Externa"
   - Tipo: YouTube
   - URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Título: "Teste YouTube"
   - Clique em **Adicionar Vídeo**

**Resultado Esperado:**
- ✅ Ambos os vídeos aparecem na lista
- ✅ Upload mostra progresso
- ✅ Vídeo do YouTube mostra tipo correto

### 4.6. Teste 4: Atualização de Produto

1. Edite o produto de teste
2. Substitua a capa por uma nova imagem
3. Salve as alterações

**Resultado Esperado:**
- ✅ Nova capa é exibida
- ✅ Capa antiga foi deletada do storage
- ✅ Sem erros

### 4.7. Teste 5: Verificação no Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Verificar produto de teste
SELECT 
  id,
  title,
  cover_storage_path,
  file_storage_path,
  CASE 
    WHEN cover_storage_path IS NOT NULL THEN '✅ Path OK'
    ELSE '❌ Path NULL'
  END as status
FROM products
WHERE title = 'Teste Upload Sistema';

-- Verificar mídia do produto
SELECT 
  media_type,
  storage_path,
  bucket_name,
  CASE 
    WHEN storage_path IS NOT NULL THEN '✅ Storage'
    ELSE '🔗 URL'
  END as source
FROM product_media
WHERE product_id = (
  SELECT id FROM products WHERE title = 'Teste Upload Sistema'
);

-- Verificar vídeos do produto
SELECT 
  video_type,
  storage_path,
  bucket_name,
  CASE 
    WHEN video_type = 'upload' THEN '✅ Upload'
    ELSE '🔗 ' || video_type
  END as source
FROM product_videos
WHERE product_id = (
  SELECT id FROM products WHERE title = 'Teste Upload Sistema'
);
```

**Resultado Esperado:**
- ✅ Produto tem `cover_storage_path` e `file_storage_path` preenchidos
- ✅ Mídia de upload tem `storage_path` e `bucket_name`
- ✅ Mídia de URL tem `storage_path` NULL
- ✅ Vídeo de upload tem tipo 'upload'

---

## 🔍 PASSO 5: VERIFICAÇÃO FINAL

### 5.1. Checklist de Verificação

Execute esta checklist para confirmar que tudo está funcionando:

- [ ] Migration SQL executada sem erros
- [ ] Script de teste mostra todos ✅
- [ ] Service Role Key configurado
- [ ] Admin dashboard inicia sem erros
- [ ] Upload de produto funciona
- [ ] MediaGallery aceita upload E URL
- [ ] VideoManager aceita upload E URL
- [ ] Atualização de produto funciona
- [ ] Ficheiros antigos são deletados
- [ ] Banco de dados tem storage_path preenchido

### 5.2. Verificar Console do Browser

1. Abra DevTools (F12)
2. Vá para a aba **Console**
3. Faça um upload de teste
4. **NÃO deve haver erros vermelhos**

Se houver erros:
- `Service role key missing` → Adicione ao `.env.local`
- `Quota exceeded` → Verifique limites do Supabase
- `Permission denied` → Execute `complete-storage-setup.sql`

### 5.3. Verificar Storage no Supabase

1. Vá para **Storage** no Supabase Dashboard
2. Verifique os buckets:
   - `product-covers` - Deve ter imagens de capa
   - `product-previews` - Deve ter previews
   - `product-videos` - Deve ter vídeos
   - `ebooks-private` - Deve ter ficheiros digitais

---

## ✅ PASSO 6: LIMPEZA (OPCIONAL)

### 6.1. Deletar Produto de Teste

Se quiser remover o produto de teste:

```sql
-- Deletar produto de teste
DELETE FROM products WHERE title = 'Teste Upload Sistema';
```

Os ficheiros no storage serão deletados automaticamente.

### 6.2. Limpar Ficheiros Órfãos (se necessário)

Se houver ficheiros no storage sem referência no banco:

```sql
-- Listar ficheiros órfãos
SELECT 
  o.bucket_id,
  o.name,
  o.created_at
FROM storage.objects o
WHERE o.bucket_id IN ('product-covers', 'product-previews', 'product-videos', 'ebooks-private')
  AND NOT EXISTS (
    SELECT 1 FROM products p 
    WHERE p.cover_storage_path = o.name 
       OR p.preview_storage_path = o.name
       OR p.video_storage_path = o.name
       OR p.file_storage_path = o.name
  )
  AND NOT EXISTS (
    SELECT 1 FROM product_media pm WHERE pm.storage_path = o.name
  )
  AND NOT EXISTS (
    SELECT 1 FROM product_videos pv WHERE pv.storage_path = o.name
  );
```

**Não delete automaticamente!** Verifique manualmente se são realmente órfãos.

---

## 🐛 TROUBLESHOOTING

### Problema: "Service role key missing"

**Solução:**
1. Vá para Supabase Dashboard → Settings → API
2. Copie o `service_role` key (secret)
3. Adicione ao `admin/.env.local`:
   ```env
   VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. Reinicie o admin: `npm run dev`

### Problema: "Quota exceeded"

**Solução:**
1. Verifique limites no Supabase Dashboard → Settings → Usage
2. Se necessário, faça upgrade do plano
3. Ou delete ficheiros antigos não utilizados

### Problema: "Permission denied"

**Solução:**
1. Execute `supabase/complete-storage-setup.sql`
2. Verifique se as políticas foram criadas:
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```
3. Deve haver pelo menos 16 políticas

### Problema: Upload fica "travado"

**Solução:**
1. Verifique conexão com internet
2. Verifique se o ficheiro não excede o limite:
   - Imagens: 5 MB
   - Previews: 10 MB
   - Vídeos: 100 MB
   - Ficheiros: 500 MB
3. Tente com um ficheiro menor

### Problema: Ficheiros não aparecem após upload

**Solução:**
1. Verifique no console do browser se há erros
2. Verifique no banco de dados:
   ```sql
   SELECT * FROM products ORDER BY created_at DESC LIMIT 1;
   ```
3. Verifique se `storage_path` está preenchido
4. Se estiver NULL, há um problema no código de upload

---

## 📞 SUPORTE

Se encontrar problemas não listados aqui:

1. **Verifique os logs:**
   - Console do browser (F12)
   - Terminal do admin (onde executa `npm run dev`)
   - Supabase Dashboard → Logs

2. **Documente o erro:**
   - Mensagem de erro completa
   - Passos para reproduzir
   - Screenshots se possível

3. **Revise a documentação:**
   - `UPLOAD_SYSTEM_FIX_GUIDE.md` - Documentação técnica completa
   - `supabase/add-storage-path-columns.sql` - Comentários no SQL

---

## ✅ CONCLUSÃO

Se todos os testes passaram, o sistema de upload está funcionando corretamente!

**Próximos passos:**
- Use o sistema normalmente
- Monitore por alguns dias
- Reporte qualquer comportamento estranho

**Lembre-se:**
- Sempre faça backup antes de alterações grandes
- Teste em ambiente de desenvolvimento primeiro
- Monitore o uso de storage no Supabase

---

**Data:** 15 de Maio de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Produção
