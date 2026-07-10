# Original User Request

## Initial Request — 2026-06-30T08:56:46Z

Otimizar globalmente a densidade da interface UI nos painéis de colaborador, admin e área de membros para caber em telas únicas (100vh), aprimorar a responsividade mobile com foco em aplicativo nativo, reverter o menu de abas da área de membros e corrigir bugs nos temas e visualizações.

Working directory: c:\Users\Dell\Documents\codeengine1.2
Integrity mode: development

## Requirements

### R1. Otimização Global de Viewport para Tela Única (Single Screen 100vh)
Reduzir as proporções de inputs, botões, margens, padding e cartões em todas as partes do sistema que estiverem muito grandes para que caibam em 100vh (sem rolagem vertical no desktop). O usuário deve conseguir ver tudo imediatamente assim que entra em cada tela.
* **Tela de Adicionar/Editar Produto:** Comprimir o carrossel de temas, campos de formulário, margens, botões e espaçamentos (paddings) para caber inteiro na tela sem scroll.
* **Tela de Colaboradores (Dashboard):** Comprimir cartões de métricas. Reduzir a altura do gráfico de tendência ("Tendência de Visitas e Conversões") para torná-lo compacto (ex: de ~400px para ~200px de altura) e visualmente adaptado para a tela única.
* **Dashboard Principal:** Diminuir em pelo menos 30% a altura e largura dos banners de colaboradores e de afiliados.

### R2. Design Mobile Responsivo Denso (Estilo App Nativo)
* Reduzir tipografia, botões, margens e tamanho de cards em telas pequenas (inclusive na aba Biblioteca) para evitar rolagem infinita.
* Refatorar filtros e painel de análise de estatísticas do colaborador em dispositivos móveis, tornando a interface compacta, elegante e fluida.

### R3. Admin Destaques e Sincronização de Anúncios
* Permitir ao administrador editar e adicionar manualmente destaques ("Produtos em Destaque") na Home com facilidade.
* **Deduplicação Inteligente:** Se um produto for destacado manualmente pelo administrador E tiver um anúncio ativo no sistema, exibir o produto apenas uma vez na Home, priorizando as informações e marcações do anúncio ativo.

### R4. Reversão das Abas da Área de Membros
* Reverter o menu de navegação de seções na Área de Membros (que apresenta as abas: Início, Biblioteca, Compras, Notificações, RECOMPENSAS) para as mesmas proporções e estilos exatos que existiam na branch `main`.
* **Proporções a Restaurar:** 
  * Spacing e padding do container das abas: `p-2 gap-2 mb-8`.
  * Padding e arredondamento dos botões das abas: `px-4 py-3 rounded-2xl font-display text-xs sm:text-sm`.
  * Altura da página principal no wrapper: `pt-28 pb-32 max-w-[min(100%,900px)] min-h-screen`.

### R5. Temas, Scroll-Scrubbing e Prévia
* Garantir que o fundo animado (ScrollTiedBackground) funcione de forma perfeitamente fluida em todos os presets (incluindo temas claros/escuros e gradientes).
* Clarificar textos e rótulos nas configurações de definição de fundo.
* Resolver o crash/erro no console do navegador que ocorre ao clicar em "pré-visualização do fundo" nas configurações do produto.

## Acceptance Criteria

### Viewport Layout
- [ ] Todas as principais telas de trabalho (incluindo Adicionar Produto e Dashboard do Colaborador) cabem inteiramente na altura do viewport de desktop (100vh) sem scroll vertical ativo.
- [ ] O gráfico de tendência do colaborador está compactado a ~200px de altura para não forçar rolagem.
- [ ] Os banners de afiliados e colaboradores no painel principal estão pelo menos 30% menores em altura e largura.

### Mobile App-Like Styling
- [ ] Os cards e botões na aba Biblioteca e na área de filtros do colaborador têm tamanho reduzido no mobile, exibindo mais informações na tela simultaneamente.

### Admin Featured Products Deduplication
- [ ] O admin consegue salvar destaques manualmente e, em caso de conflito com anúncios do mesmo produto, o storefront renderiza apenas uma instância única priorizando a estilização/metadados do anúncio.

### Members Tab Restoration
- [ ] O Header e menu de seções (Início, Biblioteca, Compras, Notificações, RECOMPENSAS) da página do membro tem exatamente o design, preenchimentos (`px-4 py-3`), bordas arredondadas (`rounded-2xl`) e espaçamentos herdados da branch `main`.

