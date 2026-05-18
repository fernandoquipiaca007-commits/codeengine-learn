# 📘 CODEENGINE: Documentação Oficial de Engenharia
**Subsistemas: Gamificação, Partilhas (Referral), Recompensas e Integração Stripe**

> **Data de Atualização:** Maio de 2026  
> **Status:** Estável / Produção  
> **Escopo:** Frontend (React), Backend (Node.js/Express) e Admin Panel

---

## 1. VISÃO GERAL DO SISTEMA

O ecossistema da CodeEngine implementa um motor avançado de gamificação e partilhas concebido para maximizar a retenção de utilizadores e aquisição orgânica (Growth Hacking).

* **Sistema de Gamificação & Pontos:** Os utilizadores acumulam pontos através de interações na plataforma (compras, partilhas convertidas). Estes pontos definem "Níveis" (Starter, Bronze, Silver, Gold, Platinum).
* **Sistema de Partilhas (Referral):** Cada utilizador possui links únicos de afiliação. Quando um novo cliente compra através deste link, o dono do link acumula *Progresso de Partilha* (descontos progressivos) e *Pontos*.
* **Integração Stripe (Checkout & Cupons):** O sistema sincroniza de forma estrita o progresso de descontos e a conversão de pontos em cupons reais do Stripe.
* **Sistema de Recompensas:** À medida que o utilizador sobe de nível, desbloqueia recompensas (criadas e geridas pelo painel Admin) que podem ser convertidas em Cupons aplicáveis no Checkout.

---

## 2. ARQUITETURA UTILIZADA

O sistema segue uma arquitetura **Decoplada (Headless)** dividida em três pilares:

1. **Frontend (App Principal):** Renderização da UI, gestão de estado do utilizador e tracking de afiliação via `localStorage`.
2. **Backend (API Node.js):** Fonte de verdade (Source of Truth). Processa cálculos de descontos, comunica com a API da Stripe e valida a segurança das transações.
3. **Database (Supabase/PostgreSQL):** Armazenamento relacional com Triggers e RPCs (Stored Procedures) para garantir atomicidade nas transações de pontos e criação de utilizadores (`ensureMemberExists`).

**Porquê esta arquitetura?**
A separação garante que a lógica sensível (cálculo de descontos e preços) nunca reside no cliente. O frontend é "burro" no que toca a preços — ele apenas apresenta o valor calculado pelo backend. Isto garante **Escalabilidade** (múltiplos clientes podem usar a mesma API) e **Segurança** absoluta contra manipulação de preços no DOM.

---

## 3. STACK TECNOLÓGICA

* **Frontend:** React 18, Vite, TailwindCSS (Styling), Zustand/Context (State).
* **Backend:** Node.js, Express, Stripe SDK.
* **Base de Dados & Auth:** Supabase (PostgreSQL), Supabase Auth.
* **Infraestrutura:** Endpoints RESTful para comunicação.
* **Comunicações:** Resend (Email Transactional).

---

## 4. ESTRUTURA DE PASTAS E RESPONSABILIDADES

```text
/
├── src/                          # FRONTEND PRINCIPAL
│   ├── components/
│   │   ├── referral/             # UI de Gamificação (ReferralProgress, RewardsList)
│   │   └── ProductActionButton.tsx # Gatilho de Checkout
│   ├── hooks/
│   │   └── useReferral.ts        # Lógica cliente para tracking de afiliação
│   └── pages/
│       ├── Rewards.tsx           # Dashboard do utilizador para Níveis/Pontos
│       └── Success.tsx           # Landing pós-compra (validação de posse)
│
├── backend/                      # BACKEND (API & STRIPE)
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── create-checkout.ts # Motor principal de preços e sessões
│   │   │   └── webhook.ts         # Processamento pós-pagamento
│   │   ├── referral/
│   │   ├── points/
│   │   └── admin/                 # Rotas restritas (Gestão de Recompensas)
│   └── lib/
│       ├── points-service.ts      # Regras de negócio de pontos/níveis
│       └── referral-service.ts    # Regras de negócio de partilhas
│
└── admin/                        # PAINEL DE ADMINISTRAÇÃO
    └── src/pages/
        └── LevelRewards.tsx      # CRUD para gestão de recompensas por nível
```

