# ✅ CHECKLIST DE IMPLEMENTAÇÃO: SISTEMA DE UPLOAD

## 📋 Use este checklist para garantir que tudo foi implementado corretamente

---

## 🔧 FASE 1: PREPARAÇÃO

### Antes de Começar
- [ ] Backup do banco de dados criado
- [ ] Acesso ao Supabase SQL Editor confirmado
- [ ] Acesso ao código do admin confirmado
- [ ] Node.js instalado e funcionando
- [ ] Service Role Key obtido do Supabase Dashboard

**Tempo Estimado:** 5 minutos

---

## 🗄️ FASE 2: MIGRATION SQL

### Executar Migration
- [ ] Aberto Supabase SQL Editor
- [ ] Ficheiro `supabase/add-storage-path-columns.sql` copiado
- [ ] Script executado sem erros
- [ ] Resultado mostra colunas adicionadas
- [ ] Resultado mostra dados migrados

### Verificar Colunas
- [ ] Tabela `products` tem `cover_storage_path`
- [ ] Tabela `products` tem `preview_storage_path`
- [ ] Tabela `products` tem `video_storage_path`
- [ ] Tabela `products` tem `file_storage_path`
- [ ] Tabela `product_media` tem `storage_path`
- [ ] Tabela `product_media` tem `bucket_name`
- [ ] Tabela `product_videos` tem `storage_path`
- [ ] Tabela `product_videos` tem `bucket_name`

**Tempo Estimado:** 5 minutos

---

## 🧪 FASE 3: TESTES SQL

### Executar Testes
- [ ] Ficheiro `supabase/test-upload-system.sql` copiado
- [ ] Script executado sem erros
- [ ] Relatório final mostra: ✅ Buckets OK
- [ ] Relatório final mostra: ✅ Políticas OK
- [ ] Relatório final mostra: ✅ Colunas OK
- [ ] Relatório final mostra: ✅ Índices OK

### Verificar Migração de Dados
- [ ] Query mostra produtos com `storage_path` preenchido
- [ ] Percentual de migração > 90%
- [ ] Sem erros de migração

**Tempo Estimado:** 3 minutos

---

## 💻 FASE 4: CÓDIGO DO ADMIN

### Verificar Ficheiros Modificados
- [ ] `admin/src/lib/storage.ts` - Modificado ✅
- [ ] `admin/src/lib/products.ts` - Modificado ✅
- [ ] `admin/src/components/products/MediaGallery.tsx` - Modificado ✅
- [ ] `admin/src/components/products/VideoManager.tsx` - Modificado ✅
- [ ] `admin/src/types/admin.ts` - Modificado ✅

### Configurar Ambiente
- [ ] Ficheiro `admin/.env.local` existe
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_ANON_KEY` configurado
- [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` configurado ⭐ CRÍTICO

### Iniciar Admin
- [ ] Comando `cd admin` executado
- [ ] Comando `npm install` executado (se necessário)
- [ ] Comando `npm run dev` executado
- [ ] Admin iniciou sem erros
- [ ] URL `http://localhost:5174/` acessível

**Tempo Estimado:** 5 minutos

---

## 🎯 FASE 5: TESTES FUNCIONAIS

### Teste 1: Upload de Produto
- [ ] Login no admin realizado
- [ ] Navegado para Produtos → Adicionar Produto
- [ ] Formulário preenchido completamente
- [ ] Upload de capa (imagem) realizado
- [ ] Upload de preview (PDF) realizado
- [ ] Upload de vídeo (MP4) realizado
- [ ] Upload de ficheiro digital (ZIP/PDF) realizado
- [ ] Produto criado com sucesso
- [ ] Produto aparece na lista
- [ ] Sem erros no console do browser

### Teste 2: MediaGallery - Upload
- [ ] Produto aberto
- [ ] Navegado para Galeria de Mídia
- [ ] Toggle "Upload de Ficheiro" selecionado
- [ ] Tipo de mídia selecionado (Imagem)
- [ ] Ficheiro selecionado
- [ ] Título adicionado
- [ ] Upload realizado com sucesso
- [ ] Mídia aparece na galeria
- [ ] Imagem é exibida corretamente

