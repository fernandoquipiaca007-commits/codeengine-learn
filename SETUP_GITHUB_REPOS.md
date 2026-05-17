# 🚀 Setup GitHub Repositories - CodeEngine Learn

## 📋 Repositórios Necessários

Você precisa criar 3 repositórios no GitHub:

1. **codeengine-learn** - Frontend da loja (React + Vite)
2. **codeengine-admin** - Painel administrativo (React + Vite)
3. **codeengine-api** - Backend API (Node.js + Express + Stripe)

---

## 🔧 Passo 1: Criar os Repositórios no GitHub

### Opção A: Via Interface Web (Recomendado)

1. Acesse: https://github.com/new
2. Crie cada repositório com estas configurações:

#### Repositório 1: codeengine-learn
- **Repository name**: `codeengine-learn`
- **Description**: `CodeEngine Learn - Premium Digital Knowledge Store (Frontend)`
- **Visibility**: Private (ou Public, sua escolha)
- **❌ NÃO** marque "Add a README file"
- **❌ NÃO** adicione .gitignore
- **❌ NÃO** escolha uma licença
- Clique em **Create repository**

#### Repositório 2: codeengine-admin
- **Repository name**: `codeengine-admin`
- **Description**: `CodeEngine Learn - Admin Panel for Product Management`
- **Visibility**: Private (ou Public, sua escolha)
- **❌ NÃO** marque "Add a README file"
- **❌ NÃO** adicione .gitignore
- **❌ NÃO** escolha uma licença
- Clique em **Create repository**

#### Repositório 3: codeengine-api ⚠️ DEVE SER PRIVADO
- **Repository name**: `codeengine-api`
- **Description**: `CodeEngine Learn - Backend API (Stripe, Email, Webhooks)`
- **Visibility**: 🔒 **Private** (OBRIGATÓRIO - contém lógica de pagamento e webhooks sensíveis)
- **❌ NÃO** marque "Add a README file"
- **❌ NÃO** adicione .gitignore
- **❌ NÃO** escolha uma licença
- Clique em **Create repository**

> ⚠️ **IMPORTANTE**: Este repositório DEVE ser privado por questões de segurança!

### Opção B: Via GitHub CLI (gh)

Se você tem o GitHub CLI instalado:

```bash
# Criar os 3 repositórios
gh repo create fernandoquipiaca007-commits/codeengine-learn --public --description "CodeEngine Learn - Premium Digital Knowledge Store (Frontend)"
gh repo create fernandoquipiaca007-commits/codeengine-admin --private --description "CodeEngine Learn - Admin Panel for Product Management"
gh repo create fernandoquipiaca007-commits/codeengine-api --private --description "CodeEngine Learn - Backend API (Stripe, Email, Webhooks)"

# ⚠️ IMPORTANTE: codeengine-api DEVE ser privado por segurança!
```

---

## 🔧 Passo 2: Configurar Git Remotes

Depois de criar os repositórios no GitHub, execute estes comandos:

### Para o Frontend (codeengine-learn)

```bash
cd c:\Users\Dell\Documents\codeengine1.2

# Verificar se já existe um repositório git
git status

# Se não existir, inicializar
git init

# Adicionar o remote
git remote add origin https://github.com/fernandoquipiaca007-commits/codeengine-learn.git

# Verificar
git remote -v
```

### Para o Admin (codeengine-admin)

```bash
cd c:\Users\Dell\Documents\codeengine1.2\admin

# Verificar se já existe um repositório git
git status

# Se não existir, inicializar
git init

# Adicionar o remote
git remote add origin https://github.com/fernandoquipiaca007-commits/codeengine-admin.git

# Verificar
git remote -v
```

### Para o Backend (codeengine-api)

```bash
cd c:\Users\Dell\Documents\codeengine1.2\backend

# Verificar se já existe um repositório git
git status

# Se não existir, inicializar
git init

# Adicionar o remote
git remote add origin https://github.com/fernandoquipiaca007-commits/codeengine-api.git

# Verificar
git remote -v
```

---

## 🔧 Passo 3: Preparar e Fazer o Primeiro Push

### Frontend (codeengine-learn)

