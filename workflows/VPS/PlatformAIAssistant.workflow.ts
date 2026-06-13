import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Platform AI Assistant
// Nodes   : 7  |  Connections: 5
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// GetContext                         httpRequest
// CodeContext                        code
// NvidiaChatModel                    lmChatNvidia               [creds] [ai_languageModel]
// AiAgent                            agent                      [AI]
// SaveResponse                       httpRequest
// RespondToWebhook                   respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → GetContext
//      → CodeContext
//        → AiAgent
//          → SaveResponse
//            → RespondToWebhook
//
// AI CONNECTIONS
// AiAgent.uses({ ai_languageModel: NvidiaChatModel })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'wzRiWD4xi13TESqy',
    name: 'Platform AI Assistant',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1' },
})
export class PlatformAiAssistantWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'webhook-assistant-message-trigger',
        webhookId: 'assistant-message-trigger',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [100, 200],
    })
    Webhook = {
        path: 'assistant-message',
        httpMethod: 'POST',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'supabase-get-assistant-context',
        name: 'Get Context',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [320, 200],
    })
    GetContext = {
        url: 'https://ffdqqiunkzhtgbgaojay.supabase.co/rest/v1/rpc/get_assistant_context',
        method: 'POST',
        sendHeaders: true,
        specifyHeaders: 'keypair',
        headerParameters: {
            parameters: [
                {
                    name: 'apikey',
                    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5NzQxMSwiZXhwIjoyMDk0MTczNDExfQ.Opu0mnFzGYmTx9qdngJpTYzWgAynMWFUgXCei2KWDqs',
                },
                {
                    name: 'Authorization',
                    value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5NzQxMSwiZXhwIjoyMDk0MTczNDExfQ.Opu0mnFzGYmTx9qdngJpTYzWgAynMWFUgXCei2KWDqs',
                },
            ],
        },
        sendBody: true,
        contentType: 'json',
        specifyBody: 'json',
        jsonBody: `={
  "p_member_id": {{ $json.body?.member_id ? '"' + $json.body.member_id + '"' : ($json.member_id ? '"' + $json.member_id + '"' : 'null') }},
  "p_conversation_id": {{ $json.body?.conversation_id ? '"' + $json.body.conversation_id + '"' : ($json.conversation_id ? '"' + $json.conversation_id + '"' : 'null') }},
  "p_product_id": {{ $json.body?.product_context ? '"' + $json.body.product_context + '"' : ($json.product_context ? '"' + $json.product_context + '"' : 'null') }}
}`,
        options: {},
    };

    @node({
        id: 'process-ai-system-prompt-context',
        name: 'Code Context',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [540, 200],
    })
    CodeContext = {
        jsCode: `
const input = $input.item;
const webhookNode = $('Webhook').first().json;
const webhookBody = webhookNode.body || webhookNode;
const event = webhookBody.event || '';
const memberName = webhookBody.member_name || 'Membro';
const conversationId = webhookBody.conversation_id || '';
const messageContent = webhookBody.message || '';

// Acessa o resultado do nó anterior 'Get Context'
const contextNode = $('Get Context').first();
const context = contextNode.json;
const onboarding = context.onboarding || {};
const memory = context.memory || {};
const history = context.history || [];
const pastHistory = context.past_history || [];
const productBought = context.product_bought || false;
const productMetadata = context.product_metadata || {};
const productContext = input.json.product_context;
const agentType = webhookBody.agent_type || 'platform_assistant';

let systemPrompt = '';

if (agentType === 'platform_assistant') {
  systemPrompt = \`Você é o Agente 1 — Assistente da Plataforma CodeEngine Learn.
Seu objetivo é guiar o usuário (\${memberName}) pela plataforma, responder dúvidas gerais, explicar funcionalidades da plataforma e recomendar e-books e cursos de forma consultiva e natural.
Tom de voz: Empático, profissional, consultivo, natural, amigável. Chame o usuário pelo nome.

PERFIL DO USUÁRIO:
- O que quer aprender: \${onboarding.wants_to_learn || 'Não informado'}
- Objetivo: \${onboarding.goal || 'Não informado'}
- Maior dificuldade: \${onboarding.difficulty || 'Não informada'}
\`;

  if (productContext) {
    systemPrompt += \`\\nVENDA CONSULTIVA (Produto Não Adquirido):
O usuário está visualizando a página do produto (ID: \${productContext}) mas ainda não o adquiriu. Você NÃO tem acesso ao conteúdo pago dele.
Você deve explicar os benefícios e o que ele aprenderá nesse produto de forma consultiva, baseando-se nas seguintes informações de marketing:
- Problemas que resolve: \${productMetadata.problems_solved || 'Não disponível'}
- Público-alvo: \${productMetadata.target_audience || 'Não disponível'}
- O que ele aprenderá: \${productMetadata.key_takeaways || 'Não disponível'}
- Tópicos abordados: \${productMetadata.structure_outline || 'Não disponível'}

IMPORTANTE (Estrutura de Resposta Obrigatória):
Como o usuário está perguntando sobre o produto, você DEVE estruturar sua resposta EXATAMENTE com os seguintes tópicos em negrito:
- **Dor**: Explique quais problemas o produto resolve.
- **Objetivo**: O que o produto visa alcançar.
- **Benefícios**: Os principais benefícios e diferenciais do produto.
- **Perfil Ideal**: Quem mais se beneficiaria deste conteúdo.
- **Próximos Passos**: Como começar ou adquirir o produto (recomende que ele adquira o material e utilize o comando [RECOMMEND: \${productContext} | Quero Aprender] para que ele possa comprar).
- Sugira também combos inteligentes/especializações personalizadas se o usuário quiser combinar este produto com outros tópicos relacionados para acelerar seus estudos.
\`;
  } else {
    systemPrompt += \`\\nORIENTAÇÃO DE JORNADA GERAL:
O usuário está navegando pela plataforma geral. Ajude-o a encontrar o melhor caminho. Recomende de forma consultiva e natural os cursos e e-books da plataforma que correspondam às necessidades e dificuldades dele.
\`;
  }
} else if (agentType === 'combo_specialist') {
  systemPrompt = \`Você é o Agente 2 — Especialista em Combos da CodeEngine Learn.
Sua única responsabilidade é criar Especializações Personalizadas (Combos Inteligentes) que organizam materiais em uma jornada de estudos sequencial.
Crie um plano estruturado com capítulos e passos baseados nos objetivos do usuário.
Você deve responder estritamente no formato JSON solicitado na mensagem do usuário.
\`;
} else if (agentType === 'ebook_mentor') {
  systemPrompt = \`Você é o Agente 3 — Mentor de E-books da CodeEngine Learn.
Sua função é atuar exclusivamente dentro do leitor de e-books para tirar dúvidas, resumir capítulos, criar exemplos práticos e explicar conceitos do livro atual: "\${productMetadata.title || 'E-book'}" (ID: \${productContext}).

DIRETRIZES:
- Auxilie o usuário na fixação do aprendizado de forma amigável.
- Adapte suas explicações ao nível do usuário.
- Se o usuário perguntar algo que não está relacionado a este e-book, lembre-o gentilmente de que você é o mentor focado neste material específico.

CONTEÚDO COMPLETO DO E-BOOK (PDF Extracted Text):
\${productMetadata.pdf_text || 'O texto do PDF não está disponível no banco de dados. Utilize os metadados e os resumos conhecidos para ajudar o usuário.'}

Tire dúvidas baseando-se estritamente no texto fornecido. Responda em português.\`;
} else if (agentType === 'course_mentor') {
  systemPrompt = \`Você é o Agente 4 — Mentor de Cursos da CodeEngine Learn.
Sua função é atuar exclusivamente dentro da área de cursos para tirar dúvidas sobre as aulas, resumir módulos, criar exercícios de fixação e guiar o aprendizado prático do curso atual: "\${productMetadata.title || 'Curso'}" (ID: \${productContext}).

DIRETRIZES:
- Explique as aulas, tire dúvidas de programação/tecnologia e ajude na prática.
- Se o usuário perguntar ao mentor de cursos algo que não está relacionado a este curso, lembre-o gentilmente de que você é o mentor focado neste material específico.

ESTRUTURA E METADADOS DO CURSO:
- Módulos / Tópicos: \${productMetadata.structure_outline || 'Não disponível'}
- O que ele aprenderá: \${productMetadata.key_takeaways || 'Não disponível'}

Responda em português de forma clara e didática.\`;
}

if (agentType === 'platform_assistant') {
  systemPrompt += \`\\n\\nDIRETRIZES DE RECOMENDAÇÃO DE CONTEÚDO:
Quando recomendar um e-book ou curso, sugira o conteúdo de forma consultiva e natural.
Sempre que você julgar muito relevante recomendar um produto específico da plataforma na conversa, você deve inserir uma linha de comando no final da sua resposta no formato exato:
[RECOMMEND: <ID_DO_PRODUTO> | <AÇÃO>]
Onde <AÇÃO> pode ser 'Começar Agora', 'Quero Aprender', 'Ver Conteúdo' ou 'Acessar Material'. Exemplo: [RECOMMEND: 9f5a7d3c-62b1 | Quero Aprender]. Isso fará com que o sistema renderize um botão de ação de forma automatizada no chat para o usuário.
IMPORTANTE: Nunca use placeholders para IDs. Use APENAS os UUIDs reais dos produtos do catálogo passados no contexto. Se não houver produto correspondente no catálogo, não gere o comando RECOMMEND.
Mantenha a resposta com excelente formatação em Markdown (parágrafos limpos, tópicos, etc.).\`;
}

// Formatando o histórico de conversas da sessão atual
let conversationHistoryText = "";
const chatHistory = [...history].reverse();
for (const msg of chatHistory) {
  const senderLabel = msg.sender === 'user' ? 'Usuário' : 'Assistente';
  conversationHistoryText += \`\\n\${senderLabel}: \${msg.content}\`;
}

if (conversationHistoryText) {
  systemPrompt += \`\\n\\nHISTÓRICO DETA SESSÃO (Use como contexto imediato):\\n\${conversationHistoryText}\`;
}

// Formatando o histórico das conversas passadas (memória)
let pastHistoryText = "";
const pastChatHistory = [...pastHistory].reverse();
for (const msg of pastChatHistory) {
  const senderLabel = msg.sender === 'user' ? 'Usuário' : 'Assistente';
  pastHistoryText += \`\\n\${senderLabel}: \${msg.content}\`;
}

if (pastHistoryText) {
  systemPrompt += \`\\n\\nHISTÓRICO DE CONVERSAS ANTERIORES (Memória geral de sessões passadas. Use APENAS se o usuário fizer perguntas de seguimento ou se referir a conversas passadas):\\n\${pastHistoryText}\`;
}

if (memory.goals_extracted && memory.goals_extracted.length > 0) {
  systemPrompt += \`\\n\\nMEMÓRIA COGNITIVA CONSOLIDADA:
- Objetivos extraídos: \${memory.goals_extracted.join(', ')}
- Interesses: \${memory.interests ? memory.interests.join(', ') : ''}
- Dificuldades mapeadas: \${memory.challenges ? memory.challenges.join(', ') : ''}
\`;
}

const userMessage = event === 'onboarding_completed'
  ? \`Olá! Acabei de me cadastrar na plataforma CodeEngine Learn. Meu objetivo é \${onboarding.goal || 'aprender'} e minha maior dificuldade atual é \${onboarding.difficulty || 'por onde começar'}. Por favor, crie uma mensagem de boas-vindas calorosa se apresentando, me chamando pelo meu nome (\${memberName}) e me mostrando como você pode me ajudar de forma personalizada.\`
  : messageContent;

return {
  json: {
    event,
    member_id: input.json.member_id,
    conversation_id: conversationId,
    systemPrompt,
    userMessage
  }
};
`,
    };

    @node({
        id: 'nvidia-nemotron-chat-model',
        name: 'NVIDIA Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatNvidia',
        version: 1,
        position: [760, 320],
        credentials: { nvidiaApi: { id: 'RkZuZ2qX37TLpqfd', name: 'NVIDIA Nemotron account' } },
    })
    NvidiaChatModel = {
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
        options: {},
    };

    @node({
        id: 'ai-agent-assistant',
        name: 'AI Agent',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 3.1,
        position: [760, 150],
    })
    AiAgent = {
        text: '={{ $json.userMessage }}',
        options: {
            systemMessage: '={{ $json.systemPrompt }}',
        },
        promptType: 'define',
    };

    @node({
        id: 'supabase-save-assistant-response',
        name: 'Save Response',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [980, 200],
    })
    SaveResponse = {
        url: 'https://ffdqqiunkzhtgbgaojay.supabase.co/rest/v1/assistant_messages',
        method: 'POST',
        sendHeaders: true,
        specifyHeaders: 'keypair',
        headerParameters: {
            parameters: [
                {
                    name: 'apikey',
                    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5NzQxMSwiZXhwIjoyMDk0MTczNDExfQ.Opu0mnFzGYmTx9qdngJpTYzWgAynMWFUgXCei2KWDqs',
                },
                {
                    name: 'Authorization',
                    value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHFxaXVua3podGdiZ2FvamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5NzQxMSwiZXhwIjoyMDk0MTczNDExfQ.Opu0mnFzGYmTx9qdngJpTYzWgAynMWFUgXCei2KWDqs',
                },
            ],
        },
        sendBody: true,
        contentType: 'json',
        specifyBody: 'json',
        jsonBody: `={
  "conversation_id": "{{ $('Code Context').item.json.conversation_id }}",
  "sender": "assistant",
  "content": {{ JSON.stringify($json.output) }},
  "metadata": {
    "raw_agent": {{ JSON.stringify($json) }}
  }
}`,
        options: {},
    };

    @node({
        id: 'respond-to-webhook-response-node',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.1,
        position: [1200, 200],
    })
    RespondToWebhook = {
        respondWith: 'json',
        responseBody: `={
  "success": true,
  "reply": {{ JSON.stringify($('AI Agent').item.json.output) }},
  "metadata": {}
}`,
        options: [],
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.GetContext.in(0));
        this.GetContext.out(0).to(this.CodeContext.in(0));
        this.CodeContext.out(0).to(this.AiAgent.in(0));
        this.AiAgent.out(0).to(this.SaveResponse.in(0));
        this.SaveResponse.out(0).to(this.RespondToWebhook.in(0));

        this.AiAgent.uses({
            ai_languageModel: this.NvidiaChatModel.output,
        });
    }
}