### Teste 3: MediaGallery - URL Externa
- [ ] Toggle "URL Externa" selecionado
- [ ] URL externa colada
- [ ] Título adicionado
- [ ] Mídia adicionada com sucesso
- [ ] Mídia aparece na galeria

### Teste 4: VideoManager - Upload
- [ ] Navegado para Vídeos
- [ ] Toggle "Upload de Vídeo" selecionado
- [ ] Ficheiro de vídeo selecionado (MP4)
- [ ] Título adicionado
- [ ] Upload realizado com sucesso
- [ ] Vídeo aparece na lista
- [ ] Tipo mostra "upload"

### Teste 5: VideoManager - URL Externa
- [ ] Toggle "URL Externa" selecionado
- [ ] Tipo selecionado (YouTube)
- [ ] URL do YouTube colada
- [ ] Título adicionado
- [ ] Vídeo adicionado com sucesso
- [ ] Vídeo aparece na lista
- [ ] Tipo mostra "youtube"

### Teste 6: Atualização de Produto
- [ ] Produto editado
- [ ] Capa substituída por nova imagem
- [ ] Alterações salvas
- [ ] Nova capa é exibida
- [ ] Sem erros no console

**Tempo Estimado:** 15 minutos

---

## 🔍 FASE 6: VERIFICAÇÃO NO BANCO DE DADOS

### Verificar Produto de Teste
```sql
SELECT 
  id, title,
  cover_storage_path,
  file_storage_path
FROM products
WHERE title LIKE '%Teste%'
ORDER BY created_at DESC
LIMIT 1;
```

- [ ] Query executada
- [ ] `cover_storage_path` está preenchido
- [ ] `file_storage_path` está preenchido
- [ ] Paths são relativos (não URLs completos)

### Verificar Product Media
```sql
SELECT 
  media_type,
  storage_path,
  bucket_name
FROM product_media
ORDER BY created_at DESC
LIMIT 5;
```

- [ ] Query executada
- [ ] Mídia de upload tem `storage_path` preenchido
- [ ] Mídia de upload tem `bucket_name` preenchido
- [ ] Mídia de URL tem `storage_path` NULL

### Verificar Product Videos
```sql
SELECT 
  video_type,
  storage_path,
  bucket_name
FROM product_videos
ORDER BY created_at DESC
LIMIT 5;
```

- [ ] Query executada
- [ ] Vídeo de upload tem tipo "upload"
- [ ] Vídeo de upload tem `storage_path` preenchido
- [ ] Vídeo de URL tem tipo correto (youtube, vimeo, etc)

**Tempo Estimado:** 5 minutos

---

## 🔐 FASE 7: VERIFICAÇÃO DE SEGURANÇA

### Verificar Buckets
- [ ] Bucket `product-covers` existe
- [ ] Bucket `product-previews` existe
- [ ] Bucket `product-videos` existe
- [ ] Bucket `ebooks-private` existe

### Verificar Políticas
```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%product%';
```

- [ ] Query executada
- [ ] Resultado mostra >= 16 políticas

### Verificar Ficheiros no Storage
- [ ] Supabase Dashboard → Storage aberto
- [ ] Bucket `product-covers` tem ficheiros
- [ ] Bucket `ebooks-private` tem ficheiros
- [ ] Ficheiros de teste visíveis

**Tempo Estimado:** 3 minutos

---

## 📊 FASE 8: VERIFICAÇÃO FINAL

### Console do Browser
- [ ] DevTools (F12) aberto
- [ ] Aba Console verificada
- [ ] Sem erros vermelhos
- [ ] Sem warnings críticos

### Performance
- [ ] Upload de imagem < 5 segundos
- [ ] Upload de vídeo < 30 segundos
- [ ] Interface responsiva
- [ ] Sem travamentos