```bash
cd c:\Users\Dell\Documents\codeengine1.2

# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Fazer o commit inicial
git commit -m "🎉 Initial commit - CodeEngine Learn Frontend

- React + Vite + TypeScript
- i18n multilingual support (PT, EN, FR)
- Supabase integration
- Stripe checkout
- PWA support
- Member area with library and purchases"

# Criar branch main e fazer push
git branch -M main
git push -u origin main
```

### Admin (codeengine-admin)

```bash
cd c:\Users\Dell\Documents\codeengine1.2\admin

# Adicionar todos os arquivos
git add .

# Fazer o commit inicial
git commit -m "🎉 Initial commit - CodeEngine Admin Panel

- React + Vite + TypeScript
- Product management
- Category management
- News system
- Featured products
- Stripe sync
- Media upload (Supabase Storage)"

# Criar branch main e fazer push
git branch -M main
git push -u origin main
```

### Backend (codeengine-api)

```bash
cd c:\Users\Dell\Documents\codeengine1.2\backend

# Adicionar todos os arquivos
git add .

# Fazer o commit inicial
git commit -m "🎉 Initial commit - CodeEngine Backend API

- Express + TypeScript
- Stripe webhook handler
- Email service (Resend)
- Purchase fulfillment automation
- CORS configured
- Supabase integration"

# Criar branch main e fazer push
git branch -M main
git push -u origin main
```

---

## ⚠️ Importante: Verificar .gitignore

Antes de fazer o push, certifique-se de que os arquivos sensíveis estão no .gitignore:

### Frontend (.gitignore)
```
node_modules/
dist/
.env
.env.local
.env.store
*.log
```

### Admin (.gitignore)
```
node_modules/
dist/
.env
.env.local
.env.admin
*.log
```

### Backend (.gitignore)
```
node_modules/
.env
.env.backend
.env.local
*.log
```

---

## 🔐 Autenticação GitHub

Se você não estiver autenticado, o Git vai pedir suas credenciais:

### Opção 1: Personal Access Token (Recomendado)

1. Vá em: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Dê um nome: "CodeEngine Deploy"
4. Selecione os escopos:
   - ✅ `repo` (acesso completo aos repositórios)
5. Clique em "Generate token"
6. **COPIE O TOKEN** (você não verá novamente!)
7. Use o token como senha quando o Git pedir

### Opção 2: GitHub CLI

```bash
gh auth login
```

---

## 📦 Estrutura Final dos Repositórios

```
fernandoquipiaca007-commits/
├── codeengine-learn/          # Frontend da loja
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── codeengine-admin/          # Painel admin
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
└── codeengine-api/            # Backend API
    ├── stripe-server.ts
    ├── email-service.js
    ├── package.json
    └── tsconfig.json
```

---

## ✅ Verificação Final

Depois de fazer o push, verifique se os repositórios estão acessíveis:

- https://github.com/fernandoquipiaca007-commits/codeengine-learn
- https://github.com/fernandoquipiaca007-commits/codeengine-admin
- https://github.com/fernandoquipiaca007-commits/codeengine-api

---

## 🚀 Próximos Passos

Depois de configurar os repositórios:

1. **Configure GitHub Actions** para CI/CD (opcional)
2. **Configure branch protection** na branch main
3. **Adicione colaboradores** se necessário
4. **Configure secrets** para deploy automático

---

## 📝 Comandos Rápidos de Referência

```bash
# Ver status do repositório
git status

# Ver remotes configurados
git remote -v

# Ver histórico de commits
git log --oneline

# Fazer push de mudanças futuras
git add .
git commit -m "feat: descrição da mudança"
git push

# Criar uma nova branch
git checkout -b feature/nova-funcionalidade

# Voltar para main
git checkout main
```

---

## 🆘 Problemas Comuns

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/fernandoquipiaca007-commits/codeengine-learn.git
```

### Erro: "failed to push some refs"
```bash
git pull origin main --rebase
git push -u origin main
```

### Erro: "Authentication failed"
- Use um Personal Access Token em vez da senha
- Ou configure SSH keys

---

**Criado em**: 2026-05-17  
**Autor**: CodeEngine Learn Team
