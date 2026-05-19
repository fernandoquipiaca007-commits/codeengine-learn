# Requirements Document

## Introduction

Este documento especifica os requisitos para implementar o método de pagamento FastPay/FaciPay como segunda opção de pagamento na plataforma de e-commerce CodeEngine Learn, mantendo o Stripe como método principal. O FastPay é um método de pagamento voltado para Angola que funciona através de links de pagamento fixos, upload manual de comprovativo e aprovação manual pelo administrador.

## Glossary

- **Payment_Gateway**: Sistema responsável por processar pagamentos (Stripe ou FastPay)
- **Payment_Method_Selector**: Interface que permite ao usuário escolher entre Stripe e FastPay
- **FastPay_Link**: URL fixa de pagamento configurada por produto no painel administrativo
- **Payment_Proof**: Comprovativo de pagamento enviado pelo usuário após pagamento via FastPay
- **Order**: Pedido de compra criado quando usuário seleciona FastPay
- **Order_Status**: Estado do pedido FastPay (pending, completed, failed)
- **Admin_Approval_Panel**: Interface administrativa para aprovar/rejeitar pagamentos FastPay
- **Member**: Usuário autenticado na plataforma
- **Product**: Item digital disponível para compra
- **Discount**: Desconto, cupom ou recompensa aplicável apenas ao Stripe
- **Notification_System**: Sistema de notificações in-app e por email
- **Supabase**: Backend database e storage utilizado pela plataforma

## Requirements

### Requirement 1: Payment Method Selection

**User Story:** Como usuário, quero escolher entre Stripe e FastPay ao clicar "Comprar Agora", para que eu possa usar o método de pagamento mais conveniente para mim.

#### Acceptance Criteria

1. WHEN a Member clicks the "Comprar Agora" button on a Product, THE Payment_Method_Selector SHALL display a modal or screen with two payment options
2. THE Payment_Method_Selector SHALL display "Stripe (Internacional)" as the first option with appropriate branding
3. THE Payment_Method_Selector SHALL display "FastPay (Angola)" as the second option with appropriate branding
4. WHEN a Member selects Stripe, THE Payment_Gateway SHALL redirect to the existing Stripe checkout flow
5. WHEN a Member selects FastPay, THE Payment_Gateway SHALL redirect to the FastPay payment flow
6. THE Payment_Method_Selector SHALL display clear descriptions for each payment method
7. THE Payment_Method_Selector SHALL be responsive and work on mobile and desktop devices

### Requirement 2: FastPay Link Configuration

**User Story:** Como administrador, quero configurar links de pagamento FastPay por produto, para que cada produto tenha seu próprio link de pagamento fixo.

#### Acceptance Criteria

1. THE Admin_Approval_Panel SHALL provide a field "Link de Pagamento FastPay" in the product form
2. WHEN an administrator creates or edits a Product, THE Admin_Approval_Panel SHALL allow input of a FastPay_Link URL
3. THE Admin_Approval_Panel SHALL validate that the FastPay_Link is a valid URL format
4. THE Admin_Approval_Panel SHALL store the FastPay_Link in the products table
5. WHEN a FastPay_Link is not configured for a Product, THE Payment_Method_Selector SHALL only display the Stripe option
6. THE Admin_Approval_Panel SHALL allow administrators to update or remove FastPay_Link at any time

### Requirement 3: FastPay Payment Flow

**User Story:** Como usuário, quero ser redirecionado para o link FastPay, pagar, e fazer upload do comprovativo, para que minha compra seja processada.

#### Acceptance Criteria

1. WHEN a Member selects FastPay, THE Payment_Gateway SHALL create an Order with status "pending"
2. THE Payment_Gateway SHALL redirect the Member to the configured FastPay_Link in a new tab
3. THE Payment_Gateway SHALL display instructions explaining the FastPay payment process
4. WHEN the Member returns from FastPay_Link, THE Payment_Gateway SHALL display an upload interface for Payment_Proof
5. THE Payment_Gateway SHALL accept image files (JPG, PNG, PDF) up to 10MB for Payment_Proof
6. WHEN a Member uploads Payment_Proof, THE Payment_Gateway SHALL store the file in Supabase storage
7. THE Payment_Gateway SHALL update the Order status to include proof_uploaded timestamp
8. THE Payment_Gateway SHALL send a confirmation notification to the Member that proof was received
9. THE Payment_Gateway SHALL display estimated approval time of up to 24 hours

