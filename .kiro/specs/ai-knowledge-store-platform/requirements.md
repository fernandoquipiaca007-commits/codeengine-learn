# Requirements Document

## Introduction

A plataforma AI Knowledge Store é um sistema completo de e-commerce para produtos digitais (ebooks, cursos, conteúdos) com foco em automação, sincronização em tempo real e entrega automatizada. O sistema é composto por três componentes principais: Store Frontend (site público de vendas), Admin Dashboard (gerenciamento), e Supabase como hub central de dados, autenticação e sincronização em tempo real. A plataforma integra-se com Stripe para processamento de pagamentos e automação financeira.

## Glossary

- **Store_Frontend**: Site público onde usuários navegam, visualizam e compram produtos digitais  vai estar nesse repositório https://github.com/fernandoquipiaca007-commits/CodeEngine   como essa conta do github fernandoquipiaca007@gmail.com
- **Admin_Dashboard**: Aplicação separada para gerenciamento de produtos, uploads, métricas e analytics
- **Supabase**: Plataforma backend que fornece banco de dados PostgreSQL, autenticação, realtime subscriptions e storage
- **Stripe**: Plataforma de pagamentos que processa transações e envia webhooks de confirmação
- **Product**: Item digital disponível para venda (ebook, curso, conteúdo)
- **Member**: Usuário registrado na plataforma com conta e autenticação
- **Purchase**: Registro de transação completada vinculando member e product
- **Signed_URL**: URL temporária e segura para download de arquivos privados do Supabase Storage
- **Webhook**: Notificação HTTP enviada pelo Stripe para confirmar eventos de pagamento
- **RLS**: Row Level Security - sistema de permissões do Supabase que controla acesso a dados por usuário
- **Realtime_Sync**: Sincronização automática de dados entre Supabase e clientes conectados
- **Checkout_Session**: Sessão de pagamento criada no Stripe para processar compra
- **Storage_Bucket**: Container de arquivos no Supabase Storage (público ou privado)
- **Analytics**: Métricas e dados estatísticos sobre vendas, produtos e membros
- **Coupon**: Código de desconto aplicável a produtos
- **Category**: Classificação de produtos por tipo ou tema
- **Preview**: Amostra gratuita de conteúdo do produto (vídeo, páginas, capítulo)
- **Backend_Service**: Serviço que processa webhooks, valida pagamentos e gerencia entregas
- **Email_Service**: Sistema automatizado de envio de emails transacionais
- **Product_Parser**: Componente que processa e valida metadados de produtos
- **Product_Printer**: Componente que formata dados de produtos para exibição
- **Purchase_Parser**: Componente que processa e valida dados de compras
- **Purchase_Printer**: Componente que formata dados de compras para exibição

## Requirements

### Requirement 1: Product Management

**User Story:** As an administrator, I want to create and manage digital products with complete metadata, so that products are available for sale in the store with all necessary information.

#### Acceptance Criteria

1. WHEN an administrator creates a product, THE Admin_Dashboard SHALL capture title, description, category, price, cover image, preview content, promotional video, tags, call-to-action text, Stripe Price ID, storage link, and status
2. WHEN an administrator uploads product files, THE Admin_Dashboard SHALL store cover images in product-covers bucket, preview content in product-previews bucket, videos in product-videos bucket, and digital products in ebooks-private bucket
3. WHEN product metadata is saved, THE Admin_Dashboard SHALL validate all required fields are present and properly formatted
4. THE Product_Parser SHALL parse product metadata into a Product object
5. WHEN invalid product metadata is provided, THE Product_Parser SHALL return a descriptive error message
6. THE Product_Printer SHALL format Product objects into valid product metadata
7. FOR ALL valid Product objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
8. WHEN product data is saved to Supabase, THE Supabase SHALL store metadata in the products table with proper data types
9. WHEN a product is created or updated, THE Supabase SHALL broadcast realtime updates to all connected Store_Frontend clients
10. WHEN the Store_Frontend receives a realtime update, THE Store_Frontend SHALL display the new or updated product immediately without page refresh

### Requirement 2: Product Display and Discovery

