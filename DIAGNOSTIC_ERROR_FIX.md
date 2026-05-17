# 🔧 CORREÇÃO DE ERRO - Diagnóstico SQL

## ❌ ERRO ENCONTRADO

```
ERROR: 42703: column n.title does not exist
LINE 217: n.title,
```

---

## ✅ SOLUÇÃO

O erro ocorreu porque a tabela `notifications` no seu banco não tem a coluna `title`.

### **OPÇÃO 1: Use o script simplificado (RECOMENDADO)**

1. Abra o Supabase SQL Editor
2. Cole o conteúdo de: **`supabase/DIAGNOSTIC_SIMPLE.sql`**
3. Execute

Este script foi criado especificamente para evitar erros de schema.

---

### **OPÇÃO 2: Use o script completo corrigido**

O arquivo `DIAGNOSTIC_PURCHASE_FLOW.sql` já foi corrigido automaticamente.

1. Abra o Supabase SQL Editor
2. Cole o conteúdo de: **`supabase/DIAGNOSTIC_PURCHASE_FLOW.sql`**
3. Execute novamente

A linha 217 foi corrigida para remover `n.title`.

---

## 📊 DIFERENÇAS ENTRE OS SCRIPTS

### **DIAGNOSTIC_SIMPLE.sql** (Recomendado para você)
- ✅ Mais simples e direto
- ✅ Evita erros de schema
- ✅ Foca nas informações essenciais
- ✅ Mais rápido de executar
- ✅ Resultados mais fáceis de ler

### **DIAGNOSTIC_PURCHASE_FLOW.sql** (Completo)
- ✅ Mais detalhado
- ✅ Mais verificações
- ⚠️  Pode ter erros se o schema for diferente

---

## 🚀 PRÓXIMOS PASSOS

1. **Execute o DIAGNOSTIC_SIMPLE.sql**
2. **Copie os resultados** (especialmente "RESUMO EXECUTIVO")
3. **Continue com o PASSO 2** do diagnóstico (Node.js)

---

## 📋 O QUE O SCRIPT SIMPLIFICADO VERIFICA

✅ **Resumo Executivo:**
- Total de compras
- Compras completadas
- Compras pendentes
- Compras sem member_id
- Usuários sem registro em members
- Compras sem digital_delivery

✅ **Últimas 10 Compras:**
- Detalhes completos de cada compra
- Status de delivery
- Tempo desde a compra

✅ **Compras com Problemas:**
- Compras sem member_id
- Compras sem digital_delivery

✅ **Usuários sem Members:**
- Lista de usuários afetados

✅ **Produtos Configurados:**
- Produtos com/sem stripe_price_id

✅ **Distribuição por Status:**
- Estatísticas de compras

---

## ✅ SCRIPT CORRIGIDO

O erro foi corrigido em ambos os arquivos:

**Antes (ERRO):**
```sql
SELECT 
  n.id,
  n.member_id,
  n.type,
  n.title,        ← COLUNA NÃO EXISTE
  n.message,
  ...
```

**Depois (CORRIGIDO):**
```sql
SELECT 
  n.id,
  n.member_id,
  n.type,
  n.message,      ← COLUNA REMOVIDA
  ...
```

---

## 🎯 AÇÃO IMEDIATA

**👉 Execute o arquivo: `supabase/DIAGNOSTIC_SIMPLE.sql`**

Este arquivo foi criado especificamente para evitar erros como este.

---

**Status:** ✅ Erro corrigido  
**Próxima ação:** Executar DIAGNOSTIC_SIMPLE.sql
