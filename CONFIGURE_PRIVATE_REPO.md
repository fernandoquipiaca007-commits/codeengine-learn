# 🔒 Configurar Repositório Privado - CodeEngine API

## ⚠️ Importante: Segurança

O repositório **codeengine-api** (backend) **DEVE** ser privado porque contém:
- Lógica de processamento de pagamentos Stripe
- Webhooks sensíveis
- Código de integração com APIs
- Estrutura de segurança do sistema

---

## 🔐 Qual Repositório Deve Ser Privado?

### ✅ Recomendação de Visibilidade

| Repositório | Visibilidade | Motivo |
|-------------|--------------|--------|
| **codeengine-api** | 🔒 **PRIVADO** | Contém lógica de pagamento e webhooks |
| codeengine-learn | 🌐 Público ou Privado | Frontend - sua escolha |
| codeengine-admin | 🔒 Privado (recomendado) | Painel administrativo |

---

## 📋 Passo a Passo: Tornar Repositório Privado

### Opção 1: Via Interface Web do GitHub (Mais Fácil)

1. **Acesse o repositório:**
   - https://github.com/fernandoquipiaca007-commits/codeengine-api

2. **Vá em Settings:**
   - Clique na aba **Settings** (⚙️)

3. **Role até o final da página:**
   - Procure a seção **Danger Zone** (zona vermelha)

4. **Clique em "Change repository visibility":**
   - Clique no botão **Change visibility**

5. **Selecione "Make private":**
   - Escolha **Make private**
   - Digite o nome do repositório para confirmar: `fernandoquipiaca007-commits/codeengine-api`
   - Clique em **I understand, change repository visibility**

6. **Pronto!** ✅
   - O repositório agora é privado
   - Apenas você e colaboradores autorizados podem acessá-lo

---

### Opção 2: Via GitHub CLI

Se você tem o GitHub CLI instalado:

```bash
# Tornar o repositório privado
gh repo edit fernandoquipiaca007-commits/codeengine-api --visibility private

# Verificar
gh repo view fernandoquipiaca007-commits/codeengine-api
```

---

## 🔍 Verificar se o Repositório é Privado

### Via Web
1. Acesse: https://github.com/fernandoquipiaca007-commits/codeengine-api
2. Você verá um ícone de cadeado 🔒 ao lado do nome
3. Aparecerá a palavra **Private** no topo

### Via CLI
```bash
gh repo view fernandoquipiaca007-commits/codeengine-api --json visibility
```

---

## 👥 Adicionar Colaboradores (Opcional)

Se você quiser dar acesso a outras pessoas:

### Via Web
1. Vá em **Settings** > **Collaborators**
2. Clique em **Add people**
3. Digite o username do GitHub
4. Escolha a permissão:
   - **Read**: Apenas visualizar
   - **Write**: Pode fazer push
   - **Admin**: Controle total

### Via CLI
```bash
gh repo add-collaborator fernandoquipiaca007-commits/codeengine-api USERNAME --permission write
```

---

## 🚨 Verificação de Segurança

### Antes de Tornar Privado, Verifique:

1. **Nenhum arquivo sensível foi commitado:**
   ```bash
   cd c:\Users\Dell\Documents\codeengine1.2\backend
   git log --all --full-history -- .env
   git log --all --full-history -- .env.backend
   ```

2. **O .gitignore está correto:**
   ```
   .env
   .env.backend
   .env.local
   node_modules/
   *.log
   ```

3. **Nenhuma chave API no código:**
   ```bash
   # Procurar por possíveis chaves
   grep -r "sk_live_" .
   grep -r "sk_test_" .
   grep -r "STRIPE_SECRET" .
   ```

---

## 🔄 Impacto de Tornar Privado

### ✅ O que continua funcionando:
- Seus pushes e pulls normais
- Scripts `push-all.ps1` e `push-with-message.ps1`
- Clones do repositório (se você estiver autenticado)
- GitHub Actions (se configurado)

### ⚠️ O que muda:
- Outras pessoas não podem ver o código
- Precisa de autenticação para clonar
- Não aparece em buscas públicas do GitHub
- Badges públicos não funcionam

---

## 🔑 Autenticação para Repositórios Privados

### Personal Access Token

Para fazer push/pull de repositórios privados, você precisa de um token:

1. **Gerar token:**
   - Acesse: https://github.com/settings/tokens
   - Clique em **Generate new token (classic)**
   - Nome: "CodeEngine Private Repos"
   - Selecione escopos:
     - ✅ `repo` (acesso completo a repositórios privados)
   - Clique em **Generate token**
   - **COPIE O TOKEN** (você não verá novamente!)

2. **Usar o token:**
   - Quando o Git pedir senha, use o token
   - Ou configure o Git Credential Manager

### SSH Keys (Alternativa)

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "fernandoquipiaca007@gmail.com"

# Adicionar ao ssh-agent
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub:
# Settings > SSH and GPG keys > New SSH key
```

---

## 📊 Recomendação Final de Visibilidade

```
┌─────────────────────────────────────────────┐
│  REPOSITÓRIO          │  VISIBILIDADE       │
├─────────────────────────────────────────────┤
│  codeengine-api       │  🔒 PRIVADO         │
│  (Backend/Stripe)     │  (OBRIGATÓRIO)      │
├─────────────────────────────────────────────┤
│  codeengine-admin     │  🔒 Privado         │
│  (Painel Admin)       │  (Recomendado)      │
├─────────────────────────────────────────────┤
│  codeengine-learn     │  🌐 Público         │
│  (Frontend)           │  (Sua escolha)      │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist de Segurança

Antes de tornar o repositório privado:

- [ ] Verificar que não há arquivos .env commitados
- [ ] Confirmar que .gitignore está correto
- [ ] Verificar que não há chaves API no código
- [ ] Confirmar que secrets estão em variáveis de ambiente
- [ ] Revisar histórico de commits para dados sensíveis

Depois de tornar privado:

- [ ] Verificar que o ícone 🔒 aparece no GitHub
- [ ] Testar push/pull com autenticação
- [ ] Adicionar colaboradores necessários
- [ ] Configurar branch protection rules

---

## 🆘 Problemas Comuns

### "Repository not found" ao fazer push

**Causa:** Repositório privado sem autenticação adequada

**Solução:**
```bash
# Use Personal Access Token como senha
# Ou configure SSH keys
```

### "Permission denied"

**Causa:** Sem permissão de escrita

**Solução:**
- Verifique se você é o owner do repositório
- Ou peça permissão de write ao owner

---

## 📞 Comandos Úteis

```bash
# Ver visibilidade atual
gh repo view fernandoquipiaca007-commits/codeengine-api --json visibility

# Tornar privado
gh repo edit fernandoquipiaca007-commits/codeengine-api --visibility private

# Tornar público (se necessário)
gh repo edit fernandoquipiaca007-commits/codeengine-api --visibility public

# Listar colaboradores
gh repo list-collaborators fernandoquipiaca007-commits/codeengine-api
```

---

## 🎯 Ação Recomendada

**Execute agora:**

1. Acesse: https://github.com/fernandoquipiaca007-commits/codeengine-api/settings
2. Role até **Danger Zone**
3. Clique em **Change visibility**
4. Selecione **Make private**
5. Confirme digitando o nome do repositório

**Pronto!** Seu backend estará protegido. 🔒

---

**Criado em**: 2026-05-17  
**Prioridade**: 🔴 ALTA (Segurança)  
**Status**: ⚠️ Ação Necessária
