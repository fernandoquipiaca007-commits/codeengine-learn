# ⚡ GUIA RÁPIDO DE TESTES

## 🚀 TESTE AGORA (5 minutos)

### 1️⃣ LIMPAR NOTIFICAÇÕES (1 min)

**Abra Supabase SQL Editor** e execute:
```sql
UPDATE notifications
SET read_status = true
WHERE member_id IN (
  SELECT id FROM members WHERE email = 'juniorki piaca007@gmail.com'
);
```

✅ **Resultado**: Badge de notificações deve desaparecer

---

### 2️⃣ TESTAR BUSCA (1 min)

1. Acesse: http://localhost:3000
2. Clique no ícone 🔍
3. Digite qualquer termo
4. Clique em um produto
5. ✅ **Resultado**: Deve abrir EXATAMENTE aquele produto

---

### 3️⃣ TESTAR CONFIGURAÇÕES (1 min)

1. Faça login
2. Clique em "Meu Perfil"
3. Clique em "Configurações"
4. Altere seu nome
5. Clique em "Salvar Alterações"
6. ✅ **Resultado**: Mensagem de sucesso

---

### 4️⃣ TESTAR NOTIFICAÇÕES (1 min)

1. Vá em "Meu Perfil"
2. Clique em "NOTIFICAÇÕES"
3. ✅ **Resultado**: Deve abrir sem tela preta
4. ✅ **Resultado**: Badge não deve aparecer (se limpou no passo 1)

---

### 5️⃣ TESTAR NAVEGAÇÃO (1 min)

1. Vá em "Biblioteca"
2. Clique em um produto
3. Volte para "Biblioteca"
4. Clique em OUTRO produto
5. ✅ **Resultado**: Deve mostrar o produto correto

---

## ❌ SE ALGO NÃO FUNCIONAR

### Busca não encontra produtos
**Causa**: Não há produtos no banco
**Solução**: Crie produtos no Admin Panel

### Badge ainda aparece
**Causa**: SQL não foi executado
**Solução**: Execute o SQL do passo 1

### Tela preta nas notificações
**Causa**: Cache do navegador
**Solução**: Pressione Ctrl + Shift + R (hard reload)

### Produto errado abre
**Causa**: Cache do navegador
**Solução**: Pressione Ctrl + Shift + R (hard reload)

---

## ✅ TUDO FUNCIONANDO?

**Parabéns! 🎉**

Agora você pode:
1. Adicionar produtos no Admin
2. Testar o sistema de notificações
3. Explorar todas as funcionalidades

---

## 🆘 PRECISA DE AJUDA?

Me envie:
1. Screenshot do erro
2. Console do navegador (F12)
3. Qual teste falhou

---

**Boa sorte! 🚀**