---

## 5. ARQUIVOS MODIFICADOS (Última Estabilização)

| Arquivo | Responsabilidade | Impacto / Alteração Crítica |
|---|---|---|
| `backend/api/stripe/create-checkout.ts` | Geração de Sessões Stripe | **CRÍTICO:** Correção da atribuição do desconto de partilha. O desconto passou a ser lido do próprio *Comprador* e não do *Referrer*. O código de referral passou a ser usado estritamente para metadados de rastreio. |
| `backend/lib/points-service.ts` | Gestão de Resgates | Integração direta com a Stripe para gerar códigos de cupom reais dinamicamente quando um utilizador clama uma recompensa de nível. |
| `src/components/referral/RewardsList.tsx` | UI de Recompensas | Redesign para permitir "Copiar Cupom" gerado no backend. |
| `backend/api/admin/rewards.ts` | API Admin | **NOVO:** CRUD completo para gerir a tabela `level_rewards`. |
| `admin/src/pages/LevelRewards.tsx` | Admin UI | **NOVO:** Interface gráfica para o administrador criar/editar as recompensas de cada nível (com regras dinâmicas baseadas no tipo de recompensa). |

---

## 6. LÓGICA DO SISTEMA DE PARTILHAS

**1. Criação do Link:** O utilizador gera um link (Global ou Específico de Produto). O `code` é guardado em `referral_links`.
**2. Rastreio (Tracking):** Quando um visitante abre a app com `?ref=CODE`, o `useReferral` hook guarda este código no `localStorage` do browser.
**3. Atribuição na Compra:** No clique em "Comprar", o frontend envia o `referralCode` para o backend no payload do checkout.
**4. Metadados Stripe:** O backend anexa o `referralCode` e o `referrer_member_id` nos metadados da sessão Stripe. **O preço não sofre desconto por causa deste código.**
**5. Confirmação (Webhook):** Quando o pagamento é processado, o webhook lê os metadados. Se houver um referrer, o backend regista a conversão em `referral_conversions`, incrementa os pontos do dono do link e atualiza o seu `product_referral_progress` (desconto acumulado).

---

## 7. LÓGICA DE GAMIFICAÇÃO (PONTOS E NÍVEIS)

* **Ganhos:** Compras diretas (cashback em pontos) e Partilhas bem-sucedidas.
* **Tabela `member_points`:** Guarda os pontos totais e o nível atual.
* **Desbloqueios (`level_rewards`):** O administrador define recompensas por nível (ex: Cupom de 10% no nível Bronze).
* **Resgate (`claimReward`):** Quando o utilizador clica em "Resgatar", o backend verifica a elegibilidade, comunica com a Stripe para gerar o Cupom e guarda o registo em `product_coupons` com `member_id` associado, garantindo uso único.

---

## 8. INTEGRAÇÃO COM STRIPE (O Coração do Checkout)

O fluxo de preços (`create-checkout.ts`) segue uma ordem estrita e inquebrável para garantir integridade financeira:

1. **Preço Base:** Determinado pelo produto.
2. **Desconto de Partilha (Referral Progress):** O backend procura se o **COMPRADOR** tem descontos acumulados na tabela `product_referral_progress` devido a partilhas passadas feitas por ele. Se sim, subtrai ao valor.
3. **Cupom Manual:** O backend valida o cupom introduzido no frontend. Suporta cupons específicos de produto e cupons globais (`product_id IS NULL`). Subtrai ao valor.
4. **Verificação de Preço Zero:** Se o `finalPrice <= 0`, o sistema redireciona para um fluxo de *Free Claim* interno, ignorando a Stripe.
5. **Criação da Sessão:** A sessão é criada com `unitAmount: finalPrice * 100` e todos os identificadores são embutidos no `metadata` para processamento posterior.

---

