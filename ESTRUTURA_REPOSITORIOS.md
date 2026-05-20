# Estrutura dos Repositórios CodeEngine

## ✅ Repositórios Clonados com Sucesso

Todos os repositórios foram clonados na sua máquina local em:
**`C:\Users\Dell\Documents\front codeengine\codeengine1.2`**

---

## 📁 Estrutura de Diretórios

```
codeengine1.2/           ← git repo: codeengine-learn (frontend)
├── src/                 ← React + Vite (frontend store)
├── admin/               ← git repo: codeengine-admin (admin panel separado)
├── backend/             ← git repo: codeengine-api (Express API)
│   ├── api/             ← REST endpoints
│   ├── lib/             ← Business logic services
│   └── supabase/        ← SQL migrations
└── supabase/            ← SQL schemas (referência, NÃO executar daqui)
```

---

## 🔗 Repositórios GitHub

| Repo | URL | Branch Ativa | Status |
|------|-----|--------------|--------|
| **Frontend** | https://github.com/fernandoquipiaca007-commits/codeengine-learn | `fix/critical-system-stabilization` | ✅ Clonado |
| **Admin** | https://github.com/fernandoquipiaca007-commits/codeengine-admin | `main` | ✅ Clonado |
| **Backend/API** | https://github.com/fernandoquipiaca007-commits/codeengine-api | `fix/critical-system-stabilization` | ✅ Clonado |

---

## 🚀 Próximos Passos

### 1. Frontend (React + Vite)
```powershell
cd codeengine1.2
npm install
# Configurar .env com suas credenciais
npm run dev
```

### 2. Admin Panel
```powershell
cd codeengine1.2/admin
npm install
# Configurar .env com suas credenciais
npm run dev
```

### 3. Backend/API (Express)
```powershell
cd codeengine1.2/backend
npm install
# Configurar .env com suas credenciais
npm run dev
```

---

## ⚙️ Configuração

Cada repositório possui arquivos `.env.example` que devem ser copiados para `.env` e configurados com suas credenciais:

- **Supabase** (URL, anon key, service role key)
- **Stripe** (chaves de API)
- **Resend** (chave de API para emails)
- Outras variáveis específicas de cada serviço

---

## 📝 Notas Importantes

1. **Cada diretório é um repositório Git independente**
   - `codeengine1.2/` → repositório frontend
   - `codeengine1.2/admin/` → repositório admin
   - `codeengine1.2/backend/` → repositório backend

2. **Branches Ativas**
   - Frontend e Backend estão na branch `fix/critical-system-stabilization`
   - Admin está na branch `main`

3. **Commits e Push**
   - Faça commits em cada repositório separadamente
   - Use os scripts PowerShell disponíveis no frontend para operações em massa

---

## 🔧 Scripts Úteis (Frontend)

O repositório frontend possui scripts PowerShell para gerenciar todos os repos:

- `push-all.ps1` - Push em todos os repositórios
- `push-with-message.ps1` - Commit e push com mensagem
- `status-all.ps1` - Verificar status de todos os repos

---

## 📚 Documentação

Consulte os arquivos `.md` em cada repositório para documentação específica:

- `README.md` - Visão geral do projeto
- `QUICK_START.md` - Guia de início rápido
- `TROUBLESHOOTING.md` - Solução de problemas
- E muitos outros guias específicos...

---

**Data de Clonagem:** 17/05/2026
**Localização:** `C:\Users\Dell\Documents\front codeengine\codeengine1.2`
