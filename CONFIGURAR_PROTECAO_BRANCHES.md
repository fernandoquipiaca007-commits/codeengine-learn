# 🛡️ Configurar Proteção de Branches - CodeEngine

## ✅ Status Atual

Todos os 3 repositórios foram enviados com sucesso para o GitHub:

- ✅ **codeengine-learn** - Frontend (main + develop)
- ✅ **codeengine-admin** - Admin Panel (main + develop)
- ✅ **codeengine-api** - Backend (main + develop)

---

## 🎯 Próximo Passo: Proteção de Branches

Para garantir a qualidade do código e evitar commits diretos nas branches principais, você deve configurar **Branch Protection Rules**.

---

## 📋 Configuração Recomendada

### Para a Branch `main` (Produção)

**Regras obrigatórias:**
- ✅ Require pull request before merging
- ✅ Require approvals (mínimo 1)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

### Para a Branch `develop` (Desenvolvimento)

**Regras recomendadas:**
- ✅ Require pull request before merging
- ⚠️ Require approvals (opcional - 0 ou 1)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

---

## 🔧 Passo a Passo: Configurar no GitHub

### 1. Acessar Configurações

Para cada repositório:

1. **codeengine-learn**: https://github.com/fernandoquipiaca007-commits/codeengine-learn/settings/branches
2. **codeengine-admin**: https://github.com/fernandoquipiaca007-commits/codeengine-admin/settings/branches
3. **codeengine-api**: https://github.com/fernandoquipiaca007-commits/codeengine-api/settings/branches

### 2. Adicionar Regra para `main`

1. Clique em **Add branch protection rule**
2. Em **Branch name pattern**, digite: `main`
3. Marque as seguintes opções:

```
☑️ Require a pull request before merging
   ☑️ Require approvals: 1
   ☑️ Dismiss stale pull request approvals when new commits are pushed
   ☑️ Require review from Code Owners (opcional)

☑️ Require status checks to pass before merging
   ☑️ Require branches to be up to date before merging
   
☑️ Require conversation resolution before merging

☑️ Do not allow bypassing the above settings
```

4. Clique em **Create** no final da página

### 3. Adicionar Regra para `develop`

1. Clique em **Add branch protection rule** novamente
2. Em **Branch name pattern**, digite: `develop`
3. Marque as seguintes opções:

```
☑️ Require a pull request before merging
   ☑️ Require approvals: 0 (ou 1 se preferir)

☑️ Require status checks to pass before merging
   ☑️ Require branches to be up to date before merging
```

4. Clique em **Create**

---

## 🔄 Workflow de Desenvolvimento

Com as proteções configuradas, o workflow será:

### 1. Criar Feature Branch

```bash
# A partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/nova-funcionalidade
```

### 2. Desenvolver e Commitar

```bash
# Fazer mudanças
git add .
git commit -m "feat: adicionar nova funcionalidade"
```

### 3. Push da Feature Branch

```bash
git push -u origin feature/nova-funcionalidade
```

### 4. Criar Pull Request

1. Acesse o repositório no GitHub
2. Clique em **Pull requests** > **New pull request**
3. Base: `develop` ← Compare: `feature/nova-funcionalidade`
4. Preencha título e descrição
5. Clique em **Create pull request**

### 5. Review e Merge

1. Aguarde aprovação (se configurado)
2. Aguarde CI passar (se configurado)
3. Clique em **Merge pull request**
4. Delete a branch após merge

### 6. Deploy para Produção

```bash
# Quando develop estiver estável
# Criar PR de develop → main
```

---

## 🚀 Comandos Úteis

### Atualizar develop local

```bash
git checkout develop
git pull origin develop
```

### Atualizar main local

```bash
git checkout main
git pull origin main
```

### Sincronizar feature branch com develop

```bash
git checkout feature/minha-feature
git merge develop
# Ou
git rebase develop
```

### Deletar branch local após merge

```bash
git branch -d feature/minha-feature
```

### Deletar branch remota

```bash
git push origin --delete feature/minha-feature
```

---

## 📊 Estrutura de Branches

```
main (produção)
  ↑
  └── develop (desenvolvimento)
        ↑
        ├── feature/funcionalidade-1
        ├── feature/funcionalidade-2
        ├── bugfix/correcao-1
        └── hotfix/urgente-1
```

### Tipos de Branches

- **main**: Código em produção
- **develop**: Código em desenvolvimento
- **feature/**: Novas funcionalidades
- **bugfix/**: Correções de bugs
- **hotfix/**: Correções urgentes em produção
- **release/**: Preparação para release

---

## ⚠️ Importante: Visibilidade dos Repositórios

### Configuração Recomendada

| Repositório | Visibilidade | Motivo |
|-------------|--------------|--------|
| **codeengine-api** | 🔒 **PRIVADO** | Contém lógica de pagamento Stripe |
| **codeengine-admin** | 🔒 **PRIVADO** | Painel administrativo sensível |
| **codeengine-learn** | 🌐 Público/Privado | Sua escolha |

### Tornar Repositório Privado

1. Acesse: `https://github.com/fernandoquipiaca007-commits/REPO_NAME/settings`
2. Role até **Danger Zone**
3. Clique em **Change visibility**
4. Selecione **Make private**
5. Confirme digitando o nome do repositório

**⚠️ IMPORTANTE**: O repositório **codeengine-api** DEVE ser privado!

---

## 🔐 Configurar Secrets (Para CI/CD)

Se você configurar GitHub Actions, adicione os secrets:

1. Acesse: `Settings` > `Secrets and variables` > `Actions`
2. Clique em **New repository secret**
3. Adicione:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
```

---

## ✅ Checklist Final

Após configurar tudo:

- [ ] Branch protection configurada em `main` (3 repos)
- [ ] Branch protection configurada em `develop` (3 repos)
- [ ] Repositório `codeengine-api` está privado
- [ ] Repositório `codeengine-admin` está privado (recomendado)
- [ ] Secrets configurados (se usar CI/CD)
- [ ] Colaboradores adicionados (se necessário)
- [ ] README.md atualizado em cada repo
- [ ] CONTRIBUTING.md revisado

---

## 📚 Links Úteis

### Seus Repositórios

- Frontend: https://github.com/fernandoquipiaca007-commits/codeengine-learn
- Admin: https://github.com/fernandoquipiaca007-commits/codeengine-admin
- Backend: https://github.com/fernandoquipiaca007-commits/codeengine-api

### Configurações

- Branch Protection: `/settings/branches`
- Secrets: `/settings/secrets/actions`
- Collaborators: `/settings/access`
- Visibility: `/settings` (Danger Zone)

---

## 🆘 Problemas Comuns

### "Cannot push to protected branch"

**Causa:** Tentou fazer push direto para `main` ou `develop`

**Solução:** Crie uma feature branch e faça PR

```bash
git checkout -b feature/minha-feature
git push -u origin feature/minha-feature
# Depois crie PR no GitHub
```

### "Required status checks must pass"

**Causa:** CI/CD não passou

**Solução:** Corrija os erros e faça novo commit

### "Pull request requires approval"

**Causa:** Configurado para exigir aprovação

**Solução:** Peça para outro desenvolvedor revisar ou ajuste as regras

---

**Criado em**: 2026-05-17  
**Status**: ✅ Repositórios prontos - Configure proteção agora!
