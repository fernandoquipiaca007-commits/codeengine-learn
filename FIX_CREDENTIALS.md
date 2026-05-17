# 🔧 Corrigir Credenciais do Supabase

## ❌ Problema

Erro 500 ao conectar ao Supabase - credenciais incorretas.

## ✅ Solução

### Passo 1: Obter as Credenciais Corretas

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **ffdqqiunkzhtgbgaojay**
3. Vá em: **Settings** → **API**
4. Copie as seguintes informações:

```
Project URL: https://ffdqqiunkzhtgbgaojay.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

**IMPORTANTE**: 
- A `anon public key` deve começar com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- NÃO deve começar com `sb_publishable_`

### Passo 2: Atualizar .env.local (Raiz do Projeto)

Edite o arquivo `.env.local` na raiz do projeto:

```env
# Store Frontend Environment Variables
VITE_SUPABASE_URL=https://ffdqqiunkzhtgbgaojay.supabase.co
VITE_SUPABASE_ANON_KEY=COLE_AQUI_A_ANON_KEY_CORRETA

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here

# App Configuration
VITE_APP_URL=http://localhost:3000
```

### Passo 3: Atualizar admin/.env.local

Edite o arquivo `admin/.env.local`:

```env
# Admin Dashboard Environment Variables
VITE_SUPABASE_URL=https://ffdqqiunkzhtgbgaojay.supabase.co
VITE_SUPABASE_ANON_KEY=COLE_AQUI_A_ANON_KEY_CORRETA
VITE_SUPABASE_SERVICE_ROLE_KEY=COLE_AQUI_A_SERVICE_ROLE_KEY_CORRETA

# App Configuration
VITE_APP_URL=http://localhost:5175
```

### Passo 4: Reiniciar os Servidores

Após atualizar as credenciais:

1. **Parar os servidores** (Ctrl+C em ambos os terminais)
2. **Reiniciar o Admin:**
   ```bash
   cd admin
   npm run dev
   ```
3. **Reiniciar o Store:**
   ```bash
   # No diretório raiz
   npm run dev
   ```

### Passo 5: Testar Conexão

Acesse:
- Admin: http://localhost:5175
- Store: http://localhost:3000

Você deve ver:
- ✅ "Connected to Supabase successfully" no Admin
- ✅ Produtos carregando no Store (se houver)

## 🔍 Como Identificar a Chave Correta

### ✅ Anon Key CORRETA (JWT Token)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### ❌ Chave INCORRETA
```
sb_publishable_ch9LKmMeHbcMaETHrvn6Rg_ct7douxi
```

## 📍 Onde Encontrar no Supabase Dashboard

```
Supabase Dashboard
  └── Seu Projeto (ffdqqiunkzhtgbgaojay)
      └── Settings (⚙️)
          └── API
              ├── Project URL: https://ffdqqiunkzhtgbgaojay.supabase.co
              ├── Project API keys:
              │   ├── anon public ← COPIE ESTA
              │   └── service_role ← COPIE ESTA (apenas para admin)
              └── JWT Secret (não precisa)
```

## 🎯 Checklist

- [ ] Acessei o Supabase Dashboard
- [ ] Copiei a anon key correta (começa com eyJhbGciOiJIUzI1NiIs...)
- [ ] Copiei a service_role key correta
- [ ] Atualizei `.env.local` na raiz
- [ ] Atualizei `admin/.env.local`
- [ ] Reiniciei ambos os servidores
- [ ] Admin conecta ao Supabase ✅
- [ ] Store conecta ao Supabase ✅

## ❓ Ainda com Erro?

Se ainda aparecer erro 500:

1. **Verifique se o projeto Supabase está ativo**
   - Acesse o dashboard
   - Veja se há algum aviso de projeto pausado

2. **Verifique se as tabelas existem**
   - Vá em: Table Editor
   - Deve ter: categories, products, members, etc.

3. **Verifique RLS (Row Level Security)**
   - Vá em: Authentication → Policies
   - Deve ter políticas configuradas

4. **Teste a conexão diretamente**
   - Abra o console do navegador (F12)
   - Veja os erros detalhados

---

**Me avise quando atualizar as credenciais para eu ajudar a testar!** 🚀
