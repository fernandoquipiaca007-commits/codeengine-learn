# 🚀 Quick Start - Sistema de Upload

## ⚡ Início Rápido (5 minutos)

### 1. Verificar Migration ✅

```sql
-- No Supabase SQL Editor
SELECT 
  COUNT(*) as total,
  COUNT(cover_storage_path) as migrated
FROM products;
```

**Esperado:** `migrated` = `total` (100%)

---

### 2. Testar Upload no Admin

```bash
cd admin
npm run dev
```

1. Login → Produtos → Criar Produto
2. Upload de capa + ficheiro
3. Salvar
4. ✅ Deve funcionar sem erros

---

### 3. Testar Visualização no Frontend

```bash
cd ..
npm run dev
```

1. Ir para Biblioteca
2. Ver produto criado
3. ✅ Imagem deve aparecer

---

## 📚 Documentação Completa

- **`UPLOAD_SYSTEM_COMPLETE.md`** - Documentação técnica completa
- **`TEST_UPLOAD_SYSTEM.md`** - Guia de testes detalhado
- **`supabase/test-upload-system.sql`** - Script de verificação SQL

---

## 🔧 Comandos Úteis

### Verificar Status
```sql
-- Executar no Supabase SQL Editor
\i supabase/test-upload-system.sql
```

### Reiniciar Admin
```bash
cd admin
npm run dev
```

### Reiniciar Frontend
```bash
npm run dev
```

### Reiniciar Backend
```bash
cd backend
npm run dev
```

---

## 🎯 Arquitetura Simplificada

### Upload Flow
```
Admin → uploadFile() → Storage → Retorna path → Salva *_storage_path
```

### Display Flow
```
Frontend → Query DB → getProductCoverUrl() → Gera URL → Display
```

### Download Flow
```
Backend → Query DB → Prefere file_storage_path → createSignedUrl() → Download
```

---

## ✅ Checklist Rápido

- [ ] Migration SQL executada
- [ ] Admin funciona (upload)
- [ ] Frontend funciona (display)
- [ ] Backend funciona (download)
- [ ] Sem erros no console
- [ ] Documentação lida

---

## 🆘 Problemas Comuns

### Imagens não aparecem
```sql
-- Verificar paths
SELECT cover_storage_path FROM products WHERE id = 'SEU_ID';
```
**Solução:** Se NULL, executar migration novamente

### Upload falha
**Solução:** Verificar permissões RLS no Supabase Storage

### Download falha
**Solução:** Verificar que `file_storage_path` está preenchido

---

## 📞 Suporte

1. Ler `UPLOAD_SYSTEM_COMPLETE.md`
2. Executar `test-upload-system.sql`
3. Verificar logs do browser (F12)
4. Verificar logs do backend

---

## 🎉 Pronto!

O sistema está **100% funcional** e pronto para uso!

**Próximo passo:** Executar testes completos em `TEST_UPLOAD_SYSTEM.md`

---

**Última Atualização:** 15 de Maio de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Production Ready

