# 🔑 Como Obter a Chave ANON do Supabase

## ⚠️ Problema Atual

As telas do Frontend e Admin estão em branco porque falta a **chave ANON do Supabase**.

---

## 📋 Passo a Passo

### 1. Acessar o Dashboard do Supabase
1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard
3. Faça login na sua conta

### 2. Selecionar o Projeto
1. Na lista de projetos, clique no projeto: **ffdqqiunkzhtgbgaojay**
2. Ou acesse diretamente: https://supabase.com/dashboard/project/ffdqqiunkzhtgbgaojay

### 3. Ir para Configurações de API
1. No menu lateral, clique em **Settings** (⚙️)
2. Clique em **API**

### 4. Copiar as Chaves
Você verá duas seções importantes:

#### Project URL
```
https://ffdqqiunkzhtgbgaojay.supabase.co
```
✅ Já configurado!

#### API Keys
Você verá duas chaves:

**anon / public key** (esta é a que precisamos!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTc0MTEsImV4cCI6MjA5NDE3MzQxMX0.XXXXXXXXXXXXXXX
```

**service_role key** (secreta - já configurada no backend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5NzQxMSwiZXhwIjoyMDk0MTczNDExfQ.Opu0mnFzGYmTx9qdngJpTYzWgAynMWFUgXCei2KWDqs
```
✅ Já configurado no backend!

---

## 🔧 Atualizar os Arquivos .env

### Frontend (.env)
Abra o arquivo:
```powershell
notepad "C:\Users\Dell\Documents\front codeengine\codeengine1.2\.env"
```

Substitua a linha:
```env
VITE_SUPABASE_ANON_KEY=COLOQUE_SUA_CHAVE_ANON_AQUI
```

Por:
```env
VITE_SUPABASE_ANON_KEY=sua_chave_anon_copiada_do_supabase
```

### Admin (.env)
Abra o arquivo:
```powershell
notepad "C:\Users\Dell\Documents\front codeengine\codeengine1.2\admin\.env"
```

Substitua a linha:
```env
VITE_SUPABASE_ANON_KEY=COLOQUE_SUA_CHAVE_ANON_AQUI
```

Por:
```env
VITE_SUPABASE_ANON_KEY=sua_chave_anon_copiada_do_supabase
```

---

## 🔄 Reiniciar os Servidores

Após atualizar os arquivos .env, os servidores Vite devem reiniciar automaticamente.

Se não reiniciarem, você pode:

1. **Parar os servidores** (Ctrl+C em cada terminal)
2. **Iniciar novamente:**

```powershell
# Frontend
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2"
npm run dev

# Admin
cd "C:\Users\Dell\Documents\front codeengine\codeengine1.2\admin"
npm run dev
```

---

## ✅ Verificar se Funcionou

Após configurar a chave ANON:

1. Abra http://localhost:3000 (Frontend)
2. Abra http://localhost:5174 (Admin)
3. As telas devem carregar normalmente

---

## 🆘 Se Ainda Estiver em Branco

### Verificar o Console do Navegador
1. Pressione **F12** no navegador
2. Vá na aba **Console**
3. Procure por erros em vermelho
4. Copie a mensagem de erro e me envie

### Verificar os Logs dos Servidores
Os servidores estão rodando nos terminais:
- Terminal 5: Frontend
- Terminal 6: Admin

Verifique se há erros nos logs.

---

## 📝 Resumo

**O que falta:**
- ❌ Chave ANON do Supabase no Frontend
- ❌ Chave ANON do Supabase no Admin

**Como resolver:**
1. Acesse https://supabase.com/dashboard
2. Vá em Settings → API
3. Copie a chave **anon / public**
4. Cole nos arquivos `.env` do Frontend e Admin
5. Aguarde os servidores reiniciarem

---

**Após configurar a chave ANON, as telas devem carregar normalmente! 🎉**
