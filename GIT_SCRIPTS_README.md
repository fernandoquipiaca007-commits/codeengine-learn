# 🚀 Git Scripts - CodeEngine Learn

Scripts PowerShell para gerenciar os 3 repositórios do CodeEngine Learn de forma eficiente.

---

## 📦 Repositórios

Este projeto está dividido em 3 repositórios separados:

1. **codeengine-learn** - Frontend da loja (React + Vite)
   - URL: https://github.com/fernandoquipiaca007-commits/codeengine-learn
   - Diretório: `c:\Users\Dell\Documents\codeengine1.2`

2. **codeengine-admin** - Painel administrativo
   - URL: https://github.com/fernandoquipiaca007-commits/codeengine-admin
   - Diretório: `c:\Users\Dell\Documents\codeengine1.2\admin`

3. **codeengine-api** - Backend API
   - URL: https://github.com/fernandoquipiaca007-commits/codeengine-api
   - Diretório: `c:\Users\Dell\Documents\codeengine1.2\backend`

---

## 🛠️ Scripts Disponíveis

### 1. `status-all.ps1` - Verificar Status

Verifica o status de todos os 3 repositórios de uma vez.

**Uso:**
```powershell
.\status-all.ps1
```

**O que mostra:**
- Branch atual
- URL do remote
- Arquivos modificados
- Commits não enviados

---

### 2. `push-all.ps1` - Push Automático

Faz commit e push de todos os 3 repositórios automaticamente com timestamp.

**Uso:**
```powershell
.\push-all.ps1
```

**O que faz:**
- Adiciona todos os arquivos modificados (`git add .`)
- Cria commit com timestamp: `"chore: update 2026-05-17 12:30:45"`
- Faz push para o GitHub
- Mostra resultado de cada repositório

---

### 3. `push-with-message.ps1` - Push com Mensagem Personalizada

Faz commit e push de todos os 3 repositórios com uma mensagem personalizada.

**Uso:**
```powershell
.\push-with-message.ps1 "feat: add multilingual i18n support"
```

**Exemplos de mensagens:**
```powershell
# Nova funcionalidade
.\push-with-message.ps1 "feat: add payment integration with Stripe"

# Correção de bug
.\push-with-message.ps1 "fix: resolve checkout redirect issue"

# Atualização de documentação
.\push-with-message.ps1 "docs: update API documentation"

# Refatoração
.\push-with-message.ps1 "refactor: improve product loading performance"

# Estilo/formatação
.\push-with-message.ps1 "style: format code with prettier"

# Testes
.\push-with-message.ps1 "test: add unit tests for auth service"

# Manutenção
.\push-with-message.ps1 "chore: update dependencies"
```

---

## 📋 Convenções de Commit

Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):

### Tipos de Commit

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação, ponto e vírgula, etc (sem mudança de código)
- **refactor**: Refatoração de código
- **perf**: Melhoria de performance
- **test**: Adição ou correção de testes
- **chore**: Tarefas de manutenção, atualização de dependências
- **ci**: Mudanças em CI/CD
- **build**: Mudanças no sistema de build

### Exemplos

```
feat: add user authentication
fix: resolve memory leak in image upload
docs: update installation guide
style: format code with ESLint
refactor: simplify checkout flow
perf: optimize database queries
test: add integration tests for API
chore: update React to v18
```

---

## 🔄 Workflow Recomendado

### Desenvolvimento Diário

1. **Verificar status antes de começar:**
   ```powershell
   .\status-all.ps1
   ```

2. **Trabalhar normalmente nos arquivos**

3. **Verificar mudanças:**
   ```powershell
   .\status-all.ps1
   ```

4. **Fazer push com mensagem descritiva:**
   ```powershell
   .\push-with-message.ps1 "feat: add new feature X"
   ```

### Push Rápido

Se você só quer salvar o progresso sem se preocupar com a mensagem:

```powershell
.\push-all.ps1
```

---

## 🚨 Solução de Problemas

### Erro: "Execution of scripts is disabled"

Execute este comando no PowerShell como Administrador:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro: "Authentication failed"

1. Use um Personal Access Token em vez da senha
2. Gere em: https://github.com/settings/tokens
3. Selecione o escopo `repo`
4. Use o token como senha quando o Git pedir

### Erro: "failed to push some refs"

```powershell
# No diretório do repositório com problema
git pull --rebase
git push
```

### Erro: "remote origin already exists"

```powershell
git remote remove origin
git remote add origin https://github.com/fernandoquipiaca007-commits/REPO_NAME.git
```

---

## 📊 Comandos Git Úteis

### Ver histórico de commits
```powershell
git log --oneline --graph --all
```

### Ver diferenças
```powershell
git diff
```

### Desfazer último commit (mantém mudanças)
```powershell
git reset --soft HEAD~1
```

### Desfazer mudanças em um arquivo
```powershell
git checkout -- arquivo.txt
```

### Ver branches
```powershell
git branch -a
```

### Criar nova branch
```powershell
git checkout -b feature/nova-funcionalidade
```

### Voltar para main
```powershell
git checkout main
```

---

## 🔐 Segurança

### Arquivos que NUNCA devem ir para o GitHub

Certifique-se de que estes arquivos estão no `.gitignore`:

```
# Variáveis de ambiente
.env
.env.local
.env.store
.env.admin
.env.backend

# Dependências
node_modules/

# Build
dist/
build/

# Logs
*.log
npm-debug.log*

# Sistema operacional
.DS_Store
Thumbs.db
```

### Verificar antes de fazer push

```powershell
# Ver o que será commitado
git status

# Ver o conteúdo das mudanças
git diff
```

---

## 📚 Recursos

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**Criado em**: 2026-05-17  
**Autor**: CodeEngine Learn Team
