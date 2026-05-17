# 🔍 Guia de Diagnóstico - Erro ao Criar Produtos

## 🎯 Objetivo

Executar diagnóstico completo antes de aplicar qualquer correção para identificar exatamente qual é o problema.

---

## ⚡ Execução Rápida (2 minutos)

### Passo 1: Abrir Supabase SQL Editor

1. Ir para [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar o projeto
3. Clicar em **SQL Editor** no menu lateral

### Passo 2: Executar Diagnóstico

1. Abrir o ficheiro: `supabase/DIAGNOSTIC_PRODUCT_CREATION_ERROR.sql`
2. Copiar **TODO** o conteúdo
3. Colar no SQL Editor
4. Clicar em **Run**
5. Aguardar 5-10 segundos

### Passo 3: Analisar Resultados

O diagnóstico vai mostrar 11 seções de informação. Procure por:

---

## 📊 Como Interpretar os Resultados

### ✅ Cenário 1: Sistema OK

**Você verá:**
```
✅ INSERT SUCCESSFUL - Product created without errors
✅ SISTEMA OK: Nenhuma ação necessária
```

**Ação:** Nenhuma! O sistema está funcionando corretamente.

---

### 🔴 Cenário 2: Problema com cover_url

**Você verá:**
```
🔴 PROBLEMA IDENTIFICADO: Funções usam NEW.cover_url mas produtos usam cover_storage_path
⚠️ USA cover_url
🔴 PROBLEMA: Acessa NEW.cover_url
```

**Ação:** Executar `supabase/fix-notification-triggers-use-storage-path.sql`

**Guia:** [`FIX_PRODUCT_CREATION_NOW.md`](./FIX_PRODUCT_CREATION_NOW.md) → Opção B

---

### 🔴 Cenário 3: Colunas faltando em notifications

**Você verá:**
```
❌ title MISSING
❌ link_url MISSING
❌ thumbnail_url MISSING
🔴 PROBLEMA: Coluna title não existe em notifications
```

**Ação:** Executar `supabase/add-missing-notification-columns.sql`

**SQL Rápido:**
```sql
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50);
```

---

### ⚠️ Cenário 4: Sem triggers de notificação

**Você verá:**
```
total_triggers: 0
notification_triggers: 0
📝 AÇÃO RECOMENDADA: Nenhum trigger de notificação ativo
```

**Ação:** Produtos podem ser criados, mas sem notificações.

**Opcional:** Executar `supabase/fix-notification-triggers-use-storage-path.sql` para adicionar notificações.

---

### ❌ Cenário 5: Erro específico no INSERT

**Você verá:**
```
❌ INSERT FAILED
Error: [mensagem de erro específica]
```

**Ação:** Ler a mensagem de erro e procurar solução específica em:
- [`UPLOAD_SYSTEM_TROUBLESHOOTING.md`](./UPLOAD_SYSTEM_TROUBLESHOOTING.md)
- [`FIX_PRODUCT_CREATION_NOW.md`](./FIX_PRODUCT_CREATION_NOW.md)

---

## 📋 Seções do Diagnóstico

### Seção 1: Estrutura da tabela notifications
- Mostra todas as colunas da tabela `notifications`
- Verifica se `title`, `link_url`, `thumbnail_url`, `category` existem

### Seção 2: Estrutura da tabela products
- Mostra colunas relacionadas com storage
- Verifica se `cover_storage_path`, `file_storage_path`, `is_new` existem

### Seção 3: Triggers na tabela products
- Lista TODOS os triggers ativos
- Conta quantos são de notificação

### Seção 4: Funções de notificação
- Mostra definições completas das funções
- Permite ver o código SQL das funções

### Seção 5: Análise de cover_url vs cover_storage_path
- **CRÍTICO:** Identifica se funções usam `NEW.cover_url`
- Mostra se há incompatibilidade

### Seção 6: Produtos existentes
- Mostra quantos produtos existem
- Verifica se usam `cover_url` ou `cover_storage_path`

### Seção 7: Simulação de INSERT (DRY RUN)
- **MAIS IMPORTANTE:** Tenta criar um produto de teste
- Mostra se funciona ou qual é o erro exato
- **NÃO CRIA DADOS REAIS** (transação é revertida)

### Seção 8: Tabela members
- Verifica se há membros para receber notificações
- Conta membros verificados

### Seção 9: RLS Policies
- Mostra políticas de segurança na tabela `products`
- Verifica se há restrições que podem bloquear INSERT

### Seção 10: Resumo e Diagnóstico
- **RESUMO EXECUTIVO:** Mostra o problema identificado
- Indica se é problema com `cover_url` ou colunas faltando

### Seção 11: Recomendações
- **AÇÃO CLARA:** Diz exatamente qual SQL executar
- Aponta para o ficheiro correto

---

## 🎯 Fluxo de Trabalho Recomendado

```
1. Executar DIAGNOSTIC_PRODUCT_CREATION_ERROR.sql
   ↓
2. Ir para Seção 10 (Resumo e Diagnóstico)
   ↓
3. Ir para Seção 11 (Recomendações)
   ↓
4. Seguir a ação recomendada
   ↓
5. Testar criar produto no Admin Panel
   ↓
6. Se ainda falhar, executar diagnóstico novamente
```

---

## 📁 Ficheiros Relacionados

### Diagnóstico
- `supabase/DIAGNOSTIC_PRODUCT_CREATION_ERROR.sql` - Este diagnóstico
- `supabase/diagnose-notification-issue.sql` - Diagnóstico alternativo

### Correções
- `supabase/fix-notification-triggers-use-storage-path.sql` - Fix principal (Cenário 2)
- `supabase/add-missing-notification-columns.sql` - Fix alternativo (Cenário 3)

### Guias
- `FIX_PRODUCT_CREATION_NOW.md` - Guia de fix rápido
- `UPLOAD_SYSTEM_TROUBLESHOOTING.md` - Troubleshooting completo
- `DIAGNOSTIC_GUIDE.md` - Este guia

---

## 💡 Dicas

### Dica 1: Foque na Seção 7
A **Seção 7 (Simulação de INSERT)** é a mais importante porque tenta realmente criar um produto e mostra o erro exato.

### Dica 2: Leia a Seção 10
A **Seção 10 (Resumo e Diagnóstico)** resume tudo em uma linha clara.

### Dica 3: Siga a Seção 11
A **Seção 11 (Recomendações)** diz exatamente o que fazer.

### Dica 4: Execute Novamente Após Fix
Depois de aplicar qualquer correção, execute o diagnóstico novamente para confirmar que o problema foi resolvido.

---

## 🆘 Troubleshooting do Diagnóstico

### Problema: Diagnóstico demora muito
**Solução:** Normal. Pode demorar 10-15 segundos porque executa muitas queries.

### Problema: Erro ao executar diagnóstico
**Solução:** Verificar se você tem permissões de admin no Supabase.

### Problema: Não entendo os resultados
**Solução:** 
1. Procure por emojis: 🔴 (problema), ✅ (ok), ⚠️ (atenção)
2. Leia apenas as Seções 7, 10 e 11
3. Consulte este guia para interpretar

### Problema: Diagnóstico diz "OK" mas ainda não consigo criar produtos
**Solução:**
1. Limpar cache do browser (Ctrl+Shift+R)
2. Verificar console do browser para erros JavaScript
3. Verificar logs do Supabase
4. Consultar `UPLOAD_SYSTEM_TROUBLESHOOTING.md`

---

## 📊 Exemplo de Resultado

### Exemplo de Resultado BOM ✅

```sql
-- Seção 7
✅ INSERT SUCCESSFUL - Product created without errors
Test Product ID: 123e4567-e89b-12d3-a456-426614174000

-- Seção 10
✅ OK: Funções não usam NEW.cover_url
✅ OK: Coluna title existe

-- Seção 11
✅ SISTEMA OK: Nenhuma ação necessária
```

### Exemplo de Resultado COM PROBLEMA 🔴

```sql
-- Seção 5
⚠️ USA cover_url
🔴 PROBLEMA: Acessa NEW.cover_url

-- Seção 7
❌ INSERT FAILED
Error: column "title" of relation "notifications" does not exist

-- Seção 10
🔴 PROBLEMA IDENTIFICADO: Funções usam NEW.cover_url mas produtos usam cover_storage_path

-- Seção 11
📝 AÇÃO RECOMENDADA: Executar fix-notification-triggers-use-storage-path.sql
```

---

## ✅ Checklist

Antes de executar correções:

- [ ] Executei o diagnóstico completo
- [ ] Li a Seção 7 (Simulação de INSERT)
- [ ] Li a Seção 10 (Resumo e Diagnóstico)
- [ ] Li a Seção 11 (Recomendações)
- [ ] Identifiquei qual cenário se aplica (1-5)
- [ ] Sei qual SQL executar para corrigir
- [ ] Fiz backup da base de dados (opcional mas recomendado)

Depois de executar correções:

- [ ] Executei o diagnóstico novamente
- [ ] Seção 7 mostra "✅ INSERT SUCCESSFUL"
- [ ] Seção 11 mostra "✅ SISTEMA OK"
- [ ] Testei criar produto no Admin Panel
- [ ] Produto foi criado com sucesso

---

**Data:** 15 de Maio de 2026  
**Versão:** 1.0.0  
**Ficheiro:** `DIAGNOSTIC_GUIDE.md`

🔍 **Execute o diagnóstico ANTES de aplicar qualquer correção!**
