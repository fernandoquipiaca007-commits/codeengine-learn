# 🚀 GitHub Setup — Próximos passos

Seu repositório local já está pronto. Falta só conectá-lo ao GitHub.

---

## ✅ O que já foi feito (localmente)

- [x] Git inicializado com branch padrão `main`
- [x] Branch `develop` criada
- [x] `.gitignore` profissional configurado
- [x] `CONTRIBUTING.md` com fluxo completo de branches/PR
- [x] Templates de Pull Request e Issues (`.github/`)
- [x] CI/CD: `ci.yml` (lint + build), `commit-lint.yml`, `backup.yml`
- [x] `CODEOWNERS` (precisa editar com seu @usuário)
- [x] Primeiro commit feito

---

## 📡 1. Criar o repositório no GitHub

### Opção A — Via navegador (mais simples)

1. Acesse https://github.com/new
2. **Repository name:** `codeengine-learn` (ou o nome que preferir)
3. **Description:** "Plataforma digital de cursos e produtos com Stripe + Supabase"
4. **Private** ✅ (recomendado enquanto desenvolve)
5. ⚠️ **NÃO** marque "Add README", "Add .gitignore" ou "Add license" — já temos
6. Clique em **Create repository**

### Opção B — Via GitHub CLI (se tiver `gh` instalado)

```powershell
gh repo create codeengine-learn --private --source=. --remote=origin
```

---

## 🔗 2. Conectar o repositório local ao GitHub

Substitua `SEU-USUARIO` pelo seu usuário GitHub:

```powershell
cd c:\Users\Dell\Documents\codeengine1.2

# Adiciona o remoto
git remote add origin https://github.com/SEU-USUARIO/codeengine-learn.git

# Confirma
git remote -v

# Envia main (cria a branch remota)
git push -u origin main

# Envia develop
git push -u origin develop
```

A partir daqui, **todo `git push` envia automaticamente para o GitHub** —
ele já é o seu backup remoto.

---

## 🛡️ 3. Configurar Proteção de Branch (CRÍTICO)

No GitHub, vá em **Settings → Branches → Add branch protection rule**.

### Regra para `main`:

| Configuração | Valor |
|---|---|
| Branch name pattern | `main` |
| Require a pull request before merging | ✅ |
| Require approvals | ✅ (mínimo 1) |
| Dismiss stale approvals on new commits | ✅ |
| Require status checks to pass | ✅ |
| Status checks: `Lint & Build (Frontend)` | ✅ |
| Require branches to be up to date | ✅ |
| Require conversation resolution | ✅ |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

### Regra para `develop`:

Mesma configuração da `main`, exceto:
- Require approvals pode ser **0** se você trabalha sozinho

---

## 👤 4. Atualizar CODEOWNERS

Edite `.github/CODEOWNERS` e substitua `@SEU-USUARIO-GITHUB` pelo seu handle:

```
*  @fernandojr     (ou seu usuário real)
```

Depois:

```powershell
git checkout -b chore/codeowners-setup
# (editar arquivo)
git add .github/CODEOWNERS
git commit -m "chore(ci): set real github handle in CODEOWNERS"
git push -u origin chore/codeowners-setup
# Abra PR no GitHub: chore/codeowners-setup → develop
```

🎉 **Esse será o primeiro PR seguindo o fluxo correto!**

---

## 🔐 5. Configurar Secrets do GitHub (para CI)

Em **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | chave anônima do Supabase |

Sem esses secrets o build no CI continua funcionando (com placeholder),
mas com eles o bundle gerado é representativo do produção.

---

## 🌳 6. Fluxo diário (cheatsheet)

```powershell
# Toda manhã: pegar últimas mudanças
git checkout develop
git pull origin develop

# Começar uma nova tarefa
git checkout -b feature/nome-da-tarefa

# Durante o trabalho
git add .
git commit -m "feat(escopo): descrição curta"
git push -u origin feature/nome-da-tarefa

# Abrir PR no GitHub → develop
# Após aprovado, mergear na interface do GitHub
```

---

## 🔄 7. Como funciona o BACKUP

| Camada | Como funciona |
|---|---|
| **Push para GitHub** | Cada `git push` salva tudo nos servidores do GitHub (backup imediato) |
| **Snapshots diários** | `.github/workflows/backup.yml` cria uma tag `snapshot/YYYY.MM.DD` todo dia às 03:00 UTC |
| **Artifacts de build** | Cada CI guarda o `dist/` por 7 dias |
| **Histórico Git** | Cada commit é uma versão restaurável (`git checkout <hash>`) |
| **Releases** | Tags `v1.0.0`, `v1.1.0` marcam versões oficiais |

### Rollback rápido

```powershell
# Voltar a um snapshot específico
git checkout snapshot/2026.05.17

# Ou criar branch a partir dele para corrigir
git checkout -b hotfix/restore-from-snapshot snapshot/2026.05.17
```

---

## 📦 8. Primeira Release (quando estiver estável)

```powershell
git checkout main
git merge --no-ff develop -m "release: v1.0.0"
git tag -a v1.0.0 -m "Primeira versão estável"
git push origin main --tags
```

No GitHub, vá em **Releases → Draft a new release**, selecione a tag `v1.0.0`
e descreva as funcionalidades.

---

## ❓ Dúvidas comuns

**"Posso pular o `develop` e enviar feature direto para `main`?"**
Não. Esse é exatamente o ponto da estrutura: nada chega em produção sem
passar por `develop` (exceto `hotfix/*`).

**"O `git push` está sendo o backup?"**
Sim. Cada push espelha seu código nos servidores do GitHub. Se seu HD
quebrar, basta `git clone` em outra máquina.

**"O CI vai bloquear meus PRs?"**
Sim — e isso é bom. Ele garante que nada quebrado entra em `develop` ou `main`.
