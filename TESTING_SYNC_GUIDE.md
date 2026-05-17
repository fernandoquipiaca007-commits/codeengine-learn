# 🔄 Guia de Teste - Sincronização Realtime

## Arquitetura de Sincronização

```
ADMIN DASHBOARD
    ↓ (cria/edita/deleta)
SUPABASE DATABASE
    ↓ (Realtime Subscriptions)
STORE FRONTEND
    ↓ (atualiza automaticamente)
```

## Passo 1: Preparar o Banco de Dados

### 1.1 Inserir Categorias de Exemplo

Execute no **Supabase SQL Editor**:

```sql
-- Inserir categorias de exemplo
INSERT INTO categories (name, description, display_order) VALUES
  ('E-books', 'Livros digitais sobre diversos temas de tecnologia e IA', 1),
  ('Cursos Online', 'Cursos completos em vídeo sobre programação e IA', 2),
  ('Templates', 'Templates e recursos prontos para uso', 3),
  ('Guias e Tutoriais', 'Guias práticos e tutoriais passo a passo', 4),
  ('Ferramentas', 'Ferramentas e scripts úteis para desenvolvedores', 5)
ON CONFLICT (name) DO NOTHING;

-- Verificar
SELECT * FROM categories ORDER BY display_order;
```

## Passo 2: Testar o Admin Dashboard

### 2.1 Iniciar o Admin Dashboard

```bash
cd admin
npm run dev
```

Acesse: `http://localhost:5175`

### 2.2 Verificar Conexão

- ✅ Dashboard deve mostrar: "✓ Connected to Supabase successfully"
- ✅ Estatísticas devem carregar (mesmo que zeradas)

### 2.3 Criar um Produto

1. Clique em **"Products"** no menu lateral
2. Clique em **"Add Product"**
3. Preencha os campos:
   - **Title**: "Guia Completo de IA"
   - **Description**: "Aprenda tudo sobre Inteligência Artificial"
   - **Category**: Selecione "E-books"
   - **Price**: 49.90
   - **Stripe Price ID**: price_test_123
   - **Tags**: ia, machine-learning, python
   - **CTA Text**: "Comprar Agora"
   - **Status**: Active
4. Faça upload de arquivos (ou use placeholders)
5. Clique em **"Create Product"**

### 2.4 Verificar no Supabase

Execute no **Supabase SQL Editor**:

```sql
-- Ver produtos criados
SELECT 
  p.id,
  p.title,
  c.name as category,
  p.price,
  p.status,
  p.created_at
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC;
```

## Passo 3: Configurar o Store Frontend

### 3.1 Verificar Variáveis de Ambiente

Verifique se `.env.store` existe e tem:

```env
VITE_SUPABASE_URL=https://ffdqqiunkzhtgbgaojay.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ch9LKmMeHbcMaETHrvn6Rg_ct7douxi
```

### 3.2 Copiar para .env.local (se necessário)

```bash
# No diretório raiz do projeto
Copy-Item .env.store .env.local
```

### 3.3 Iniciar o Store Frontend

```bash
# No diretório raiz
npm run dev
```

Acesse: `http://localhost:5173`

## Passo 4: Testar Sincronização Realtime

### 4.1 Teste de Criação

1. **Abra duas janelas do navegador lado a lado:**
   - Janela 1: Admin Dashboard (`http://localhost:5175`)
   - Janela 2: Store Frontend (`http://localhost:5173`)

2. **No Admin Dashboard:**
   - Crie um novo produto
   - Defina status como "Active"

3. **No Store Frontend:**
   - ✅ O produto deve aparecer **automaticamente** sem refresh
   - ✅ Deve mostrar título, preço, categoria, imagem

### 4.2 Teste de Atualização

1. **No Admin Dashboard:**
   - Edite um produto existente
   - Mude o título ou preço
   - Salve as alterações

2. **No Store Frontend:**
   - ✅ As mudanças devem aparecer **automaticamente**
   - ✅ Sem necessidade de recarregar a página

### 4.3 Teste de Deleção

1. **No Admin Dashboard:**
   - Delete um produto

2. **No Store Frontend:**
   - ✅ O produto deve desaparecer **automaticamente**

