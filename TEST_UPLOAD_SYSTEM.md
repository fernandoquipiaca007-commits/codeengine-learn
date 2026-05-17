# 🧪 Guia de Teste - Sistema de Upload

## 📋 Checklist de Testes

### ✅ Fase 1: Verificação SQL

**Objetivo:** Confirmar que a migration foi executada corretamente

```bash
# No Supabase SQL Editor
# Executar: supabase/test-upload-system.sql
```

**Resultados Esperados:**
- ✅ Todas as colunas `*_storage_path` existem
- ✅ Dados migrados (100% ou próximo)
- ✅ Nenhum erro de consistência
- ✅ Relatório mostra "✅ Migration Complete!"

---

### ✅ Fase 2: Teste Admin - Criar Produto

**Objetivo:** Verificar que uploads funcionam e salvam paths corretamente

#### Passo 1: Iniciar Admin
```bash
cd admin
npm run dev
```

#### Passo 2: Criar Produto Novo

1. Aceder a `http://localhost:5173/admin`
2. Login com credenciais de admin
3. Ir para "Produtos" → "Criar Produto"

#### Passo 3: Preencher Formulário

**Dados de Teste:**
- **Título:** "Produto de Teste Upload"
- **Descrição:** "Testando o novo sistema de upload"
- **Categoria:** Qualquer
- **Preço:** 0 (produto grátis para facilitar teste)
- **Status:** Active

**Uploads:**
- **Capa:** Fazer upload de uma imagem PNG/JPG
- **Preview:** Fazer upload de um PDF
- **Vídeo:** Fazer upload de um MP4 (ou deixar vazio)
- **Ficheiro:** Fazer upload de um PDF/ZIP

#### Passo 4: Salvar e Verificar

**No Browser Console (F12):**
- ✅ Não deve ter erros
- ✅ Deve mostrar "Produto criado com sucesso"

**Na Base de Dados:**
```sql
-- Executar no Supabase SQL Editor
SELECT 
  id,
  title,
  cover_storage_path,
  file_storage_path,
  preview_storage_path,
  video_storage_path
FROM products
WHERE title = 'Produto de Teste Upload';
```

**Resultados Esperados:**
- ✅ `cover_storage_path` - Deve ter valor (ex: "uuid/timestamp_image.png")
- ✅ `file_storage_path` - Deve ter valor (ex: "uuid/timestamp_file.pdf")
- ✅ Paths NÃO devem conter "http" (apenas paths relativos)

---

### ✅ Fase 3: Teste Admin - MediaGallery

**Objetivo:** Verificar que MediaGallery funciona com upload e URL

#### Passo 1: Abrir Produto

1. Ir para "Produtos"
2. Clicar no produto criado
3. Scroll até "Galeria de Mídia"

#### Passo 2: Testar Upload de Ficheiro

1. Selecionar "Upload de Ficheiro"
2. Escolher tipo: "Imagem"
3. Selecionar ficheiro de imagem
4. Preencher título (opcional)
5. Clicar "Fazer Upload"

**Resultados Esperados:**
- ✅ Upload completa sem erros
- ✅ Imagem aparece na galeria
- ✅ Badge mostra "✓ Storage"

#### Passo 3: Testar URL Externa

1. Selecionar "URL Externa"
2. Escolher tipo: "Vídeo"
3. Colar URL do YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. Preencher título: "Vídeo do YouTube"
5. Clicar "Adicionar Mídia"

**Resultados Esperados:**
- ✅ Mídia adicionada sem erros
- ✅ Vídeo aparece na galeria
- ✅ Badge mostra "🔗 URL"

---

### ✅ Fase 4: Teste Admin - VideoManager

**Objetivo:** Verificar que VideoManager funciona com upload e URL

#### Passo 1: Testar Upload de Vídeo

1. Scroll até "Vídeos"
2. Selecionar "Upload de Vídeo"
3. Escolher ficheiro MP4
4. Preencher título: "Vídeo de Teste"
5. Clicar "Fazer Upload"

**Resultados Esperados:**
- ✅ Upload completa sem erros
- ✅ Vídeo aparece na lista
- ✅ Tipo: "upload"

#### Passo 2: Testar URL Externa

1. Selecionar "URL Externa"
2. Tipo: "YouTube"
3. URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. Título: "Vídeo Promocional"
5. Clicar "Adicionar Vídeo"

**Resultados Esperados:**
- ✅ Vídeo adicionado sem erros
- ✅ Vídeo aparece na lista
- ✅ Tipo: "youtube"

---

### ✅ Fase 5: Teste Frontend - Visualização

**Objetivo:** Verificar que imagens aparecem corretamente no frontend

#### Passo 1: Iniciar Frontend
```bash
cd ..
npm run dev
```

#### Passo 2: Ver Biblioteca

1. Aceder a `http://localhost:5173`
2. Ir para "Biblioteca"
3. Procurar o produto de teste

**Resultados Esperados:**
- ✅ Imagem da capa aparece corretamente
- ✅ Não há erros 404 nas imagens
- ✅ Console não mostra erros

#### Passo 3: Ver Página do Produto

1. Clicar no produto de teste
2. Verificar todas as imagens

**Resultados Esperados:**
- ✅ Capa principal aparece
- ✅ Galeria de mídia aparece
- ✅ Vídeos aparecem
- ✅ Nenhum erro 404

---

### ✅ Fase 6: Teste Download

