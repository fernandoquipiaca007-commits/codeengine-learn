import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : undefined
// Nodes   : 6  |  Connections: 6
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// SendGmailAsAlias                   httpRequest                [creds] [executeOnce]
// FormatEmailPayload                 code                       [executeOnce]
// SplitOutAttachments                splitOut
// IfAttachments                      if
// DownloadAttachments                httpRequest
// WebhookTrigger                     webhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WebhookTrigger
//    → IfAttachments
//      → SplitOutAttachments
//        → DownloadAttachments
//          → FormatEmailPayload
//            → SendGmailAsAlias
//     .out(1) → DownloadAttachments (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: undefined,
    name: undefined,
    active: undefined,
})
export class NodeWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'f3959088-8592-4a56-bd3e-c09a5400d0b7',
        name: 'Send Gmail as Alias',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.2,
        position: [320, -120],
        credentials: { gmailOAuth2: { id: 'dYMJkolmCuPd6mtn', name: 'vendramin.work' } },
        executeOnce: true,
    })
    SendGmailAsAlias = {
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        method: 'POST',
        options: {},
        sendBody: true,
        authentication: 'predefinedCredentialType',
        bodyParameters: {
            parameters: [
                {
                    name: 'raw',
                    value: '={{ $json.encoded_message }}',
                },
            ],
        },
        nodeCredentialType: 'gmailOAuth2',
    };

    @node({
        id: '1e88749c-f3fd-4c56-8db2-db101855088e',
        name: 'Format Email Payload',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [100, -125],
        executeOnce: true,
    })
    FormatEmailPayload = {
        jsCode: `// ===========================
// FIELD VALIDATION
// ===========================
// Define which fields are absolutely required for sending an email
const requiredFields = ['fromEmail', 'toEmail', 'subject', 'htmlBody'];
const inputData = $input.first().json.body;
const missingFields = [];

// Check each required field to ensure it exists and has a value
requiredFields.forEach(field => {
 if (!inputData[field]) {
   missingFields.push(field);
 }
});

// If any required fields are missing, throw an error immediately
if (missingFields.length > 0) {
 throw new Error(\`Missing required fields: \${missingFields.join(', ')}\`);
}

// ===========================
// EMAIL CONFIGURATION SETUP
// ===========================
// Build email configuration object with required fields and optional fields
// Optional fields will be null if not provided, required fields are guaranteed to exist
const emailConfig = {
 senderName: inputData.senderName || null,    // Optional: Display name for sender
 fromEmail: inputData.fromEmail,              // Required: Email address to send from (must be verified alias)
 replyTo: inputData.replyTo || null,          // Optional: Different reply-to address
 toEmail: inputData.toEmail,                  // Required: Recipient email address
 subject: inputData.subject,                  // Required: Email subject line
 htmlBody: inputData.htmlBody                 // Required: HTML content of the email
};

// ===========================
// DEBUG LOGGING
// ===========================
// Log all available data to help troubleshoot issues
console.log('Available data:', JSON.stringify($input.all(), null, 2));
console.log('Binary keys:', Object.keys($binary || {}));
console.log('Binary data:', $binary);

// ===========================
// ATTACHMENT PROCESSING
// ===========================
// Get all binary data keys from the previous node (files to attach)
const binaryKeys = Object.keys($binary || {});
const attachments = [];

// Process each binary file found in the $binary object
binaryKeys.forEach(key => {
 const binaryFile = $binary[key];
 console.log(\`Processing binary key: \${key}\`, binaryFile);
 
 // Only add files that have actual data
 if (binaryFile && binaryFile.data) {
   attachments.push({
     data: binaryFile.data,                                    // Base64 encoded file data
     fileName: binaryFile.fileName || \`\${key}.pdf\`,           // Use original filename or create one
     mimeType: binaryFile.mimeType || 'application/pdf'       // Use detected MIME type or default to PDF
   });
 }
});

console.log('Processed attachments:', attachments.length);

// ===========================
// FALLBACK ATTACHMENT DETECTION
// ===========================
// If no attachments found using $binary, try alternative approach
// Some nodes might store binary data in item.binary instead
if (attachments.length === 0) {
 console.log('No attachments found in $binary, trying alternative approach...');
 
 // Try accessing the data property directly from the input item
 const item = $input.first();
 if (item.binary && Object.keys(item.binary).length > 0) {
   console.log('Found binary data in item.binary');
   
   Object.keys(item.binary).forEach(key => {
     const binaryFile = item.binary[key];
     attachments.push({
       data: binaryFile.data,
       fileName: binaryFile.fileName || \`\${key}.pdf\`,
       mimeType: binaryFile.mimeType || 'application/pdf'
     });
   });
 }
}

// ===========================
// HTML BODY PROCESSING
// ===========================
// Replace any {{FILE_COUNT}} placeholder in the HTML with actual attachment count
const updatedHtmlBody = emailConfig.htmlBody.replace('{{FILE_COUNT}}', attachments.length);

// ===========================
// MIME MESSAGE CONSTRUCTION
// ===========================
// Generate a unique boundary string for the multipart MIME message
// This separates different parts of the email (body, attachments, etc.)
const boundary = \`----=_Part_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;

// ===========================
// EMAIL HEADERS AND STRUCTURE
// ===========================
// Build the complete email message in RFC2822 format
// Start with headers and basic structure
let emailMessage = \`From: \${emailConfig.senderName ? \`"\${emailConfig.senderName}" <\${emailConfig.fromEmail}>\` : emailConfig.fromEmail}
To: \${emailConfig.toEmail}\${emailConfig.replyTo ? \`\\nReply-To: \${emailConfig.replyTo}\` : ''}
Subject: \${emailConfig.subject}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="\${boundary}"

--\${boundary}
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: 7bit

\${updatedHtmlBody}

\`;

// ===========================
// ATTACHMENT ADDITION
// ===========================
// Add each attachment as a separate MIME part
attachments.forEach(attachment => {
 console.log(\`Adding attachment: \${attachment.fileName}\`);
 
 emailMessage += \`--\${boundary}
Content-Type: \${attachment.mimeType}; name="\${attachment.fileName}"
Content-Disposition: attachment; filename="\${attachment.fileName}"
Content-Transfer-Encoding: base64

\${attachment.data}

\`;
});

// ===========================
// MIME MESSAGE FINALIZATION
// ===========================
// Close the multipart message with the final boundary
emailMessage += \`--\${boundary}--\`;

// ===========================
// GMAIL API ENCODING
// ===========================
// Gmail API requires the entire message to be base64url encoded
// Base64url is like base64 but uses - instead of + and _ instead of /
// and removes padding (=) characters
const encodedMessage = Buffer.from(emailMessage, 'utf8')
 .toString('base64')           // Convert to base64
 .replace(/\\+/g, '-')          // Replace + with -
 .replace(/\\//g, '_')          // Replace / with _
 .replace(/=/g, '');           // Remove padding

// ===========================
// RETURN RESULTS
// ===========================
// Return the encoded message for the Gmail API and debug information
return {
 encoded_message: encodedMessage,              // This goes to the Gmail API
 debug_info: {                                 // This helps with troubleshooting
   attachments_count: attachments.length,
   attachment_names: attachments.map(a => a.fileName),
   binary_keys_found: binaryKeys,
   has_binary: !!$binary,
   input_keys: Object.keys($input.first() || {}),
   email_config: {
     has_sender_name: !!emailConfig.senderName,
     has_reply_to: !!emailConfig.replyTo,
     from: emailConfig.fromEmail,
     to: emailConfig.toEmail,
     subject: emailConfig.subject
   }
 }
};`,
    };

    @node({
        id: '92c047a3-da23-4dbf-96a1-257384d50566',
        name: 'Split Out Attachments',
        type: 'n8n-nodes-base.splitOut',
        version: 1,
        position: [-340, -200],
    })
    SplitOutAttachments = {
        include: 'allOtherFields',
        options: {},
        fieldToSplitOut: 'body.file_urls',
    };

    @node({
        id: 'abd6a0b8-4abb-4f41-a441-2e666aff0311',
        name: 'If Attachments',
        type: 'n8n-nodes-base.if',
        version: 2.2,
        position: [-560, -125],
    })
    IfAttachments = {
        options: {},
        conditions: {
            options: {
                version: 2,
                leftValue: '',
                caseSensitive: true,
                typeValidation: 'strict',
            },
            combinator: 'and',
            conditions: [
                {
                    id: 'f293e2a3-4cba-48e9-8c8d-43119df14d57',
                    operator: {
                        type: 'array',
                        operation: 'notEmpty',
                        singleValue: true,
                    },
                    leftValue: '={{ $json.body.file_urls }}',
                    rightValue: '',
                },
            ],
        },
    };

    @node({
        id: '5ead651a-836e-411a-80ae-5a0af1236eec',
        name: 'Download Attachments',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.2,
        position: [-120, -125],
    })
    DownloadAttachments = {
        url: "={{ $json['body.file_urls'] }}",
        options: {},
    };

    @node({
        id: 'f3ae4375-1a9c-4348-8003-13930fc613a7',
        webhookId: '7e1d9448-a8f4-4db1-929a-4032602841f8',
        name: 'Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [-780, -125],
    })
    WebhookTrigger = {
        path: 'send-gmail-as-alias',
        options: {},
        httpMethod: 'POST',
        responseMode: 'lastNode',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.IfAttachments.out(0).to(this.SplitOutAttachments.in(0));
        this.IfAttachments.out(1).to(this.DownloadAttachments.in(0));
        this.WebhookTrigger.out(0).to(this.IfAttachments.in(0));
        this.DownloadAttachments.out(0).to(this.FormatEmailPayload.in(0));
        this.FormatEmailPayload.out(0).to(this.SendGmailAsAlias.in(0));
        this.SplitOutAttachments.out(0).to(this.DownloadAttachments.in(0));
    }
}
