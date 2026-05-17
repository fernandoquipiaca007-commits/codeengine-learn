# 🚀 Multi-Repo Setup — CodeEngine Learn

Estrutura final: **3 repositórios independentes** na sua conta
`fernandoquipiaca007@gmail.com`, todos **privados**.

| Repo no GitHub             | Pasta local                                          | Stack                          |
| -------------------------- | ---------------------------------------------------- | ------------------------------ |
| `codeengine-learn`         | `c:\Users\Dell\Documents\codeengine1.2\`             | React 19 + Vite + Tailwind v4  |
| `codeengine-admin`         | `c:\Users\Dell\Documents\codeengine1.2\admin\`       | React 18 + Vite + React Router |
| `codeengine-api`           | `c:\Users\Dell\Documents\codeengine1.2\backend\`     | Express + Stripe + Supabase    |

> 📦 A pasta `supabase/` foi movida para dentro de `backend/supabase/`
> (faz parte do repo `codeengine-api`).

---

## ✅ Já está pronto localmente

- [x] Git inicializado em cada um dos 3 diretórios
- [x] Branches `main` e `develop` criadas em cada repo
- [x] `user.email` configurado: `fernandoquipiaca007@gmail.com`
- [x] `.gitignore`, `CONTRIBUTING.md`, CI workflows (`ci.yml`,
      `commit-lint.yml`) e PR templates em cada repo
- [x] Repo raiz ignora `admin/` e `backend/` (eles têm git próprio)
- [x] Primeiro commit já feito em cada um

---

## 📡 1. Criar os 3 repositórios no GitHub

Logue em https://github.com com `fernandoquipiaca007@gmail.com` e crie 3 repos:

| # | Nome                | Description                                         | Visibility |
|---|---------------------|-----------------------------------------------------|------------|
| 1 | `codeengine-learn`  | Plataforma digital — Frontend (loja, PWA)           | Private    |
| 2 | `codeengine-admin`  | Painel administrativo — gestão de produtos          | Private    |
| 3 | `codeengine-api`    | Backend Express + Stripe + schemas Supabase         | Private    |

⚠️ **NÃO** marque "Add README", "Add .gitignore" ou "Add license" — já temos.

---

## 🔗 2. Conectar e fazer o primeiro push

Cole no PowerShell, **substituindo `<seu-usuario>`** pelo seu handle GitHub:

### Frontend (`codeengine-learn`)
```powershell
cd c:\Users\Dell\Documents\codeengine1.2
git remote add origin https://github.com/<seu-usuario>/codeengine-learn.git
git push -u origin main
git push -u origin develop
```

### Admin (`codeengine-admin`)
```powershell
cd c:\Users\Dell\Documents\codeengine1.2\admin
git remote add origin https://github.com/<seu-usuario>/codeengine-admin.git
git push -u origin main
git push -u origin develop
```

### Backend / API (`codeengine-api`)
```powershell
cd c:\Users\Dell\Documents\codeengine1.2\backend
git remote add origin https://github.com/<seu-usuario>/codeengine-api.git
git push -u origin main
git push -u origin develop
```

Pronto — **todo `git push` daqui em diante já vira backup no GitHub.**

---

## 🛡️ 3. Proteção de branch (faça nos 3 repos)

Em cada repositório, vá em **Settings → Branches → Add branch protection rule**.

**Regra para `main`:**

- ✅ Require a pull request before merging
- ✅ Require approvals: **1**
- ✅ Dismiss stale approvals on new commits
- ✅ Require status checks to pass:
  - `Lint & Build (Frontend)` (no codeengine-learn)
  - `Lint & Build (Admin Panel)` (no codeengine-admin)
  - `Type-check (Backend API)` (no codeengine-api)
- ✅ Require branches to be up to date
- ❌ Allow force pushes — desligado
- ❌ Allow deletions — desligado

**Regra para `develop`:** igual à `main`, mas approvals pode ser 0
(se você trabalha sozinho).

---

## 🔐 4. Secrets do GitHub (para o CI)

Em cada repo: **Settings → Secrets and variables → Actions → New secret**.

| Repo               | Secret necessário                                     |
| ------------------ | ----------------------------------------------------- |
| `codeengine-learn` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`         |
| `codeengine-admin` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`         |
| `codeengine-api`   | (opcional) `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY` |

Sem os secrets o CI ainda passa (usa placeholders), mas com eles o build
representa produção.

---

## 🌳 5. Fluxo diário (igual nos 3 repos)

```powershell
# Toda manhã, no repo onde for trabalhar:
git checkout develop
git pull origin develop

# Nova tarefa
git checkout -b feature/minha-tarefa

# Trabalha…
git add .
git commit -m "feat(escopo): descrição curta"
git push -u origin feature/minha-tarefa

# Abre PR no GitHub: feature/minha-tarefa → develop
# CI roda, reviewer aprova, merge (squash).
```

### Quando uma feature toca múltiplos repos

Exemplo: nova feature de checkout precisa de mudança no frontend
**e** no backend. Crie **branches com o mesmo nome** nos dois repos
(`feature/checkout-apple-pay`), abra um PR em cada e referencie um no
outro na descrição.

---

## 🔄 6. Como funciona o BACKUP

| Camada                | Como funciona                                                                          |
| --------------------- | -------------------------------------------------------------------------------------- |
| **Push para GitHub**  | Cada `git push` espelha todo o histórico nos servidores do GitHub                      |
| **Snapshots diários** | `.github/workflows/backup.yml` cria tag `snapshot/YYYY.MM.DD` todo dia (só `codeengine-learn`; podemos replicar nos outros se quiser) |
| **CI artifacts**      | Cada build guarda `dist/` por 7 dias                                                   |
| **Histórico Git**     | Cada commit é uma versão restaurável (`git checkout <hash>`)                           |
| **Releases**          | Tags `v1.0.0` marcam versões oficiais por repo                                         |

### Rollback rápido
```powershell
git checkout snapshot/2026.05.17                       # ver código antigo
git checkout -b hotfix/restore snapshot/2026.05.17    # corrigir a partir dele
```

---

## 📦 7. Primeira release (quando estável)

Em cada repo:
```powershell
git checkout main
git merge --no-ff develop -m "release: v1.0.0"
git tag -a v1.0.0 -m "Primeira versão estável"
git push origin main --tags
```

---

## 🧹 8. Verificação rápida

Confira que cada repo aponta para o GitHub correto:

```powershell
cd c:\Users\Dell\Documents\codeengine1.2;          git remote -v
cd c:\Users\Dell\Documents\codeengine1.2\admin;    git remote -v
cd c:\Users\Dell\Documents\codeengine1.2\backend;  git remote -v
```

Cada um deve mostrar o `origin` apontando para
`github.com/<seu-usuario>/codeengine-*.git`.

---

## ❓ FAQ

**"O autor dos commits ficou correto?"**
Sim — `git config user.email` foi setado como `fernandoquipiaca007@gmail.com`
em cada repo (local, não global).

**"Posso clonar tudo em outra máquina?"**
Sim:
```powershell
git clone https://github.com/<seu-usuario>/codeengine-learn.git
cd codeengine-learn
git clone https://github.com/<seu-usuario>/codeengine-admin.git admin
git clone https://github.com/<seu-usuario>/codeengine-api.git   backend
```

**"Por que `admin/` e `backend/` somem do `git status` do repo raiz?"**
Porque o `.gitignore` do `codeengine-learn` os exclui — eles são repos
independentes com vida própria.
