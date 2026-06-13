import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Platform AI Assistant
// Nodes   : 6  |  Connections: 5
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// GetContext                         httpRequest
// CodeContext                        code
// OllamaChat                         httpRequest
// SaveResponse                       httpRequest
// RespondToWebhook                   respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → GetContext
//      → CodeContext
//        → OllamaChat
//          → SaveResponse
//            → RespondToWebhook
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
        jsonBody: `{
  "p_member_id": "{{ $json.member_id }}",
  "p_conversation_id": "{{ $json.conversation_id }}",
  "p_product_id": "{{ $json.product_context || null }}"
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
const event = input.json.event;
const memberName = input.json.member_name || 'Membro';
const conversationId = input.json.conversation_id;
const messageContent = input.json.message || '';

// Acessa o resultado do nó anterior 'Get Context'
const contextNode = $('Get Context').first();
const context = contextNode.json;
const onboarding = context.onboarding || {};
const memory = context.memory || {};
const history = context.history || [];
const productBought = context.product_bought || false;
const productMetadata = context.product_metadata || {};

let systemPrompt = \`Você é o CodeEngine Assistant, um consultor e mentor digital de Inteligência Artificial, programação, tráfego pago e automações na plataforma CodeEngine 1.
Seu objetivo é ajudar o usuário, \${memberName}, a alcançar seus objetivos e superar seus desafios.
Tom de voz: Empático, profissional, consultivo, natural, amigável. Chame o usuário pelo nome.

PERFIL DO USUÁRIO:
- O que quer aprender: \${onboarding.wants_to_learn || 'Não informado'}
- Objetivo: \${onboarding.goal || 'Não informado'}
- Maior dificuldade: \${onboarding.difficulty || 'Não informada'}
\`;

if (memory.goals_extracted && memory.goals_extracted.length > 0) {
  systemPrompt += \`\\nMEMÓRIA COGNITIVA CONSOLIDADA:
- Objetivos extraídos: \${memory.goals_extracted.join(', ')}
- Interesses: \${memory.interests ? memory.interests.join(', ') : ''}
- Dificuldades mapeadas: \${memory.challenges ? memory.challenges.join(', ') : ''}
\`;
}

// Se há contexto de produto (e-book ou curso)
const productContext = input.json.product_context;
if (productContext) {
  if (productBought) {
    systemPrompt += \`\\nMENTORIA DE LEITURA (Produto Adquirido):
O usuário possui acesso completo a este produto (ID: \${productContext}).
Você deve atuar como um mentor digital lado a lado, ajudando-o a fixar o aprendizado, explicando conceitos complexos, resumindo tópicos e auxiliando na aplicação prática do conteúdo.
Estrutura do conteúdo / Tópicos principais: \${productMetadata.structure_outline || 'Não disponível'}
O que ele vai aprender: \${productMetadata.key_takeaways || 'Não disponível'}
\`;
  } else {
    systemPrompt += \`\\nVENDA CONSULTIVA (Produto Não Adquirido):
O usuário está visualizando a página do produto (ID: \${productContext}) mas ainda não o adquiriu. Você NÃO tem acesso ao conteúdo pago dele.
Você deve explicar os benefícios e o que ele aprenderá nesse produto de forma consultiva, baseando-se nas seguintes informações de marketing:
- Problemas que resolve: \${productMetadata.problems_solved || 'Não disponível'}
- Público-alvo: \${productMetadata.target_audience || 'Não disponível'}
- O que ele aprenderá: \${productMetadata.key_takeaways || 'Não disponível'}
- Tópicos abordados: \${productMetadata.structure_outline || 'Não disponível'}
Esclareça dúvidas gerais do usuário. Mas para ter acesso ao material completo, recomende de forma natural e amigável que ele adquira o material.
\`;
  }
} else {
  systemPrompt += \`\\nORIENTAÇÃO DE JORNADA GERAL:
O usuário está navegando pela plataforma geral. Ajude-o a encontrar o melhor caminho. Recomende de forma consultiva e natural os cursos e e-books da plataforma que correspondam às necessidades e dificuldades dele.
\`;
}

systemPrompt += \`\\n\\nDIRETRIZES DE RECOMENDAÇÃO DE CONTEÚDO:
Quando recomendar um e-book ou curso, sugira o conteúdo de forma consultiva e natural. 
Sempre que você julgar muito relevante recomendar um produto específico da plataforma na conversa, você deve inserir uma linha de comando no final da sua resposta no formato exato:
[RECOMMEND: <ID_DO_PRODUTO> | <AÇÃO>]
Onde <AÇÃO> pode ser 'Começar Agora', 'Quero Aprender', 'Ver Conteúdo' ou 'Acessar Material'. Exemplo: [RECOMMEND: 9f5a7d3c-62b1 | Quero Aprender]. Isso fará com que o sistema renderize um botão de ação de forma automatizada no chat para o usuário.
Mantenha a resposta com excelente formatação em Markdown (parágrafos limpos, tópicos, etc.).\`;

// Mapear histórico para o formato da OpenAI
const messages = [];
messages.push({ role: 'system', content: systemPrompt });

// Histórico do banco (do mais recente ao mais antigo) -> inverter para ordem cronológica
const chatHistory = [...history].reverse();
for (const msg of chatHistory) {
  messages.push({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  });
}

// Mensagem atual do usuário ou trigger de onboarding
if (event === 'onboarding_completed') {
  messages.push({
    role: 'user',
    content: \`Olá! Acabei de me cadastrar na plataforma CodeEngine Learn. Meu objetivo é \${onboarding.goal || 'aprender'} e minha maior dificuldade atual é \${onboarding.difficulty || 'por onde começar'}. Por favor, crie uma mensagem de boas-vindas calorosa se apresentando, me chamando pelo meu nome (\${memberName}) e me mostrando como você pode me ajudar de forma personalizada.\`
  });
} else {
  messages.push({
    role: 'user',
    content: messageContent
  });
}

return {
  json: {
    event,
    member_id: input.json.member_id,
    conversation_id: conversationId,
    messages
  }
};
`,
    };

    @node({
        id: 'ollama-assistant-chat-completion',
        name: 'Ollama Chat',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [760, 200],
    })
    OllamaChat = {
        url: '={{ $env.OLLAMA_URL || "http://ollama:11434" }}/api/chat',
        method: 'POST',
        sendHeaders: false,
        sendBody: true,
        contentType: 'json',
        specifyBody: 'json',
        jsonBody: `={
  "model": "{{ $env.OLLAMA_MODEL || 'qwen2.5:3b' }}",
  "messages": {{ JSON.stringify($json.messages) }},
  "stream": false
}`,
        options: {},
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
        jsonBody: `{
  "conversation_id": "{{ $('Code Context').item.json.conversation_id }}",
  "sender": "assistant",
  "content": "{{ $json.message.content }}",
  "metadata": {
    "raw_ollama": {{ JSON.stringify($json) }}
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
        responseBody: `{
  "success": true,
  "reply": "{{ $('Ollama Chat').item.json.message.content }}",
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
        this.CodeContext.out(0).to(this.OllamaChat.in(0));
        this.OllamaChat.out(0).to(this.SaveResponse.in(0));
        this.SaveResponse.out(0).to(this.RespondToWebhook.in(0));
    }
}