### Requirement 4: Discount Exclusion for FastPay

**User Story:** Como sistema, quero garantir que descontos não se apliquem ao FastPay, para que apenas o valor original do produto seja cobrado via FastPay.

#### Acceptance Criteria

1. WHEN a Member selects FastPay, THE Payment_Gateway SHALL use the original Product price without any Discount
2. THE Payment_Method_Selector SHALL display a notice that discounts only apply to Stripe payments
3. WHEN a Member has an active Discount and selects FastPay, THE Payment_Gateway SHALL show the full price
4. WHEN a Member selects Stripe, THE Payment_Gateway SHALL apply all eligible Discount values normally
5. THE Order SHALL store the full Product price when payment method is FastPay

### Requirement 5: Admin Approval Panel

**User Story:** Como administrador, quero visualizar pedidos pendentes e aprovar/rejeitar pagamentos FastPay, para que eu possa validar comprovantes manualmente.

#### Acceptance Criteria

1. THE Admin_Approval_Panel SHALL display a list of all Order records with status "pending"
2. THE Admin_Approval_Panel SHALL show Order details including Member name, Product name, amount, and upload timestamp
3. WHEN an administrator clicks on an Order, THE Admin_Approval_Panel SHALL display the uploaded Payment_Proof
4. THE Admin_Approval_Panel SHALL provide an "Aprovar" button for each pending Order
5. THE Admin_Approval_Panel SHALL provide a "Rejeitar" button for each pending Order
6. WHEN an administrator clicks "Aprovar", THE Admin_Approval_Panel SHALL update Order_Status to "completed"
7. WHEN an administrator clicks "Rejeitar", THE Admin_Approval_Panel SHALL update Order_Status to "failed"
8. THE Admin_Approval_Panel SHALL provide a text field for administrators to add a message when rejecting
9. THE Admin_Approval_Panel SHALL display Order history with timestamps for all status changes
10. THE Admin_Approval_Panel SHALL allow filtering Orders by status (pending, completed, failed)
11. THE Admin_Approval_Panel SHALL allow searching Orders by Member name or Product name

### Requirement 6: Order Status Management

**User Story:** Como sistema, quero gerenciar estados de pedidos FastPay, para que o fluxo de aprovação seja rastreável e consistente.

#### Acceptance Criteria

1. WHEN an Order is created, THE Payment_Gateway SHALL set Order_Status to "pending"
2. WHEN an Order is approved, THE Payment_Gateway SHALL set Order_Status to "completed"
3. WHEN an Order is rejected, THE Payment_Gateway SHALL set Order_Status to "failed"
4. WHEN Order_Status changes to "completed", THE Payment_Gateway SHALL grant the Member access to the Product
5. WHEN Order_Status changes to "completed", THE Payment_Gateway SHALL create a purchase record in the purchases table
6. WHEN Order_Status changes to "failed", THE Payment_Gateway SHALL NOT grant Product access
7. THE Payment_Gateway SHALL store timestamps for each Order_Status transition
8. THE Payment_Gateway SHALL store the administrator ID who approved or rejected the Order

### Requirement 7: Product Access After Approval

**User Story:** Como usuário, quero acessar meu produto imediatamente após aprovação, para que eu possa começar a usar o conteúdo adquirido.

#### Acceptance Criteria

1. WHEN an Order is approved, THE Payment_Gateway SHALL create a purchase record linking Member to Product
2. THE Payment_Gateway SHALL grant the Member download access to the Product files
3. THE Payment_Gateway SHALL display the Product in the Member's library immediately after approval
4. THE Payment_Gateway SHALL use the same access mechanism as Stripe purchases for consistency
5. WHEN a Member accesses their library, THE Payment_Gateway SHALL display both Stripe and FastPay purchases

### Requirement 8: Notification System