## 9. PROBLEMAS ENCONTRADOS E CORREÇÕES (Post-Mortem)

**Problema Crítico 1: Vazamento de Descontos (Wrong Attribution)**
* **Sintoma:** O utilizador A partilhava o link. O utilizador B clicava e ia comprar. O utilizador B via o preço com um desconto brutal (o desconto acumulado do utilizador A).
* **Causa:** O backend lia o `referralCode` do payload e puxava o desconto de quem *criou* o link, aplicando-o ao checkout em curso.
* **Correção:** A lógica foi reescrita. O desconto passou a ser lido estritamente usando o `memberId` de quem está a fazer o checkout. O `referralCode` passou a ser apenas metadados passivos para o webhook.

**Problema Crítico 2: Dessincronização Frontend/Stripe**
* **Sintoma:** UI mostrava $180, mas a Stripe cobrava $200.
* **Causa:** O frontend aplicava o desconto de partilha visualmente, mas o backend não conseguia replicar a mesma matemática devido à dependência do `referralCode`.
* **Correção:** Com o conserto acima, o backend e o frontend agora leem exatamente da mesma fonte (`getProductReferralProgress(memberId)`), garantindo sincronia perfeita.

---

## 10. FLUXOS DO USUÁRIO

**Fluxo de Compra / Partilha / Checkout**
1. User A vai ao produto X e clica em "Partilhar".
2. User A partilha com amigos. 5 amigos compram.
3. Webhooks confirmam as 5 compras. `product_referral_progress` de User A sobe para 100% de desconto.
4. User A volta à plataforma e clica em "Comprar" no produto X.
5. Backend deteta que User A tem 100% de desconto acumulado.
6. Sessão da Stripe é ignorada (Free Claim), produto é atribuído imediatamente.

**Fluxo de Recompensas de Nível**
1. User atinge 500 pontos (Nível Prata).
2. Vai à página de Recompensas e vê "Cupom 15% Desconto" (criado no Admin).
3. Clica em "Resgatar". Backend pede à Stripe um código de cupom real e guarda-o.
4. A UI mostra o código gerado. User clica em "Copiar".
5. No Checkout, User cola o código e recebe 15% de desconto via Stripe.

---

## 11. COMPONENTES FRONTEND CHAVE

* `ReferralProgress.tsx`: Oculta-se automaticamente se o utilizador já possui o produto. Busca dinamicamente o progresso via hook.
* `RewardsList.tsx`: Renderiza a grelha de recompensas por nível. Lida com o botão de "Resgatar" e muda de estado para mostrar o botão "Copiar Cupom".
* `ProductActionButton.tsx`: Orquestrador do checkout. Responsável por embutir o `referralCode` (lido do localStorage) no payload para a API de checkout.
* `Admin/LevelRewards.tsx`: Formulário dinâmico reativo. Se o Admin escolhe "Cupom", mostra campos de `%` ou `$`. Se escolhe "Pontos", mostra campo de valor unitário.

---

## 12. SISTEMA DE ESTADOS (STATE MANAGEMENT)

* **LocalStorage:** Utilizado transitoriamente para armazenar o `REFERRAL_COOKIE_KEY` (O link de afiliação por onde o utilizador entrou). Isto sobrevive a recarregamentos de página até à conversão (compra).
* **SessionStorage:** Utilizado no `Success.tsx` para persistir o `session_id` da Stripe durante recarregamentos forçados de página, evitando a falsa mensagem "Produto não encontrado".
* **Supabase / Backend:** É o verdadeiro dono do estado. O frontend apenas faz *polling* via hooks (`useReferral`, `fetchStats`) para refletir a realidade do servidor.

---

## 13. SEGURANÇA E VALIDAÇÕES

1. **Auto-Provisionamento de Membros:** O backend implementa o padrão `ensureMemberExists`. Isto resolve situações de "Race Conditions" onde o utilizador cria conta e imediatamente tenta resgatar pontos antes do trigger da base de dados terminar.
2. **Single Source of Truth de Preços:** O preço enviado do frontend para o backend é **IGNORADO**. O backend recálcula o preço a partir do ID do produto, base de dados de partilhas e validação direta na API da Stripe para cupons.
3. **Idempotência de Recompensas:** O registo na tabela `member_rewards` garante que a recompensa de um nível específico só pode ser resgatada uma vez por utilizador.

