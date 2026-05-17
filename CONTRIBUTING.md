# 🌿 Guia de Contribuição — CodeEngine Learn

Este documento define o **fluxo Git/GitHub** oficial do projeto. Toda
alteração no código deve seguir este guia.

---

## 🌳 1. Estrutura de Branches

```
main          ← versão estável (produção). Sempre deployable.
 │
 └── develop  ← integração contínua de features
       │
       ├── feature/<descricao>   ← novas funcionalidades
       ├── fix/<descricao>       ← correções não-urgentes
       └── hotfix/<descricao>    ← correções URGENTES em produção
                                   (criadas a partir da main)
```

### Regras de ouro

1. ❌ **NUNCA** faça commits diretos em `main`.
2. ❌ **NUNCA** faça commits diretos em `develop`.
3. ✅ Toda alteração nasce em uma branch própria.
4. ✅ Toda branch só entra em `develop` ou `main` via **Pull Request**.
5. ✅ `main` só recebe merges vindos de `develop` (release) ou `hotfix/*`.

---

## 📛 2. Nomenclatura das Branches

| Tipo      | Padrão                        | Exemplo                          |
| --------- | ----------------------------- | -------------------------------- |
| Feature   | `feature/<kebab-case>`        | `feature/checkout-stripe-apple`  |
| Bug fix   | `fix/<kebab-case>`            | `fix/navbar-mobile-overflow`     |
| Hotfix    | `hotfix/<kebab-case>`         | `hotfix/webhook-stripe-500`      |
| Refactor  | `refactor/<kebab-case>`       | `refactor/product-page-split`    |
| Docs      | `docs/<kebab-case>`           | `docs/contributing-update`       |
| Chore     | `chore/<kebab-case>`          | `chore/upgrade-react-19`         |

---

## 🔄 3. Fluxo de Trabalho Padrão

### 3.1 Feature (fluxo principal)

```bash
# 1. Atualize seu develop local
git checkout develop
git pull origin develop

# 2. Crie sua branch
git checkout -b feature/minha-feature

# 3. Trabalhe e faça commits organizados (Conventional Commits)
git add .
git commit -m "feat(product): adiciona galeria de imagens"

# 4. Envie para o GitHub
git push -u origin feature/minha-feature

# 5. Abra um Pull Request no GitHub: feature/minha-feature → develop
# 6. Após revisão e aprovação → merge (Squash recomendado)
# 7. Apague a branch remota (botão no GitHub)
git checkout develop
git pull origin develop
git branch -d feature/minha-feature
```

### 3.2 Release (develop → main)

```bash
# Quando o develop está estável e pronto para produção
git checkout main
git pull origin main
git merge --no-ff develop -m "release: v1.x.x"
git tag -a v1.x.x -m "Release v1.x.x"
git push origin main --tags
```

### 3.3 Hotfix (produção quebrada)

```bash
git checkout main
git pull origin main
git checkout -b hotfix/descricao-do-bug

# corrige, testa, commita
git commit -m "fix(stripe): corrige webhook 500"

git push -u origin hotfix/descricao-do-bug
# Abra 2 PRs no GitHub:
#   - hotfix → main
#   - hotfix → develop  (para manter develop sincronizado)
```

---

## 📝 4. Conventional Commits

Formato: `<tipo>(<escopo opcional>): <descrição>`

| Tipo       | Quando usar                                            |
| ---------- | ------------------------------------------------------ |
| `feat`     | Nova funcionalidade visível para o usuário             |
| `fix`      | Correção de bug                                        |
| `docs`     | Apenas documentação                                    |
| `style`    | Formatação, espaços, sem mudança de código             |
| `refactor` | Refatoração sem mudança de comportamento               |
| `perf`     | Melhoria de performance                                |
| `test`     | Adição/ajuste de testes                                |
| `build`    | Mudanças em build / dependências                       |
| `ci`       | Mudanças em CI/CD (GitHub Actions)                     |
| `chore`    | Tarefas auxiliares (configs, scripts)                  |
| `revert`   | Reverter um commit anterior                            |

**Exemplos válidos:**

```
feat(auth): adiciona login com Google
fix(checkout): corrige cálculo de cupom de desconto
docs(readme): atualiza instruções de setup
refactor(navbar): extrai menu mobile para componente próprio
ci: adiciona workflow de build no PR
chore(deps): atualiza vite para 6.2.3
```

---

## 🔒 5. Proteção de Branches (configurar no GitHub)

Em **Settings → Branches → Add rule**, adicionar para `main` e `develop`:

- ✅ Require a pull request before merging
- ✅ Require approvals: **1** (mínimo)
- ✅ Require status checks to pass before merging
  - `CI / lint-and-build`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings
- ❌ Allow force pushes — **DESLIGADO**
- ❌ Allow deletions — **DESLIGADO**

---

## 🧪 6. Pull Request — Checklist

Antes de marcar como "Ready for review":

- [ ] O código compila (`npm run lint` / `npm run build`).
- [ ] Não há `console.log` esquecidos.
- [ ] Não há segredos ou `.env` commitados.
- [ ] A descrição do PR explica **o quê** e **por quê**.
- [ ] Screenshots para mudanças visuais.
- [ ] Atualizei a documentação se necessário.

---

## 🆘 7. FAQ rápido

**"Esqueci e commitei na develop direto."**
→ `git reset --soft HEAD~1` → crie a branch certa → recommit.

**"Quero atualizar minha branch com o develop mais recente."**
```bash
git checkout feature/minha-feature
git fetch origin
git rebase origin/develop          # preferido (histórico linear)
# ou: git merge origin/develop     # se rebase não for possível
```

**"Conflito de merge."**
→ Resolva manualmente, `git add <arquivos>`, `git rebase --continue`
(ou `git commit` se for merge).