**User Story:** Como usuário, quero receber notificações sobre o status do meu pagamento FastPay, para que eu saiba quando minha compra foi aprovada ou rejeitada.

#### Acceptance Criteria

1. WHEN a Member uploads Payment_Proof, THE Notification_System SHALL send an in-app notification confirming receipt
2. WHEN a Member uploads Payment_Proof, THE Notification_System SHALL send an email confirming receipt
3. WHEN an Order is approved, THE Notification_System SHALL send an in-app notification to the Member
4. WHEN an Order is approved, THE Notification_System SHALL send an email to the Member with download instructions
5. WHEN an Order is rejected, THE Notification_System SHALL send an in-app notification to the Member with the rejection reason
6. WHEN an Order is rejected, THE Notification_System SHALL send an email to the Member with the rejection reason
7. THE Notification_System SHALL display all FastPay-related notifications in the Member's notification dropdown
8. THE Notification_System SHALL mark notifications as read when the Member views them

### Requirement 9: User Experience and Transparency

**User Story:** Como usuário, quero entender claramente o processo FastPay e tempo de aprovação, para que eu tenha expectativas realistas sobre quando receberei meu produto.

#### Acceptance Criteria

1. THE Payment_Method_Selector SHALL display a clear description of the FastPay process before selection
2. THE Payment_Gateway SHALL display step-by-step instructions during the FastPay flow
3. THE Payment_Gateway SHALL display "Aprovação em até 24 horas" prominently after proof upload
4. THE Payment_Gateway SHALL provide a link to check Order status in the Member dashboard
5. THE Payment_Gateway SHALL display professional and reassuring messaging throughout the process
6. THE Payment_Gateway SHALL provide a way for Members to contact support if approval takes longer than 24 hours

### Requirement 10: Member Dashboard Order Tracking

**User Story:** Como usuário, quero visualizar o status dos meus pedidos FastPay no meu painel, para que eu possa acompanhar o progresso da aprovação.

#### Acceptance Criteria

1. THE Member dashboard SHALL display a section for "Pedidos FastPay Pendentes"
2. THE Member dashboard SHALL show Order details including Product name, amount, upload date, and current status
3. THE Member dashboard SHALL display a status badge (Pendente, Concluído, Rejeitado) for each Order
4. WHEN an Order is pending, THE Member dashboard SHALL display "Aguardando aprovação"
5. WHEN an Order is completed, THE Member dashboard SHALL display "Aprovado" with a link to download
6. WHEN an Order is failed, THE Member dashboard SHALL display "Rejeitado" with the rejection reason
7. THE Member dashboard SHALL allow Members to view their uploaded Payment_Proof
8. THE Member dashboard SHALL display the estimated approval time for pending Orders

### Requirement 11: Database Schema for FastPay Orders

**User Story:** Como sistema, quero armazenar pedidos FastPay em uma estrutura de dados adequada, para que todas as informações sejam rastreáveis e auditáveis.

#### Acceptance Criteria

1. THE Payment_Gateway SHALL create a "fastpay_orders" table in Supabase
2. THE fastpay_orders table SHALL include columns: id, member_id, product_id, amount, status, proof_url, created_at, updated_at, approved_by, approved_at, rejected_by, rejected_at, rejection_reason
3. THE Payment_Gateway SHALL enforce foreign key constraints on member_id and product_id
4. THE Payment_Gateway SHALL create indexes on member_id, product_id, and status for query performance
5. THE Payment_Gateway SHALL use Row Level Security (RLS) policies to ensure Members can only view their own Orders
6. THE Payment_Gateway SHALL allow administrators to view all Orders regardless of RLS policies

### Requirement 12: Security and Validation

**User Story:** Como sistema, quero validar uploads e prevenir fraudes, para que apenas comprovantes legítimos sejam processados.

#### Acceptance Criteria

1. THE Payment_Gateway SHALL validate that uploaded files are valid image or PDF formats
2. THE Payment_Gateway SHALL scan uploaded files for malware before storing
3. THE Payment_Gateway SHALL enforce a maximum file size of 10MB for Payment_Proof
4. THE Payment_Gateway SHALL prevent duplicate Order creation for the same Member and Product combination
5. THE Payment_Gateway SHALL require authentication before allowing Payment_Proof upload
6. THE Payment_Gateway SHALL log all Order status changes with administrator ID and timestamp for audit trail
7. THE Payment_Gateway SHALL rate-limit Order creation to prevent abuse (maximum 5 pending orders per Member)

