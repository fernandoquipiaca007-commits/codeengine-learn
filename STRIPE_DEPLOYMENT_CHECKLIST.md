# ✅ STRIPE INTEGRATION - DEPLOYMENT CHECKLIST

## 📋 PRÉ-DEPLOYMENT

### 🔧 Configuração Inicial

- [ ] **Conta Stripe criada**
  - [ ] Conta verificada
  - [ ] Informações bancárias configuradas
  - [ ] Documentos enviados (se necessário)

- [ ] **Chaves Stripe obtidas**
  - [ ] Secret Key (sk_test_...)
  - [ ] Publishable Key (pk_test_...)
  - [ ] Webhook Secret (whsec_...)

- [ ] **Variáveis de ambiente configuradas**
  - [ ] `.env.local` criado
  - [ ] Todas as chaves preenchidas
  - [ ] URLs configuradas

### 🗄️ Database Setup

- [ ] **Schema SQL executado**
  - [ ] `stripe-integration-schema.sql` ✓
  - [ ] `stripe-functions.sql` ✓
  - [ ] Verificar tabelas criadas

- [ ] **Verificar tabelas**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name LIKE '%stripe%';
  ```

- [ ] **Verificar funções**
  ```sql
  SELECT proname FROM pg_proc 
  WHERE proname LIKE '%coupon%' 
  OR proname LIKE '%purchase%';
  ```

### 📦 Dependências

- [ ] **Backend dependencies instaladas**
  ```bash
  cd backend
  npm install
  ```

- [ ] **Verificar instalação**
  - [ ] stripe
  - [ ] express
  - [ ] cors
  - [ ] @supabase/supabase-js
  - [ ] tsx

---

## 🧪 TESTING

### 🔬 Testes Locais

- [ ] **Serviços iniciados**
  - [ ] Backend API rodando (porta 3001)
  - [ ] Admin Dashboard rodando (porta 5174)
  - [ ] Store Frontend rodando (porta 3000)

- [ ] **Health check**
  ```bash
  curl http://localhost:3001/health
  ```

### 🛍️ Teste de Produto

- [ ] **Criar produto teste**
  - [ ] Nome: "Produto Teste"
  - [ ] Preço: 49.90
  - [ ] Descrição preenchida
  - [ ] Imagem adicionada
  - [ ] Categoria selecionada

- [ ] **Sincronizar com Stripe**
  - [ ] Clicar "Sincronizar com Stripe"
  - [ ] Verificar sucesso
  - [ ] Confirmar IDs salvos

- [ ] **Verificar no Stripe Dashboard**
  - [ ] Produto aparece
  - [ ] Preço correto
  - [ ] Metadata presente

### 💳 Teste de Checkout

- [ ] **Iniciar checkout**
  - [ ] Clicar "Comprar Agora"
  - [ ] Redireciona para Stripe
  - [ ] Formulário carrega

- [ ] **Completar pagamento teste**
  - [ ] Cartão: 4242 4242 4242 4242
  - [ ] Data: Qualquer futura
  - [ ] CVC: Qualquer 3 dígitos
  - [ ] CEP: Qualquer

- [ ] **Verificar sucesso**
  - [ ] Redireciona para /success
  - [ ] Detalhes corretos
  - [ ] Mensagem de confirmação

### 🔔 Teste de Webhook

- [ ] **Configurar Stripe CLI**
  ```bash
  stripe listen --forward-to localhost:3001/api/stripe/webhook
  ```

- [ ] **Trigger evento teste**
  ```bash
  stripe trigger checkout.session.completed
  ```

- [ ] **Verificar processamento**
  - [ ] Webhook recebido
  - [ ] Compra criada
  - [ ] Email enviado
  - [ ] Acesso liberado

### 📊 Teste de Analytics

- [ ] **Verificar métricas**
  ```sql
  SELECT * FROM sales_analytics 
  ORDER BY date DESC LIMIT 1;
  ```

- [ ] **Verificar compras**
  ```sql
  SELECT * FROM purchases 
  ORDER BY purchase_date DESC LIMIT 5;
  ```

### 🎟️ Teste de Cupom

- [ ] **Criar cupom teste**
  - [ ] Código: "TESTE10"
  - [ ] Desconto: 10%
  - [ ] Limite: 10 usos

- [ ] **Aplicar no checkout**
  - [ ] Cupom aceito
  - [ ] Desconto aplicado
  - [ ] Valor final correto

---

## 🚀 PRODUCTION DEPLOYMENT

### 🔐 Segurança

- [ ] **Trocar para chaves de produção**
  - [ ] STRIPE_SECRET_KEY=sk_live_...
  - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
  - [ ] Remover chaves de teste

- [ ] **Configurar variáveis de ambiente**
  - [ ] Vercel/Railway configurado
  - [ ] Variáveis secretas protegidas
  - [ ] URLs de produção

- [ ] **SSL configurado**
  - [ ] HTTPS habilitado
  - [ ] Certificado válido
  - [ ] Redirecionamento HTTP → HTTPS

### 🌐 Webhook de Produção

- [ ] **Configurar endpoint**
  - URL: `https://seu-dominio.com/api/stripe/webhook`
  - Eventos selecionados:
    - [ ] checkout.session.completed
    - [ ] payment_intent.succeeded
    - [ ] payment_intent.payment_failed
    - [ ] charge.refunded
    - [ ] invoice.payment_succeeded

- [ ] **Copiar webhook secret**
  - [ ] Atualizar STRIPE_WEBHOOK_SECRET
  - [ ] Testar webhook

- [ ] **Verificar assinatura**
  ```bash
  # Logs do backend devem mostrar:
  # "Webhook signature verified"
  ```