**Objetivo:** Verificar que download funciona com novos paths

#### Passo 1: Fazer "Compra" (Produto Grátis)

1. Na página do produto de teste
2. Clicar "Obter Grátis" (ou "Comprar Agora" se for pago)
3. Completar checkout

**Resultados Esperados:**
- ✅ Checkout completa sem erros
- ✅ Redirecionado para área de membros

#### Passo 2: Verificar Área de Membros

1. Ir para "Meus Downloads"
2. Procurar o produto de teste

**Resultados Esperados:**
- ✅ Produto aparece na lista
- ✅ Imagem da capa aparece
- ✅ Botão "Baixar Produto" está visível

#### Passo 3: Fazer Download

1. Clicar "Baixar Produto"
2. Aguardar download

**Resultados Esperados:**
- ✅ Download inicia sem erros
- ✅ Ficheiro é baixado corretamente
- ✅ Ficheiro abre sem problemas

---

### ✅ Fase 7: Verificação Backend

**Objetivo:** Confirmar que backend usa novos campos

#### Passo 1: Verificar Logs

```bash
cd backend
npm run dev
```

#### Passo 2: Fazer Download Novamente

1. No frontend, fazer download do produto
2. Observar logs do backend

**Resultados Esperados:**
- ✅ Nenhum erro nos logs
- ✅ Logs mostram uso de `file_storage_path`
- ✅ Signed URL gerada com sucesso

---

## 🔍 Troubleshooting

### Problema: Imagens não aparecem

**Diagnóstico:**
```sql
-- Verificar paths na DB
SELECT 
  id,
  title,
  cover_url,
  cover_storage_path
FROM products
WHERE id = 'SEU_PRODUCT_ID';
```

**Soluções:**
1. Se `cover_storage_path` está NULL → Executar migration novamente
2. Se `cover_storage_path` contém "http" → Path inválido, corrigir manualmente
3. Se path está correto mas imagem não aparece → Verificar permissões do Storage

### Problema: Upload falha

**Diagnóstico:**
- Abrir Console do Browser (F12)
- Ver mensagem de erro

**Soluções Comuns:**
1. **"Quota exceeded"** → Aumentar quota do Storage
2. **"Permission denied"** → Verificar RLS policies
3. **"File too large"** → Verificar limites em `storage.ts`

### Problema: Download falha

**Diagnóstico:**
```sql
-- Verificar se produto tem file_storage_path
SELECT 
  id,
  title,
  storage_url,
  file_storage_path
FROM products
WHERE id = 'SEU_PRODUCT_ID';
```

**Soluções:**
1. Se ambos NULL → Produto não tem ficheiro
2. Se `file_storage_path` NULL mas `storage_url` tem valor → Executar migration
3. Se ambos têm valor → Verificar logs do backend

---

## 📊 Relatório de Teste

### Template de Relatório

```markdown
# Relatório de Teste - Sistema de Upload
Data: ___/___/2026
Testador: ___________

## Fase 1: SQL ✅ / ❌
- [ ] Migration executada
- [ ] Colunas criadas
- [ ] Dados migrados
- [ ] Relatório OK

## Fase 2: Admin - Criar Produto ✅ / ❌
- [ ] Produto criado
- [ ] Uploads funcionam
- [ ] Paths salvos corretamente
- [ ] Sem erros

## Fase 3: Admin - MediaGallery ✅ / ❌
- [ ] Upload de ficheiro funciona
- [ ] URL externa funciona
- [ ] Badges corretos
- [ ] Sem erros

## Fase 4: Admin - VideoManager ✅ / ❌
- [ ] Upload de vídeo funciona
- [ ] URL externa funciona
- [ ] Tipos corretos
- [ ] Sem erros

## Fase 5: Frontend - Visualização ✅ / ❌
- [ ] Imagens aparecem na biblioteca
- [ ] Imagens aparecem na página do produto
- [ ] Galeria funciona
- [ ] Sem erros 404

## Fase 6: Download ✅ / ❌
- [ ] Checkout funciona
- [ ] Produto aparece em "Meus Downloads"
- [ ] Download funciona
- [ ] Ficheiro abre corretamente

## Fase 7: Backend ✅ / ❌
- [ ] Logs sem erros
- [ ] Usa file_storage_path
- [ ] Signed URLs geradas

## Resultado Final
- Total de Testes: 28
- Testes Passados: ___
- Testes Falhados: ___
- Taxa de Sucesso: ___%

## Observações
___________________________________________
___________________________________________
___________________________________________
```

---

## ✅ Critérios de Aceitação

O sistema está **pronto para produção** quando:

- ✅ Todos os 28 testes passam
- ✅ Taxa de sucesso ≥ 95%
- ✅ Nenhum erro crítico
- ✅ Performance aceitável (uploads < 10s)
- ✅ Documentação completa

---

## 🚀 Após Testes

### Se Todos os Testes Passarem

1. ✅ Marcar como "Production Ready"
2. ✅ Fazer backup da base de dados
3. ✅ Documentar quaisquer observações
4. ✅ Treinar equipa (se aplicável)

### Se Houver Falhas

1. ❌ Documentar falhas detalhadamente
2. ❌ Criar issues para cada problema
3. ❌ Corrigir problemas
4. ❌ Re-executar testes

---

**Última Atualização:** 15 de Maio de 2026  
**Versão:** 1.0.0  
**Status:** Ready for Testing