**User Story:** As a customer, I want to browse and discover digital products with detailed information, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. THE Store_Frontend SHALL display all active products from the products table
2. WHEN a customer views the product list, THE Store_Frontend SHALL show product title, cover image, price, category, and brief description
3. WHEN a customer clicks on a product, THE Store_Frontend SHALL display complete product details including full description, preview content, promotional video, tags, and call-to-action
4. WHEN a product has preview content, THE Store_Frontend SHALL allow customers to view or download preview without authentication
5. WHEN a product has a promotional video, THE Store_Frontend SHALL embed and play the video from the product-videos bucket
6. THE Store_Frontend SHALL filter products by category when requested
7. THE Store_Frontend SHALL search products by title, description, or tags when search query is provided
8. WHEN product data changes in Supabase, THE Store_Frontend SHALL update the display in realtime without requiring page refresh

### Requirement 3: Checkout and Payment Processing

**User Story:** As a customer, I want to securely purchase digital products using Stripe, so that I can access the content immediately after payment.

#### Acceptance Criteria

1. WHEN a customer clicks purchase on a product, THE Store_Frontend SHALL create a Stripe Checkout_Session with product details and pricing
2. WHEN creating a Checkout_Session, THE Store_Frontend SHALL include customer email, product ID, and success/cancel URLs
3. WHEN a Checkout_Session is created successfully, THE Store_Frontend SHALL redirect the customer to the Stripe checkout page
4. WHEN a customer completes payment, THE Stripe SHALL send a webhook notification to the Backend_Service
5. WHEN the Backend_Service receives a webhook, THE Backend_Service SHALL validate the webhook signature using Stripe secret key
6. IF webhook signature validation fails, THEN THE Backend_Service SHALL reject the request and log the security event
7. WHEN a valid payment confirmation webhook is received, THE Backend_Service SHALL extract customer email, product ID, and transaction details
8. WHEN payment is confirmed, THE Backend_Service SHALL create a purchase record in the purchases table linking member and product
9. WHEN a coupon code is applied, THE Store_Frontend SHALL validate the coupon exists in the coupons table and apply the discount to the Checkout_Session
10. WHEN a coupon is used, THE Backend_Service SHALL record coupon usage in the purchases table

### Requirement 4: Purchase Management and Recording

**User Story:** As the system, I want to accurately record and manage purchase transactions, so that customers receive proper access to purchased products.

#### Acceptance Criteria

1. WHEN a purchase is created, THE Backend_Service SHALL store member ID, product ID, purchase date, amount paid, payment status, transaction ID, and coupon code if applicable
2. THE Purchase_Parser SHALL parse purchase data into a Purchase object
3. WHEN invalid purchase data is provided, THE Purchase_Parser SHALL return a descriptive error message
4. THE Purchase_Printer SHALL format Purchase objects into valid purchase records
5. FOR ALL valid Purchase objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
6. WHEN a purchase is recorded, THE Supabase SHALL enforce RLS policies ensuring only the purchasing member can access their purchase records
7. WHEN a purchase is created, THE Supabase SHALL broadcast realtime notification to the purchasing member
8. THE Backend_Service SHALL prevent duplicate purchase records for the same transaction ID
9. WHEN a purchase record is created, THE Backend_Service SHALL update analytics table with new sale data
10. WHEN a purchase is completed, THE Backend_Service SHALL record the download entry in the downloads table

### Requirement 5: Automated Product Delivery

**User Story:** As a customer, I want to receive immediate access to purchased digital products, so that I can start using the content right away.

#### Acceptance Criteria

1. WHEN a purchase is confirmed, THE Backend_Service SHALL generate a Signed_URL for the digital product file in ebooks-private bucket
2. WHEN generating a Signed_URL, THE Backend_Service SHALL set expiration time to 24 hours
3. WHEN a Signed_URL is generated, THE Backend_Service SHALL send an email to the customer containing the download link
4. WHEN sending delivery email, THE Email_Service SHALL include product title, download link, expiration notice, and access instructions
5. IF email delivery fails, THEN THE Backend_Service SHALL retry up to 3 times with exponential backoff
6. WHEN a customer accesses their member area, THE Store_Frontend SHALL display all purchased products with active download links
7. WHEN a Signed_URL expires, THE Member SHALL be able to request a new download link from their member area
8. WHEN a member requests a new download link, THE Backend_Service SHALL verify the purchase exists and generate a new Signed_URL
9. THE Backend_Service SHALL log all download link generations in the downloads table with timestamp and member ID
10. WHEN a download is initiated, THE Supabase SHALL serve the file from ebooks-private bucket only if the Signed_URL is valid