### Themes Preview
- [ ] O clique em "pré-visualização do fundo" abre a tela cheia de testes de rolagem sem quebrar o estado do React ou causar falhas no console.
- [ ] A velocidade e fluidez de rolagem do vídeo estão sincronizadas em todos os presets.

## Follow-up — 2026-07-10T18:23:05Z

Implementar o fluxo simplificado "Conte mais sobre você" para criadores com aprovação automática, auto-publicação de produtos (incluindo opções de publicação agendada e instantânea), e corrigir bugs de layout, contraste de texto e legibilidade no painel e na página "Sobre".

Diretório de trabalho: c:\Users\Dell\Documents\codeengine1.2
Modo de integridade: development

## Requisitos

### R1. Fluxo Simplificado de Registro de Criador ("Conte mais sobre você")
- Substituir a página/tela de "Candidatar-se a Criador" (`CollaboratorApply.tsx`) por um painel simples intitulado **"Conte mais sobre você"**.
- O formulário deve conter **apenas as 3 perguntas de Perfil Profissional**:
  1. Nome de Exibição / Canal
  2. Área de Especialização / Especialidade
  3. Minibiografia / Descrição
- As seções de "Preferências de Repasse Financeiro" (PayPal/IBAN) e "Estimativa de Armazenamento" (pesquisa estratégica de storage) devem ser completamente removidas do formulário.
- Ao enviar o formulário:
  - O backend deve registrar o colaborador imediatamente com status de aprovado (`status: 'approved'`).
  - O papel do membro no seu `profile_data.role` deve ser atualizado para `'criador'` no mesmo momento.
  - A carteira e o saldo do criador (`collaborator_balances`) devem ser inicializados automaticamente no banco de dados.
  - O criador deve ser redirecionado imediatamente para o Painel do Criador, sem telas de pendente/aguardando aprovação ou rejeição.
- Remover todas as telas e estados de "Candidatura em Análise" (pendente) e "Candidatura Recusada" do frontend.

### R2. Auto-Publicação e Agendamento de Produtos
- O criação de produtos pelo criador deve ignorar qualquer aprovação do administrador, salvando diretamente como `approval_status: 'approved'` e `status: 'active'` (a menos que seja agendado).
- Suporte para publicação agendada: se um carimbo de data/hora `scheduled_publish_at` for fornecido no cadastro, o produto permanece como `status: 'draft'` até o horário especificado, passando então automaticamente para `active`.
- Sincronizar automaticamente produtos USD com o Stripe (criar Stripe Product + Price) imediatamente após a publicação ativa.
- Notificar o administrador quando um novo produto for publicado (via sistema de notificação) para que ele possa adicionar o link do FassePay para Angola.
- Permitir a edição de produtos sem redefinir seu status para rascunho ou revisão pendente.

### R3. Correções de Bugs de UI/UX
- Corrigir o erro "Erro ao carregar análise. Tente novamente." na seção de análise de tráfego e vendas do Painel do Criador.
- Corrigir a mensagem "Access denied. Approved collaborator account required." na tela de gerenciamento de produtos do criador.
- Melhorar a legibilidade das descrições e marcadores na página "Sobre" (About), substituindo classes de texto de baixo contraste por classes de alto contraste (`text-white/70`, `text-white/50`).
- Garantir que não existam desvios de layout ou problemas de alinhamento de barra de rolagem na visualização da página Sobre.

## Critérios de Aceitação

### Fluxo do Criador
- [ ] O formulário do criador exibe apenas os 3 campos de Perfil Profissional sob o título "Conte mais sobre você".
- [ ] Ao enviar o formulário, o usuário é registrado como criador aprovado, seu saldo é ativado no banco, e ele é levado diretamente para o painel de controle.
- [ ] O painel do criador e a lista de produtos carregam sem erros de autorização ou de acesso negado.

### Publicação e Edição de Produtos
- [ ] Novos produtos ficam instantaneamente ativos e synced com o Stripe (para USD).
- [ ] O administrador recebe notificações de novas publicações.
- [ ] As edições nos produtos preservam seu status ativo.

### Polimento de UI
- [ ] Todo o texto na página Sobre é totalmente legível com contraste adequado.
- [ ] O painel de estatísticas (analytics) carrega dados de tráfego com sucesso sem erros.