### Requirement 13: Admin Configuration and Settings

**User Story:** Como administrador, quero configurar opções globais do FastPay, para que eu possa controlar a disponibilidade e comportamento do método de pagamento.

#### Acceptance Criteria

1. THE Admin_Approval_Panel SHALL provide a global toggle to enable/disable FastPay site-wide
2. THE Admin_Approval_Panel SHALL allow configuration of maximum pending orders per Member
3. THE Admin_Approval_Panel SHALL allow configuration of auto-rejection after a specified number of days
4. THE Admin_Approval_Panel SHALL display statistics including total pending, approved, and rejected orders
5. THE Admin_Approval_Panel SHALL display average approval time metrics
6. WHEN FastPay is disabled globally, THE Payment_Method_Selector SHALL only show Stripe option

### Requirement 14: Integration with Existing Stripe Flow

**User Story:** Como sistema, quero manter a funcionalidade Stripe existente intacta, para que usuários que preferem Stripe não sejam afetados pela adição do FastPay.

#### Acceptance Criteria

1. WHEN a Member selects Stripe, THE Payment_Gateway SHALL use the existing Stripe checkout implementation without modification
2. THE Payment_Gateway SHALL continue to apply Discount values to Stripe purchases as before
3. THE Payment_Gateway SHALL continue to process Stripe webhooks for automatic fulfillment
4. THE Payment_Gateway SHALL maintain backward compatibility with existing Stripe purchase records
5. THE Payment_Gateway SHALL not modify the existing purchases table schema for Stripe transactions

### Requirement 15: Error Handling and Edge Cases

**User Story:** Como sistema, quero lidar com erros graciosamente, para que usuários tenham uma experiência confiável mesmo quando problemas ocorrem.

#### Acceptance Criteria

1. WHEN FastPay_Link is not configured for a Product, THE Payment_Method_Selector SHALL display an error message and only show Stripe
2. WHEN Payment_Proof upload fails, THE Payment_Gateway SHALL display a clear error message and allow retry
3. WHEN Supabase storage is unavailable, THE Payment_Gateway SHALL queue the upload and notify the Member
4. WHEN an administrator attempts to approve an already-approved Order, THE Admin_Approval_Panel SHALL prevent duplicate approval
5. WHEN a Member attempts to upload proof for a non-existent Order, THE Payment_Gateway SHALL return a 404 error
6. THE Payment_Gateway SHALL log all errors to a monitoring system for administrator review
7. WHEN network errors occur during FastPay redirect, THE Payment_Gateway SHALL provide a manual link to the FastPay_Link

## Notes

### Technical Implementation Considerations

- **Database**: Utilizar Supabase para armazenar fastpay_orders e Payment_Proof files
- **Storage**: Utilizar Supabase Storage bucket dedicado para comprovantes (fastpay-proofs)
- **Authentication**: Reutilizar sistema de autenticação existente (supabase.auth)
- **Admin Access**: Reutilizar sistema de permissões admin existente
- **Email Service**: Integrar com email-service.js existente para notificações
- **Frontend**: Adicionar componentes React para Payment_Method_Selector e upload de comprovantes
- **Backend**: Adicionar endpoints REST no stripe-server.ts para operações FastPay

### Payment Methods Supported by FastPay

FastPay suporta os seguintes métodos de pagamento em Angola:
- Multicaixa Express
- TPA (Terminais de Pagamento Automático)
- Transferência bancária
- QR Code

### Approval Time SLA

- Tempo esperado de aprovação: até 24 horas
- Notificação automática se aprovação ultrapassar 24 horas
- Auto-rejeição configurável após X dias (padrão: 7 dias)

### Future Enhancements (Out of Scope)

- Integração automática com API FastPay (quando disponível)
- Webhooks FastPay para aprovação automática
- Suporte a reembolsos FastPay
- Relatórios financeiros consolidados Stripe + FastPay