### Requirement 6: Member Authentication and Account Management

**User Story:** As a customer, I want to create an account and manage my profile, so that I can access my purchases and manage my information.

#### Acceptance Criteria

1. WHEN a customer registers, THE Store_Frontend SHALL collect email and password and create account via Supabase authentication
2. WHEN creating an account, THE Supabase SHALL hash the password and store authentication credentials securely
3. WHEN account creation succeeds, THE Supabase SHALL create a member record in the members table with email and registration date
4. WHEN a member logs in, THE Store_Frontend SHALL authenticate credentials via Supabase and establish an authenticated session
5. WHEN authentication fails, THE Store_Frontend SHALL display an error message and prevent access to protected areas
6. WHEN a member requests password recovery, THE Store_Frontend SHALL trigger Supabase password reset flow and send recovery email
7. WHEN a member is authenticated, THE Store_Frontend SHALL display member-specific content including purchases and downloads
8. THE Supabase SHALL enforce RLS policies ensuring members can only access their own data
9. WHEN a member logs out, THE Store_Frontend SHALL terminate the session and clear authentication tokens
10. WHEN a member updates profile information, THE Store_Frontend SHALL save changes to the members table

### Requirement 7: Member Area and Purchase History

**User Story:** As a member, I want to view my purchase history and access my digital products, so that I can download content I have purchased.

#### Acceptance Criteria

1. WHEN a member accesses their member area, THE Store_Frontend SHALL display all purchases from the purchases table for that member
2. WHEN displaying purchases, THE Store_Frontend SHALL show product title, purchase date, amount paid, and download status
3. WHEN a member clicks on a purchased product, THE Store_Frontend SHALL display product details and active download link
4. WHEN a member requests a download, THE Store_Frontend SHALL call Backend_Service to generate a new Signed_URL
5. WHEN displaying download links, THE Store_Frontend SHALL show expiration time remaining
6. THE Store_Frontend SHALL allow members to filter purchases by date range or product category
7. WHEN a member receives a notification, THE Store_Frontend SHALL display unread notifications in the member area
8. WHEN a member views a notification, THE Store_Frontend SHALL mark it as read in the notifications table
9. WHEN purchase data updates in Supabase, THE Store_Frontend SHALL update the member area display in realtime
10. THE Store_Frontend SHALL display total number of purchases and total amount spent in member dashboard

### Requirement 8: Admin Analytics and Reporting

**User Story:** As an administrator, I want to view comprehensive analytics and reports, so that I can make informed business decisions.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display total sales count from the purchases table
2. THE Admin_Dashboard SHALL display total revenue by summing amount paid from all purchases
3. THE Admin_Dashboard SHALL identify and display top-selling products by purchase count
4. THE Admin_Dashboard SHALL display total download count from the downloads table
5. THE Admin_Dashboard SHALL calculate and display conversion rate as purchases divided by unique visitors
6. THE Admin_Dashboard SHALL display total member count from the members table
7. THE Admin_Dashboard SHALL display monthly revenue by grouping purchases by month
8. THE Admin_Dashboard SHALL display coupon usage statistics by counting purchases with coupon codes
9. THE Admin_Dashboard SHALL display sales by category by grouping purchases by product category
10. WHEN analytics data changes, THE Admin_Dashboard SHALL update displays in realtime via Supabase subscriptions

### Requirement 9: Storage and File Management

**User Story:** As the system, I want to securely store and serve digital product files, so that content is protected and accessible only to authorized users.

#### Acceptance Criteria