---

## 14. MELHORIAS FUTURAS (ROADMAP)

1. **Expiração Automática de Cupons:** Atualmente os cupons de recompensa não expiram. Adicionar um TTL (Time To Live) de 30 dias para forçar o FOMO (Fear Of Missing Out) e acelerar a compra.
2. **WebSockets para Notificações:** Implementar notificações em tempo real (via Supabase Realtime) quando alguém compra através do link do utilizador, disparando confetes na UI.
3. **Analytics Avançado:** No painel Admin, cruzar os dados de partilha com o Lifetime Value (LTV) dos clientes para descobrir quais utilizadores geram os *melhores* indicados, não apenas a maior *quantidade*.

---

## 15. CHECKLIST FINAL DO SISTEMA DE RECOMPENSAS

* [x] Cálculo e rastreio de pontos por compra.
* [x] Cálculo e rastreio de progresso de desconto por partilha.
* [x] Prevenção de vazamento de desconto (Link Owner vs Link Clicker).
* [x] Conversão de Níveis em códigos da Stripe funcionais.
* [x] Painel de Administração para CRUD das recompensas de Nível.
* [x] UI/UX Premium no Dashboard do utilizador com funcionalidade Copy to Clipboard.
* [x] Recuperação pós-compra (Success.tsx) estável sem erros fantasmas.
* [ ] (Pendente) Disparo de emails em lote (Limitado pelas quotas do Resend no ambiente dev).

---

## 16. PADRÕES DE CÓDIGO A SEGUIR

* **Acesso à Base de Dados (Backend):** Usar sempre `.maybeSingle()` em vez de `.single()` em selects onde o resultado pode não existir, para não disparar excepções HTTP 500 desnecessárias.
* **Segurança de Rotas:** Qualquer rota do Admin *tem* de passar pelo middleware `requireAdmin` que verifica o cabeçalho `x-admin-key`.
* **Cálculos Monetários:** Trabalhar em centavos (`unitAmount = Math.round(finalPrice * 100)`) mesmo antes do envio para a Stripe para evitar erros de ponto flutuante em Javascript.

---

## 17. COMO CONTINUAR O PROJETO (Guia para Novos Devs)

Se vais assumir ou continuar este projeto, lê isto cuidadosamente:

**1. Onde Começar?**
Começa por entender o `backend/api/stripe/create-checkout.ts`. Este arquivo é a artéria principal do sistema comercial. Compreende a ordem das validações matemáticas ali presentes. Se quebrares a ordem daquele arquivo, vais cobrar o valor errado aos clientes.

**2. Áreas mais sensíveis:**
Nunca, em circunstância alguma, confies num valor monetário, estado de desconto ou elegibilidade que venha do Payload (Frontend). Toda a lógica de verificação deve bater na Base de Dados (Supabase) ou na Stripe antes de emitir uma fatura.

**3. Adicionar novas funcionalidades de Gamificação:**
Se quiseres adicionar uma nova forma de ganhar pontos:
Abre o arquivo `backend/lib/points-service.ts`. Usa a função central `awardPoints`. Ela garante a atomicidade da operação (usando RPC da base de dados) e impede logs de fraude. Nunca atualizes a tabela `member_points` diretamente com um `UPDATE`.

**4. Fluxo de Desenvolvimento Local:**
O projeto usa múltiplas portas em simultâneo:
- Frontend Loja: Porta 3000 / 3030
- Backend API: Porta 3001 / 3031
- Admin Panel: Porta 5174 / 5175
Certifica-te que atualizas as variáveis de ambiente `VITE_BACKEND_URL` e as arrays de CORS em `stripe-server.ts` sempre que mudares a porta de desenvolvimento, senão as requisições irão falhar silenciosamente (Network Error).

***
*Fim do Documento Oficial.*
