import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Free Email Sender
// Nodes   : 6  |  Connections: 5
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ScheduleTrigger                    scheduleTrigger
// ManualTrigger                      manualTrigger
// GetPendingEmails                   httpRequest
// FormatEmailToHtml                  code
// GmailSend                          gmail                      [creds]
// MarkEmailSent                      httpRequest
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ScheduleTrigger
//    → GetPendingEmails
//      → FormatEmailToHtml
//        → GmailSend
//          → MarkEmailSent
// ManualTrigger
//    → GetPendingEmails (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'c0vqOAOkrCDN9qBq',
    name: 'Free Email Sender',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate' },
})
export class FreeEmailSenderWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '7ec68fc7-4f8b-404e-bb71-e5aeb03c91b3',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [100, 200],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    field: 'minutes',
                    minutesInterval: 2,
                },
            ],
        },
    };

    @node({
        id: '9f5a7d3c-62b1-4f1e-8e2b-2a7f0e650723',
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [100, 350],
    })
    ManualTrigger = {};

    @node({
        id: '4940a0ec-5446-4d1d-b22f-77899a421fc5',
        name: 'Get Pending Emails',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [300, 200],
    })
    GetPendingEmails = {
        url: 'https://ffdqqiunkzhtgbgaojay.supabase.co/rest/v1/rpc/get_pending_emails',
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
        jsonBody: '{"batch_size": 10}',
        options: {},
    };

    @node({
        id: '5e5a68be-8b69-4f2e-ac2a-a0f7de850723',
        name: 'Format Email to HTML',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [520, 200],
    })
    FormatEmailToHtml = {
        jsCode: `
for (const item of $input.all()) {
  const text = item.json.body || '';
  const emailType = item.json.email_type || '';
  let htmlLinesContent = '';
  
  if (emailType === 'forgot_password') {
    // Extract the 6-digit OTP code using regex
    const otpMatch = text.match(/\\b\\d{6}\\b/);
    const otpCode = otpMatch ? otpMatch[0] : '';
    
    // Remove the OTP code and trailing colons from the body text to keep it clean
    let cleanText = text;
    if (otpCode) {
      cleanText = text.replace(otpCode, '').replace(/:\\s*$/, '').replace(/:\\s*\\n/, '\\n');
    }
    
    const lines = cleanText.split('\\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed === '') return '<br>';
      if (trimmed === '---') return '<hr style="border: 1px solid #e5e7eb; margin: 20px 0;">';
      return \`<p style="margin: 10px 0; color: #374151; line-height: 1.6; font-size: 15px;">\${line}</p>\`;
    });
    
    htmlLinesContent = processedLines.join('\\n');
    
    if (otpCode) {
      htmlLinesContent += \`
        <div style="text-align: center; margin: 35px 0; padding: 25px; background-color: #f5f3ff; border: 1px dashed #c0c1ff; border-radius: 12px;">
          <p style="margin: 0 0 12px 0; color: #4f46e5; font-size: 13px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase;">Código de Confirmação</p>
          <span style="font-family: monospace; font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #1e1b4b; background-color: #ffffff; padding: 12px 28px; border-radius: 8px; border: 1px solid #e0e0ff; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">\${otpCode}</span>
          <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 12px;">Copie e cole este código para redefinir sua senha de forma segura.</p>
        </div>
      \`;
    }
  } else {
    const lines = text.split('\\n');
    const htmlLines = lines.map(line => {
      if (line.trim() === '') return '<br>';
      if (line.trim() === '---') return '<hr style="border: 1px solid #e5e7eb; margin: 20px 0;">';
      return \`<p style="margin: 10px 0; color: #374151; line-height: 1.6;">\${line}</p>\`;
    });
    htmlLinesContent = htmlLines.join('\\n');
  }

  const currentYear = new Date().getFullYear();
  
  const htmlBody = \`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeEngine Learn</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; margin-top: 20px; margin-bottom: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.025em;">CodeEngine Learn</h1>
      <p style="color: rgba(255, 255, 255, 0.8); margin: 10px 0 0 0; font-size: 14px;">Ecossistema Premium de Conhecimento Digital</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px; background-color: #ffffff;">
      \${htmlLinesContent}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #f3f4f6;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
        © \${currentYear} CodeEngine Learn. Todos os direitos reservados.
      </p>
      <p style="color: #9ca3af; font-size: 11px; margin: 0 0 10px 0;">
        Você está recebendo este e-mail porque é membro da CodeEngine Learn.
      </p>
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
        📧 codeengine2@gmail.com | 📱 WhatsApp: +244 957 459 336
      </p>
    </div>
  </div>
</body>
</html>
  \`;
  
  item.json.html_body = htmlBody;
}
return $input.all();
`,
    };

    @node({
        id: '54b41694-2813-45fc-a9e8-ead82c0d11ef',
        webhookId: 'e1d57277-9410-4689-b9c3-89c9cac0a833',
        name: 'Gmail Send',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [740, 200],
        credentials: { gmailOAuth2: { id: 'oXrvGYnxloEk9Wab', name: 'Gmail account' } },
    })
    GmailSend = {
        resource: 'message',
        operation: 'send',
        sendTo: '={{ $json.member_email }}',
        subject: '={{ $json.subject }}',
        emailType: 'html',
        message: '={{ $json.html_body }}',
    };

    @node({
        id: '34c0bf5c-bda3-407b-afcf-c70d2bf5c680',
        name: 'Mark Email Sent',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [960, 200],
    })
    MarkEmailSent = {
        url: 'https://ffdqqiunkzhtgbgaojay.supabase.co/rest/v1/rpc/mark_email_sent',
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
        jsonBody: '{"email_id": "{{ $(\'Get Pending Emails\').item.json.id }}"}',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.GetPendingEmails.in(0));
        this.ManualTrigger.out(0).to(this.GetPendingEmails.in(0));
        this.GetPendingEmails.out(0).to(this.FormatEmailToHtml.in(0));
        this.FormatEmailToHtml.out(0).to(this.GmailSend.in(0));
        this.GmailSend.out(0).to(this.MarkEmailSent.in(0));
    }
}