1. THE Supabase SHALL provide a product-covers bucket for public product cover images
2. THE Supabase SHALL provide a product-previews bucket for public preview content
3. THE Supabase SHALL provide a product-videos bucket for public promotional videos
4. THE Supabase SHALL provide an ebooks-private bucket for private digital product files
5. THE Supabase SHALL enforce public read access on product-covers, product-previews, and product-videos buckets
6. THE Supabase SHALL enforce private access on ebooks-private bucket requiring Signed_URL for downloads
7. WHEN an administrator uploads a file, THE Admin_Dashboard SHALL validate file type and size before upload
8. WHEN uploading to Supabase Storage, THE Admin_Dashboard SHALL organize files by product ID in folder structure
9. THE Supabase SHALL reject file uploads exceeding configured size limits
10. WHEN a file is deleted from Admin_Dashboard, THE Supabase SHALL remove the file from the storage bucket

### Requirement 10: Security and Access Control

**User Story:** As the system, I want to enforce strict security and access controls, so that data and content are protected from unauthorized access.

#### Acceptance Criteria

1. THE Supabase SHALL enforce RLS policies on all database tables
2. THE Supabase SHALL allow members to read only their own records in purchases, downloads, and notifications tables
3. THE Supabase SHALL allow only authenticated administrators to write to products, categories, and coupons tables
4. THE Supabase SHALL allow only authenticated members to read from products and categories tables
5. WHEN a webhook is received, THE Backend_Service SHALL validate the Stripe webhook signature before processing
6. IF webhook signature is invalid, THEN THE Backend_Service SHALL reject the request with 401 status code
7. THE Backend_Service SHALL use environment variables for all API keys and secrets
8. THE Backend_Service SHALL never expose Stripe secret keys or Supabase service role keys to frontend clients
9. WHEN generating Signed_URLs, THE Backend_Service SHALL use Supabase service role credentials
10. THE Supabase SHALL enforce HTTPS for all API requests and storage access

### Requirement 11: Realtime Synchronization

**User Story:** As a user, I want to see updates immediately without refreshing the page, so that I have the most current information at all times.

#### Acceptance Criteria

1. WHEN a product is created in Admin_Dashboard, THE Supabase SHALL broadcast the new product to all Store_Frontend clients via realtime channel
2. WHEN a product is updated in Admin_Dashboard, THE Supabase SHALL broadcast the changes to all Store_Frontend clients via realtime channel
3. WHEN a product is deleted in Admin_Dashboard, THE Supabase SHALL broadcast the deletion to all Store_Frontend clients via realtime channel
4. WHEN Store_Frontend receives a product creation event, THE Store_Frontend SHALL add the product to the display without page refresh
5. WHEN Store_Frontend receives a product update event, THE Store_Frontend SHALL update the product display without page refresh
6. WHEN Store_Frontend receives a product deletion event, THE Store_Frontend SHALL remove the product from display without page refresh
7. WHEN a purchase is completed, THE Supabase SHALL send realtime notification to the purchasing member
8. WHEN a member is viewing their member area, THE Store_Frontend SHALL display new purchases immediately via realtime updates
9. THE Store_Frontend SHALL establish realtime subscription on component mount and clean up on unmount
10. IF realtime connection is lost, THEN THE Store_Frontend SHALL attempt to reconnect automatically

### Requirement 12: Email Notifications

**User Story:** As a customer, I want to receive email notifications for important events, so that I stay informed about my purchases and account activity.

#### Acceptance Criteria

1. WHEN a purchase is completed, THE Email_Service SHALL send a purchase confirmation email to the customer
2. WHEN sending purchase confirmation, THE Email_Service SHALL include product title, purchase date, amount paid, and download link
3. WHEN a member creates an account, THE Email_Service SHALL send a welcome email with account details
4. WHEN a member requests password reset, THE Email_Service SHALL send a password reset email with secure reset link
5. WHEN a download link is about to expire, THE Email_Service SHALL send a reminder email 2 hours before expiration
6. THE Email_Service SHALL use transactional email templates with consistent branding
7. THE Email_Service SHALL include unsubscribe link in all marketing emails but not in transactional emails
8. WHEN email sending fails, THE Backend_Service SHALL log the error and retry up to 3 times
9. THE Email_Service SHALL track email delivery status and store in notifications table
10. WHEN a member views their notifications, THE Store_Frontend SHALL display email delivery status

### Requirement 13: Coupon Management

**User Story:** As an administrator, I want to create and manage discount coupons, so that I can run promotions and offer discounts to customers.

#### Acceptance Criteria

