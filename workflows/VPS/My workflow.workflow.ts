import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : My workflow
// Nodes   : 2  |  Connections: 1
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// ExtractFromFile                    extractFromFile
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → ExtractFromFile
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'stDrLO5XIC6t0DTc',
    name: 'My workflow',
    active: false,
    isArchived: false,
    projectId: 'DXr5vHlePQRxMJkS',
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: true },
})
export class MyWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'd983656b-37bc-4c4b-ae89-12e4952385fd',
        webhookId: '74193de3-6094-447c-a278-cab460b4a5d3',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [0, 0],
    })
    Webhook = {
        options: {},
    };

    @node({
        id: 'b706a3a3-0840-4269-a116-82a67602b94f',
        name: 'Extract from File',
        type: 'n8n-nodes-base.extractFromFile',
        version: 1.1,
        position: [208, 0],
    })
    ExtractFromFile = {
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.ExtractFromFile.in(0));
    }
}
