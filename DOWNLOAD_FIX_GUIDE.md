# 🔧 Guia de Correção - Download de Produtos

## 📋 Problema Identificado

O botão de download está mostrando erro porque **o arquivo não existe no local especificado** no Supabase Storage.

### Detalhes do Produto:
- **Product ID**: `6dc8eead-ff2a-4593-9c2f-ed15d09c147d`
- **Título**: 7843534345trwegerg
- **Storage URL**: `3a478622-ad57-4b33-a21b-925fefa052b3/1778611141599_laudo.pdf`
- **Erro**: `StorageApiError: Object not found`

---

## 🔍 Diagnóstico

Execute este SQL no Supabase para verificar onde está o problema:

```sql
-- Copie e cole no Supabase SQL Editor
-- Arquivo: supabase/debug-storage-issue.sql
```

Isso vai mostrar:
1. ✅ Quais buckets existem
2. ✅ Onde o arquivo está (se existir)
3. ✅ Qual bucket o produto está configurado para usar

---

## 🛠️ Soluções Possíveis

### **Solução 1: Re-upload do Arquivo (RECOMENDADO)**

Se o arquivo não existe ou está no bucket errado:

1. **Acesse o Admin Dashboard** (http://localhost:5175)
2. **Vá em Produtos** → Encontre o produto "7843534345trwegerg"
3. **Edite o produto**
4. **Na seção "Arquivo Digital"**:
   - Remova o arquivo atual (se houver)
   - Faça upload do arquivo novamente
   - O sistema vai salvar no bucket correto automaticamente
5. **Salve o produto**
6. **Teste o download** no painel de membro

---

### **Solução 2: Verificar Bucket Correto**

O sistema tem dois buckets para arquivos:

| Bucket | Uso | Público? |
|--------|-----|----------|
| `product-covers` | Capas de produtos | ✅ Sim |
| `ebooks-private` | Arquivos para download | ❌ Não (privado) |
| `products` | ⚠️ Pode não existir | ? |

**O arquivo deve estar em `ebooks-private`**, não em `products`.

Execute no Supabase:

```sql
-- Ver se o bucket 'products' existe
SELECT id, name, public FROM storage.buckets WHERE name = 'products';

-- Ver se o bucket 'ebooks-private' existe
SELECT id, name, public FROM storage.buckets WHERE name = 'ebooks-private';
```

---

### **Solução 3: Criar Bucket 'products' (se não existir)**

Se o bucket `products` não existe, você tem duas opções:

#### Opção A: Criar o bucket 'products'

```sql
-- Criar bucket 'products' (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  false,
  524288000, -- 500MB
  ARRAY['application/pdf', 'application/zip', 'application/epub+zip']::text[]
);

-- Adicionar política RLS para permitir downloads autenticados
CREATE POLICY "Authenticated users can download products"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'products');
```

#### Opção B: Usar 'ebooks-private' (RECOMENDADO)

Atualizar o código para usar `ebooks-private` em vez de `products`.

**✅ JÁ FIZ ISSO!** O código agora tenta ambos os buckets automaticamente.

---

## ✅ Correções Aplicadas

### 1. **Código de Download Atualizado**

O componente `src/components/member/DownloadList.tsx` agora:

- ✅ Tenta primeiro no bucket `ebooks-private` (correto)
- ✅ Se falhar, tenta no bucket `products` (fallback)
- ✅ Mostra mensagem de erro clara se o arquivo não existir
- ✅ Usa `createSignedUrl` com 1 hora de validade
- ✅ Faz download direto (não abre em nova aba)
- ✅ Não bloqueia se falhar ao registrar o download

### 2. **Mensagens de Erro Melhoradas**

Agora mostra:
- ❌ "Arquivo não disponível para download" - se storage_url estiver vazio
- ❌ "Arquivo não encontrado no servidor. Entre em contato com o suporte." - se o arquivo não existir

---

## 🧪 Como Testar

### Teste 1: Verificar Storage no Supabase

1. Acesse **Supabase Dashboard** → **Storage**
2. Verifique se existe o bucket `ebooks-private` ou `products`
3. Navegue até a pasta: `3a478622-ad57-4b33-a21b-925fefa052b3`
4. Verifique se existe o arquivo: `1778611141599_laudo.pdf`

### Teste 2: Testar Download

1. Acesse o **painel de membro** (http://localhost:3000/member)
2. Clique em **"Baixar Produto"**
3. Verifique o console do navegador (F12) para ver logs detalhados
4. O arquivo deve baixar automaticamente

---

## 📝 Próximos Passos

1. **Execute o SQL de diagnóstico**: `supabase/debug-storage-issue.sql`
2. **Verifique os resultados** e identifique:
   - ✅ Quais buckets existem?
   - ✅ O arquivo existe em algum bucket?
   - ✅ Qual é o storage_url do produto?
3. **Escolha a solução**:
   - Se arquivo não existe → **Re-upload via Admin** (Solução 1)
   - Se bucket não existe → **Criar bucket** (Solução 3A)
   - Se arquivo está em outro lugar → **Atualizar storage_url**

---

## 🆘 Se Ainda Não Funcionar

Execute este SQL para ver TODOS os arquivos:

```sql
SELECT 
  bucket_id,
  name,
  created_at
FROM storage.objects 
ORDER BY created_at DESC 
LIMIT 50;
```

E me envie o resultado para eu ajudar a identificar onde está o arquivo!

---

## 📊 Status Atual

- ✅ **Pagamento**: 100% funcionando
- ✅ **Webhook**: 100% funcionando
- ✅ **Compra salva**: 100% funcionando
- ✅ **Acesso liberado**: 100% funcionando
- ✅ **Notificação criada**: 100% funcionando
- ⚠️ **Download**: Aguardando re-upload do arquivo
- ❌ **Email**: Ainda não configurado

---

**Última atualização**: 2026-05-13 16:45