### Documentação
- [ ] `UPLOAD_SYSTEM_README.md` lido
- [ ] `EXECUTE_UPLOAD_FIX.md` seguido
- [ ] `UPLOAD_QUICK_REFERENCE.md` salvo para referência
- [ ] Equipe informada sobre mudanças

**Tempo Estimado:** 5 minutos

---

## 🧹 FASE 9: LIMPEZA (OPCIONAL)

### Remover Dados de Teste
- [ ] Produto de teste identificado
- [ ] Produto de teste deletado
- [ ] Ficheiros de teste removidos do Storage
- [ ] Banco de dados limpo

### Verificar Ficheiros Órfãos
```sql
SELECT COUNT(*) as orphan_files
FROM storage.objects o
WHERE o.bucket_id IN ('product-covers', 'product-previews', 'product-videos', 'ebooks-private')
  AND NOT EXISTS (
    SELECT 1 FROM products p 
    WHERE p.cover_storage_path = o.name 
       OR p.file_storage_path = o.name
  );
```

- [ ] Query executada
- [ ] Resultado verificado
- [ ] Ficheiros órfãos removidos (se necessário)

**Tempo Estimado:** 5 minutos

---

## 📈 FASE 10: MONITORAMENTO

### Configurar Alertas (Recomendado)
- [ ] Alerta de uso de storage > 80%
- [ ] Alerta de taxa de erro > 5%
- [ ] Alerta de ficheiros órfãos > 10

### Queries de Monitoramento Salvas
- [ ] Query de status geral salva
- [ ] Query de uso por bucket salva
- [ ] Query de ficheiros órfãos salva

**Tempo Estimado:** 10 minutos (opcional)

---

## ✅ RESUMO FINAL

### Checklist Geral
- [ ] Migration SQL executada com sucesso
- [ ] Testes SQL passaram (todos ✅)
- [ ] Código do admin atualizado
- [ ] Service Role Key configurado
- [ ] Admin iniciado sem erros
- [ ] Todos os testes funcionais passaram
- [ ] Verificação no banco OK
- [ ] Segurança verificada
- [ ] Documentação lida
- [ ] Equipe informada

### Métricas de Sucesso
- [ ] Upload funciona em 100% dos casos
- [ ] Sem erros no console
- [ ] Paths salvos corretamente no banco
- [ ] Ficheiros antigos deletados corretamente
- [ ] Performance aceitável

---

## 🎉 IMPLEMENTAÇÃO COMPLETA!

Se todos os itens acima estão marcados, o sistema de upload está funcionando perfeitamente!

**Próximos Passos:**
1. Monitorar por alguns dias
2. Reportar qualquer comportamento estranho
3. Consultar `UPLOAD_QUICK_REFERENCE.md` para uso diário

---

## 📞 Em Caso de Problemas

### Problemas Comuns
- **Service role key missing** → Adicione ao `.env.local`
- **Quota exceeded** → Verifique limites no Supabase
- **Permission denied** → Execute `complete-storage-setup.sql`
- **Upload travado** → Verifique tamanho e tipo de ficheiro

### Suporte
1. Consulte `EXECUTE_UPLOAD_FIX.md` → Seção TROUBLESHOOTING
2. Execute `supabase/test-upload-system.sql` para diagnóstico
3. Verifique logs no console (F12)
4. Verifique logs no Supabase Dashboard

---

## 📊 Estatísticas da Implementação

**Tempo Total Estimado:** 45-60 minutos

**Breakdown:**
- Preparação: 5 min
- Migration SQL: 5 min
- Testes SQL: 3 min
- Código Admin: 5 min
- Testes Funcionais: 15 min
- Verificação DB: 5 min
- Verificação Segurança: 3 min
- Verificação Final: 5 min
- Limpeza (opcional): 5 min
- Monitoramento (opcional): 10 min

---

**Data:** 15 de Maio de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Implementação

---

## 🖨️ DICA: Imprima este checklist e marque os itens à medida que completa!
