## 🔐 ADMIN AUTHENTICATION SYSTEM - SETUP GUIDE

**Data**: 12 de Maio de 2026  
**Owner**: Fernando Júnior  
**Email**: fernandoquipiaca007@gmail.com

---

## 🎯 OBJETIVO

Criar sistema completo de autenticação administrativa com:
- ✅ Login seguro
- ✅ Roles (Owner, Admin, Editor)
- ✅ Permissões granulares
- ✅ RLS Policies
- ✅ Audit Log
- ✅ Multi-admin support

---

## 📋 PASSO 1: EXECUTAR SQL

### 1.1 Abra o Supabase SQL Editor
- Acesse: https://supabase.com/dashboard
- Selecione seu projeto
- Vá em "SQL Editor"

### 1.2 Execute o SQL
- Abra o arquivo: `supabase/admin-auth-system.sql`
- Copie todo o conteúdo
- Cole no SQL Editor
- Clique em "Run"

### 1.3 Verifique a Execução
Você deve ver:
```
✅ Admin authentication system installed successfully!
```

---

## 📋 PASSO 2: CRIAR USUÁRIO OWNER

### 2.1 Criar Auth User no Supabase

1. Vá em **Authentication** → **Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha:
   - **Email**: `fernandoquipiaca007@gmail.com`
   - **Password**: [Escolha uma senha forte]
   - **Auto Confirm User**: ✅ Marque esta opção
4. Clique em **"Create user"**

### 2.2 Copiar o User ID

1. Após criar, clique no usuário na lista
2. Copie o **ID** (UUID format)
3. Exemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 2.3 Inserir Owner na Tabela admin_users

Execute este SQL substituindo `<AUTH_USER_ID>`:

```sql
INSERT INTO admin_users (
  auth_user_id,
  full_name,
  email,
  role,
  permissions,
  active
) VALUES (
  '<AUTH_USER_ID>',  -- Cole o ID copiado aqui
  'Fernando Júnior',
  'fernandoquipiaca007@gmail.com',
  'owner',
  '{
    "can_publish": true,
    "can_delete": true,
    "can_manage_users": true,
    "can_edit_products": true,
    "can_manage_coupons": true,
    "can_manage_news": true,
    "can_access_analytics": true,
    "can_manage_settings": true
  }'::jsonb,
  true
);
```

### 2.4 Verificar Owner Criado

```sql
SELECT 
  id,
  full_name,
  email,
  role,
  active,
  created_at
FROM admin_users
WHERE role = 'owner';
```

Deve retornar:
```
Fernando Júnior | fernandoquipiaca007@gmail.com | owner | true
```

---

## 📋 PASSO 3: ATUALIZAR ADMIN PANEL

Agora vamos implementar o login no Admin Panel.

### Arquivos que serão criados:
1. `admin/src/pages/Login.tsx` - Página de login
2. `admin/src/contexts/AuthContext.tsx` - Context de autenticação
3. `admin/src/components/ProtectedRoute.tsx` - Proteção de rotas
4. `admin/src/lib/auth.ts` - Funções de autenticação

---

## 🔐 ESTRUTURA DE ROLES

### OWNER (Fernando Júnior)
**Permissões**:
- ✅ Todas as permissões
- ✅ Gerenciar admins
- ✅ Alterar permissões
- ✅ Acessar configurações críticas
- ✅ Ver audit log
- ✅ Excluir qualquer coisa

### ADMIN
**Permissões**:
- ✅ Criar/editar produtos
- ✅ Criar/editar notícias
- ✅ Gerenciar cupons
- ✅ Publicar conteúdo
- ❌ Gerenciar admins
- ❌ Acessar configurações críticas
- ❌ Ver audit log completo

### EDITOR
**Permissões**:
- ✅ Criar notícias (draft)
- ✅ Editar conteúdo
- ❌ Publicar
- ❌ Excluir
- ❌ Gerenciar produtos
- ❌ Gerenciar cupons

---

## 📊 PERMISSÕES DISPONÍVEIS

```json
{
  "can_publish": boolean,
  "can_delete": boolean,
  "can_manage_users": boolean,
  "can_edit_products": boolean,
  "can_manage_coupons": boolean,
  "can_manage_news": boolean,
  "can_access_analytics": boolean,
  "can_manage_settings": boolean
}
```

---

## 🔒 RLS POLICIES IMPLEMENTADAS

### Products
- ✅ Admins podem ver todos
- ✅ Admins com `can_edit_products` podem criar/editar
- ✅ Admins com `can_delete` podem excluir

### Categories
- ✅ Admins podem ver todos
- ✅ Admins podem criar/editar
- ✅ Admins com `can_delete` podem excluir

### News
- ✅ Admins podem ver todos
- ✅ Admins com `can_manage_news` podem criar/editar
- ✅ Admins com `can_delete` podem excluir

### Coupons
- ✅ Admins podem ver todos
- ✅ Admins com `can_manage_coupons` podem criar/editar
- ✅ Admins com `can_delete` podem excluir

---

## 📝 AUDIT LOG

Todas as ações administrativas são registradas:

```sql
SELECT 
  au.full_name,
  al.action,
  al.table_name,
  al.created_at
FROM admin_audit_log al
JOIN admin_users au ON au.id = al.admin_user_id
ORDER BY al.created_at DESC
LIMIT 10;
```

---

## 🧪 TESTES

### Teste 1: Verificar Owner
```sql
SELECT is_owner('<AUTH_USER_ID>');
-- Deve retornar: true
```

### Teste 2: Verificar Admin
```sql
SELECT is_admin('<AUTH_USER_ID>');
-- Deve retornar: true
```

### Teste 3: Verificar Permissão
```sql
SELECT has_permission('<AUTH_USER_ID>', 'can_publish');
-- Deve retornar: true
```

### Teste 4: Verificar Role
```sql
SELECT get_admin_role('<AUTH_USER_ID>');
-- Deve retornar: owner
```

---

## 🚀 PRÓXIMOS PASSOS

Após executar o SQL e criar o Owner:

1. ✅ Implementar Login Page no Admin
2. ✅ Implementar Auth Context
3. ✅ Proteger todas as rotas
4. ✅ Adicionar verificação de permissões
5. ✅ Criar página de gerenciamento de admins (Owner only)
6. ✅ Implementar logout
7. ✅ Adicionar session management

---

## ⚠️ IMPORTANTE

### Segurança
- ✅ Nunca compartilhe credenciais do Owner
- ✅ Use senhas fortes
- ✅ Ative 2FA no Supabase (recomendado)
- ✅ Revise audit log regularmente

### Backup
- ✅ Faça backup do banco regularmente
- ✅ Mantenha lista de admins atualizada
- ✅ Documente mudanças de permissões

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique se o SQL foi executado completamente
2. Verifique se o Owner foi criado corretamente
3. Verifique as RLS policies no Supabase
4. Verifique os logs de erro no console

---

**Status**: ⏳ Aguardando execução do SQL  
**Próximo**: Implementar Login Page no Admin