### 📧 Email Configuration

- [ ] **Configurar Resend**
  - [ ] Domínio verificado
  - [ ] DNS configurado
  - [ ] API key válida

- [ ] **Testar envio**
  - [ ] Email de confirmação
  - [ ] Email de falha
  - [ ] Email de reembolso

### 🗄️ Database Production

- [ ] **Backup configurado**
  - [ ] Backup automático Supabase
  - [ ] Retenção configurada
  - [ ] Teste de restore

- [ ] **Performance**
  - [ ] Índices criados
  - [ ] Queries otimizadas
  - [ ] Connection pooling

### 🔍 Monitoring

- [ ] **Logs configurados**
  - [ ] Backend logs
  - [ ] Stripe Dashboard
  - [ ] Supabase logs
  - [ ] Error tracking

- [ ] **Alertas configurados**
  - [ ] Webhook failures
  - [ ] Payment failures
  - [ ] Server errors
  - [ ] High latency

---

## 📊 POST-DEPLOYMENT

### ✅ Verificação Final

- [ ] **Criar produto real**
  - [ ] Produto de produção
  - [ ] Preço real
  - [ ] Imagens finais
  - [ ] Descrição completa

- [ ] **Teste de compra real**
  - [ ] Usar cartão real (pequeno valor)
  - [ ] Verificar fluxo completo
  - [ ] Confirmar email recebido
  - [ ] Validar download

- [ ] **Verificar analytics**
  - [ ] Métricas registrando
  - [ ] Dashboard funcionando
  - [ ] Relatórios corretos

### 📈 Performance Check

- [ ] **Tempo de resposta**
  - [ ] API < 500ms
  - [ ] Checkout < 2s
  - [ ] Webhook < 1s

- [ ] **Uptime**
  - [ ] Monitoramento ativo
  - [ ] 99.9% uptime target
  - [ ] Alertas funcionando

### 🔄 Backup & Recovery

- [ ] **Plano de backup**
  - [ ] Database backup diário
  - [ ] Código versionado (Git)
  - [ ] Configurações documentadas

- [ ] **Plano de recovery**
  - [ ] Procedimento documentado
  - [ ] Teste de restore
  - [ ] Contatos de emergência

---

## 📚 DOCUMENTATION

### 📝 Documentação Interna

- [ ] **README atualizado**
  - [ ] Instruções de setup
  - [ ] Variáveis de ambiente
  - [ ] Comandos úteis

- [ ] **API Documentation**
  - [ ] Endpoints documentados
  - [ ] Exemplos de request/response
  - [ ] Error codes

- [ ] **Runbooks**
  - [ ] Troubleshooting guide
  - [ ] Common issues
  - [ ] Emergency procedures

### 👥 Team Training

- [ ] **Admin training**
  - [ ] Como criar produtos
  - [ ] Como sincronizar Stripe
  - [ ] Como criar cupons
  - [ ] Como ver analytics

- [ ] **Support training**
  - [ ] Como verificar compras
  - [ ] Como processar reembolsos
  - [ ] Como resolver problemas

---

## 🎯 LAUNCH CHECKLIST

### 🚦 Go/No-Go Criteria

- [ ] **Todos os testes passando** ✅
- [ ] **Webhook funcionando** ✅
- [ ] **Email enviando** ✅
- [ ] **Analytics registrando** ✅
- [ ] **Backup configurado** ✅
- [ ] **Monitoring ativo** ✅
- [ ] **Team treinado** ✅
- [ ] **Documentação completa** ✅

### 🎉 Launch Day

- [ ] **Comunicação**
  - [ ] Anunciar lançamento
  - [ ] Email para lista
  - [ ] Posts em redes sociais

- [ ] **Monitoring intensivo**
  - [ ] Primeira hora: check a cada 5min
  - [ ] Primeiro dia: check a cada hora
  - [ ] Primeira semana: check diário

- [ ] **Suporte preparado**
  - [ ] Team disponível
  - [ ] Canais de suporte ativos
  - [ ] FAQ preparado

---

## 🔧 MAINTENANCE

### 📅 Rotina Diária

- [ ] Verificar logs de erro
- [ ] Verificar webhook failures
- [ ] Verificar vendas do dia
- [ ] Responder suporte

### 📅 Rotina Semanal

- [ ] Revisar analytics
- [ ] Verificar performance
- [ ] Atualizar documentação
- [ ] Backup check

### 📅 Rotina Mensal

- [ ] Revisar custos Stripe
- [ ] Otimizar queries
- [ ] Atualizar dependências
- [ ] Security audit

---

## 🆘 EMERGENCY CONTACTS

### 📞 Contatos Importantes

- **Stripe Support**: https://support.stripe.com
- **Supabase Support**: https://supabase.com/support
- **Team Lead**: [Seu contato]
- **DevOps**: [Seu contato]

### 🚨 Emergency Procedures

1. **Webhook down**
   - Check backend logs
   - Verify Stripe webhook config
   - Restart backend service

2. **Payment failures**
   - Check Stripe Dashboard
   - Verify API keys
   - Check webhook logs

3. **Database issues**
   - Check Supabase status
   - Verify connection
   - Check query performance

---

## ✅ FINAL SIGN-OFF

### 📋 Approval Checklist

- [ ] **Technical Lead** - Aprovado
- [ ] **Product Owner** - Aprovado
- [ ] **QA Team** - Aprovado
- [ ] **Security Team** - Aprovado
- [ ] **DevOps** - Aprovado

### 🎉 READY TO LAUNCH!

Data de Deploy: _______________

Responsável: _______________

Assinatura: _______________

---

**🚀 SISTEMA PRONTO PARA PRODUÇÃO! 🎉**