## Passo 5: Verificar RLS (Row Level Security)

### 5.1 Testar Acesso Público (Store)

O Store usa **anon key** e deve:
- ✅ Ver apenas produtos com `status = 'active'`
- ❌ NÃO ver produtos com `status = 'draft'` ou `'archived'`

### 5.2 Testar Acesso Admin

O Admin usa **service role key** e deve:
- ✅ Ver TODOS os produtos (draft, active, archived)
- ✅ Criar, editar e deletar produtos

## Passo 6: Testar Upload de Arquivos

### 6.1 Criar Produto com Arquivos

1. **No Admin Dashboard:**
   - Crie um novo produto
   - Faça upload de:
     - **Cover Image** (PNG/JPG, max 5MB) → vai para `product-covers`
     - **Preview File** (PDF, max 10MB) → vai para `product-previews`
     - **Video** (MP4, max 100MB) → vai para `product-videos`
     - **Digital Product** (PDF/ZIP, max 500MB) → vai para `ebooks-private`

2. **Verificar no Supabase Storage:**
   - Acesse: Supabase Dashboard → Storage
   - ✅ Arquivos devem estar nos buckets corretos
   - ✅ Cover, preview, video devem ser **públicos**
   - ✅ Digital product deve ser **privado**

### 6.2 Verificar URLs no Store

1. **No Store Frontend:**
   - ✅ Cover image deve carregar
   - ✅ Preview deve estar disponível para download
   - ✅ Video deve tocar
   - ❌ Digital product NÃO deve ter URL pública (apenas após compra)

## Passo 7: Testar Filtros e Busca

### 7.1 No Admin Dashboard

1. **Filtrar por Status:**
   - Selecione "Active" → deve mostrar apenas ativos
   - Selecione "Draft" → deve mostrar apenas rascunhos

2. **Filtrar por Categoria:**
   - Selecione "E-books" → deve mostrar apenas e-books

3. **Buscar:**
   - Digite parte do título → deve filtrar resultados

### 7.2 No Store Frontend

1. **Buscar produtos:**
   - Digite palavras-chave
   - ✅ Deve buscar em título, descrição e tags

2. **Filtrar por categoria:**
   - Selecione uma categoria
   - ✅ Deve mostrar apenas produtos daquela categoria

## Troubleshooting

### ❌ Erro: "Missing VITE_SUPABASE_URL"

**Solução:**
```bash
# No diretório admin/
Copy-Item .env.admin .env.local

# No diretório raiz/
Copy-Item .env.store .env.local

# Reinicie os servidores
```

### ❌ Erro: "Failed to connect to Supabase"

**Verificar:**
1. URL do Supabase está correto?
2. Anon Key está correto?
3. Projeto Supabase está ativo?

### ❌ Produtos não aparecem no Store

**Verificar:**
1. Produto tem `status = 'active'`?
2. RLS policies estão ativas?
3. Store está usando a anon key correta?

### ❌ Realtime não funciona

**Verificar:**
1. Supabase Realtime está habilitado no projeto?
2. Subscriptions estão configuradas corretamente?
3. Console do navegador mostra erros?

## Checklist de Sucesso

- [ ] Admin Dashboard conecta ao Supabase
- [ ] Categorias aparecem no Admin
- [ ] Consigo criar produtos no Admin
- [ ] Produtos aparecem na lista do Admin
- [ ] Store Frontend conecta ao Supabase
- [ ] Produtos ativos aparecem no Store
- [ ] Criar produto no Admin → aparece no Store automaticamente
- [ ] Editar produto no Admin → atualiza no Store automaticamente
- [ ] Deletar produto no Admin → remove do Store automaticamente
- [ ] Upload de arquivos funciona
- [ ] Filtros e busca funcionam
- [ ] RLS protege produtos draft/archived

## Próximos Passos

Após confirmar que tudo funciona:

1. **Task 6**: Implementar Category Management
2. **Task 7**: Implementar Coupon Management
3. **Task 8**: Implementar Analytics Dashboard
4. **Phase 3**: Desenvolver Store Frontend completo
5. **Phase 4**: Desenvolver Backend Service (webhooks, emails)

---

**Dúvidas?** Teste cada passo e me avise se encontrar algum problema!