1. WHEN an administrator creates a coupon, THE Admin_Dashboard SHALL capture coupon code, discount type (percentage or fixed), discount value, expiration date, usage limit, and applicable products
2. WHEN a coupon is saved, THE Admin_Dashboard SHALL validate coupon code is unique in the coupons table
3. WHEN a customer applies a coupon code, THE Store_Frontend SHALL verify the coupon exists and is valid
4. WHEN validating a coupon, THE Store_Frontend SHALL check expiration date is in the future and usage limit is not exceeded
5. IF a coupon is invalid or expired, THEN THE Store_Frontend SHALL display an error message and not apply the discount
6. WHEN a valid coupon is applied, THE Store_Frontend SHALL calculate discounted price and display savings amount
7. WHEN a purchase is completed with a coupon, THE Backend_Service SHALL increment coupon usage count in the coupons table
8. THE Admin_Dashboard SHALL display coupon usage statistics including total uses and revenue impact
9. WHEN a coupon reaches usage limit, THE Store_Frontend SHALL reject further applications of that coupon
10. THE Admin_Dashboard SHALL allow administrators to deactivate coupons before expiration date

### Requirement 14: Category Management

**User Story:** As an administrator, I want to organize products into categories, so that customers can easily find products by type or topic.

#### Acceptance Criteria

1. WHEN an administrator creates a category, THE Admin_Dashboard SHALL capture category name, description, and display order
2. THE Admin_Dashboard SHALL validate category name is unique in the categories table
3. WHEN assigning a product to a category, THE Admin_Dashboard SHALL reference the category ID in the products table
4. THE Store_Frontend SHALL display category navigation menu with all active categories
5. WHEN a customer selects a category, THE Store_Frontend SHALL filter and display only products in that category
6. THE Store_Frontend SHALL display product count for each category in the navigation menu
7. WHEN a category is updated, THE Supabase SHALL broadcast changes to all Store_Frontend clients via realtime
8. THE Admin_Dashboard SHALL allow administrators to reorder categories by updating display order
9. WHEN a category is deleted, THE Admin_Dashboard SHALL prevent deletion if products are assigned to that category
10. THE Store_Frontend SHALL display category name and description on category pages

### Requirement 15: Video Preview Management

**User Story:** As an administrator, I want to upload and manage video previews for products, so that customers can see product content before purchasing.

#### Acceptance Criteria

1. WHEN an administrator uploads a video preview, THE Admin_Dashboard SHALL store the video file in the product-videos bucket
2. WHEN uploading video, THE Admin_Dashboard SHALL validate file format is MP4, WebM, or OGG
3. WHEN uploading video, THE Admin_Dashboard SHALL validate file size does not exceed 100MB
4. WHEN video upload completes, THE Admin_Dashboard SHALL save video URL in the products table
5. WHEN a customer views a product with video preview, THE Store_Frontend SHALL embed and play the video
6. THE Store_Frontend SHALL use HTML5 video player with play, pause, volume, and fullscreen controls
7. THE Store_Frontend SHALL display video thumbnail before playback starts
8. WHEN video fails to load, THE Store_Frontend SHALL display an error message and fallback content
9. THE Admin_Dashboard SHALL allow administrators to replace or delete video previews
10. WHEN a video is deleted, THE Admin_Dashboard SHALL remove the file from product-videos bucket and clear the URL from products table

### Requirement 16: Download Tracking and Analytics

**User Story:** As an administrator, I want to track all product downloads, so that I can monitor content delivery and user engagement.

#### Acceptance Criteria

1. WHEN a member downloads a product, THE Backend_Service SHALL record the download in the downloads table
2. WHEN recording a download, THE Backend_Service SHALL capture member ID, product ID, download timestamp, and IP address
3. THE Admin_Dashboard SHALL display total download count per product
4. THE Admin_Dashboard SHALL display download history with member email, product title, and timestamp
5. THE Admin_Dashboard SHALL allow filtering downloads by date range, product, or member
6. THE Admin_Dashboard SHALL display most downloaded products in analytics dashboard
7. THE Admin_Dashboard SHALL calculate average downloads per purchase for each product
8. WHEN a member views their download history, THE Store_Frontend SHALL display all downloads from the downloads table for that member
9. THE Backend_Service SHALL prevent recording duplicate downloads within 5 minutes from the same member for the same product
10. THE Admin_Dashboard SHALL export download data to CSV format when requested

