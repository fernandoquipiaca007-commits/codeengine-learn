# 🚀 Início Rápido - CodeEngine

## ✅ Status da Instalação

Todos os repositórios foram clonados com sucesso em:
**`C:\Users\Dell\Documents\front codeengine\codeengine1.2`**

---

## 📦 Instalação das Dependências

Execute os comandos abaixo para instalar as dependências de cada projeto:

### 1️⃣ Frontend
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2"
npm install
```

### 2️⃣ Admin
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2\admin"
npm install
```

### 3️⃣ Backend
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2\backend"
npm install
```

---

## ⚙️ Configuração das Variáveis de Ambiente

Cada projeto precisa de um arquivo `.env` com as credenciais:

### Frontend
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2"
copy .env.example .env
# Edite o arquivo .env com suas credenciais
```

### Admin
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2\admin"
copy .env.example .env
# Edite o arquivo .env com suas credenciais
```

### Backend
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2\backend"
copy .env.example .env
# Edite o arquivo .env com suas credenciais
```

---

## 🏃 Executando os Projetos

Abra **3 terminais diferentes** e execute:

### Terminal 1 - Backend (Porta 3000)
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2\backend"
npm run dev
```

### Terminal 2 - Frontend (Porta 5173)
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2"
npm run dev
```

### Terminal 3 - Admin (Porta 5174)
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2\admin"
npm run dev
```

---

## 🌐 URLs de Acesso

Após iniciar os servidores:

- **Frontend (Loja):** http://localhost:5173
- **Admin Panel:** http://localhost:5174
- **Backend API:** http://localhost:3000

---

## 🔧 Scripts Úteis

### Verificar Status dos Repositórios
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2"
.\verificar-repos.ps1
```

### Fazer Push em Todos os Repositórios
```powershell
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2"
.\push-all.ps1
```

---

## 📋 Checklist de Configuração

- [ ] Clonar repositórios ✅ (Concluído)
- [ ] Instalar dependências (npm install em cada projeto)
- [ ] Configurar arquivos .env
- [ ] Configurar Supabase (URL, keys)
- [ ] Configurar Stripe (API keys)
- [ ] Configurar Resend (API key para emails)
- [ ] Executar migrações do banco de dados
- [ ] Testar login/cadastro
- [ ] Testar criação de produtos
- [ ] Testar checkout e pagamento

---

## 🆘 Precisa de Ajuda?

Consulte os seguintes arquivos para mais informações:

- `ESTRUTURA_REPOSITORIOS.md` - Estrutura completa do projeto
- `README.md` - Documentação principal
- `QUICK_START.md` - Guia de início rápido detalhado
- `TROUBLESHOOTING.md` - Solução de problemas comuns

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se todas as dependências foram instaladas
2. Confirme se os arquivos .env estão configurados corretamente
3. Verifique se as portas 3000, 5173 e 5174 estão disponíveis
4. Consulte os logs de erro em cada terminal

---

**Boa sorte com o desenvolvimento! 🎉**