### Requirement 17: Search Functionality

**User Story:** As a customer, I want to search for products by keywords, so that I can quickly find specific content I'm interested in.

#### Acceptance Criteria

1. WHEN a customer enters a search query, THE Store_Frontend SHALL search product titles, descriptions, and tags
2. THE Store_Frontend SHALL display search results ranked by relevance
3. THE Store_Frontend SHALL highlight matching keywords in search results
4. WHEN no results are found, THE Store_Frontend SHALL display a helpful message and suggest browsing categories
5. THE Store_Frontend SHALL display search result count
6. THE Store_Frontend SHALL allow filtering search results by category
7. THE Store_Frontend SHALL allow sorting search results by relevance, price, or date added
8. THE Store_Frontend SHALL debounce search input to avoid excessive queries
9. WHEN search query is less than 3 characters, THE Store_Frontend SHALL not execute search
10. THE Store_Frontend SHALL display recent searches for authenticated members

### Requirement 18: Responsive Design and Mobile Support

**User Story:** As a customer, I want to access the store on any device, so that I can browse and purchase products from desktop, tablet, or mobile.

#### Acceptance Criteria

1. THE Store_Frontend SHALL render properly on screen widths from 320px to 2560px
2. THE Store_Frontend SHALL use responsive layout that adapts to screen size
3. WHEN viewed on mobile devices, THE Store_Frontend SHALL display touch-friendly navigation and buttons
4. THE Store_Frontend SHALL optimize images for different screen sizes and resolutions
5. THE Store_Frontend SHALL use mobile-first CSS approach with progressive enhancement
6. WHEN viewed on mobile, THE Store_Frontend SHALL collapse navigation menu into hamburger menu
7. THE Store_Frontend SHALL ensure text is readable without zooming on mobile devices
8. THE Store_Frontend SHALL support touch gestures for image galleries and video controls
9. THE Admin_Dashboard SHALL be fully functional on tablet devices
10. THE Store_Frontend SHALL load quickly on mobile networks by optimizing asset sizes

### Requirement 19: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN an error occurs in Backend_Service, THE Backend_Service SHALL log error message, stack trace, timestamp, and context
2. WHEN a webhook processing fails, THE Backend_Service SHALL log the webhook payload and error details
3. WHEN a payment fails, THE Backend_Service SHALL log the failure reason and notify administrators
4. THE Store_Frontend SHALL display user-friendly error messages without exposing technical details
5. WHEN an API request fails, THE Store_Frontend SHALL retry up to 3 times with exponential backoff
6. IF all retries fail, THEN THE Store_Frontend SHALL display an error message and suggest contacting support
7. THE Backend_Service SHALL log all webhook events with status (success, failure, retry)
8. THE Admin_Dashboard SHALL display recent error logs with filtering by severity and timestamp
9. WHEN a critical error occurs, THE Backend_Service SHALL send alert notification to administrators
10. THE Backend_Service SHALL rotate log files daily and retain logs for 30 days

### Requirement 20: Performance and Scalability

**User Story:** As the system, I want to handle high traffic and large data volumes efficiently, so that the platform remains fast and reliable as it grows.

#### Acceptance Criteria

1. THE Store_Frontend SHALL load initial page content within 2 seconds on standard broadband connection
2. THE Store_Frontend SHALL implement lazy loading for product images and videos
3. THE Store_Frontend SHALL cache product data in browser for 5 minutes to reduce API calls
4. THE Supabase SHALL use database indexes on frequently queried columns (product ID, member ID, purchase date)
5. THE Backend_Service SHALL process webhook events asynchronously to avoid blocking
6. THE Store_Frontend SHALL paginate product lists showing 20 products per page
7. THE Admin_Dashboard SHALL paginate analytics data showing 50 records per page
8. THE Supabase SHALL use connection pooling to handle concurrent database requests efficiently
9. THE Store_Frontend SHALL implement code splitting to reduce initial bundle size
10. THE Backend_Service SHALL handle at least 100 concurrent webhook requests without degradation
