# Requirements Document

## Introduction

This feature integrates Evolution API with the existing Google Review WhatsApp System to automatically capture and register clients from WhatsApp conversations in real-time. The system will monitor incoming WhatsApp messages via Evolution API, extract contact information, and automatically create client records in the database, eliminating the need for manual client registration while preserving all existing functionality.

## Glossary

- **Evolution_API**: Open-source WhatsApp API service that connects via QR Code (WhatsApp Web protocol)
- **Auto_Import_Service**: Backend service that processes Evolution API webhooks and registers clients
- **Client_Record**: Database entry containing client information (name, phone, registration date, import source)
- **Webhook_Endpoint**: HTTP endpoint that receives real-time events from Evolution API
- **Configuration_Interface**: Frontend UI for managing Evolution API settings
- **Manual_Registration**: Existing feature allowing users to manually add clients
- **Import_Source**: Field indicating whether a client was manually registered or auto-imported

## Requirements

### Requirement 1: Evolution API Connection

**User Story:** As a business owner, I want to connect my WhatsApp account to the system via Evolution API, so that the system can monitor incoming messages.

#### Acceptance Criteria

1. WHEN a user provides Evolution API credentials (API URL, API Key, Instance Name), THE System SHALL validate the connection to Evolution API
2. WHEN the connection is successful, THE System SHALL store the credentials securely in Supabase
3. WHEN the connection fails, THE System SHALL return a descriptive error message indicating the failure reason
4. THE System SHALL support both self-hosted and cloud-hosted Evolution API instances
5. WHEN Evolution API credentials are stored, THE System SHALL encrypt the API Key before storage

### Requirement 2: Webhook Event Processing

**User Story:** As a system, I want to receive and process webhook events from Evolution API, so that I can capture new contact information in real-time.

#### Acceptance Criteria

1. THE Auto_Import_Service SHALL expose a webhook endpoint at `/api/webhooks/evolution` to receive Evolution API events
2. WHEN a webhook event is received, THE Auto_Import_Service SHALL validate the webhook signature within 100ms
3. WHEN the webhook signature is invalid, THE Auto_Import_Service SHALL reject the request with HTTP 401
4. WHEN a valid webhook event contains a new message, THE Auto_Import_Service SHALL extract the sender's phone number and name
5. THE Auto_Import_Service SHALL process webhook events within 5 seconds of receipt
6. WHEN webhook processing fails, THE Auto_Import_Service SHALL log the error and return HTTP 500
7. THE Auto_Import_Service SHALL implement rate limiting of 100 requests per minute on the webhook endpoint

### Requirement 3: Automatic Client Registration

**User Story:** As a business owner, I want clients who message me on WhatsApp to be automatically registered in the system, so that I don't have to manually add them.

#### Acceptance Criteria

1. WHEN a message is received from a phone number that does not exist in the database, THE Auto_Import_Service SHALL create a new Client_Record
2. WHEN creating a Client_Record, THE Auto_Import_Service SHALL store the phone number, contact name, current timestamp, and mark Import_Source as "auto-imported"
3. WHEN a message is received from a phone number that already exists in the database, THE Auto_Import_Service SHALL not create a duplicate Client_Record
4. THE Auto_Import_Service SHALL normalize phone numbers to E.164 format before duplicate checking
5. WHEN a Client_Record is created, THE Auto_Import_Service SHALL only store contact information (name and phone number), not message content
6. WHEN the contact name is not available from Evolution API, THE Auto_Import_Service SHALL use the phone number as the name

### Requirement 4: Configuration Management Interface

**User Story:** As a business owner, I want to configure Evolution API settings through a user-friendly interface, so that I can easily set up and manage the integration.

#### Acceptance Criteria

1. THE Configuration_Interface SHALL provide input fields for API URL, API Key, and Instance Name
2. WHEN a user clicks the "Test Connection" button, THE Configuration_Interface SHALL send a test request to Evolution API and display the result
3. THE Configuration_Interface SHALL provide a toggle to enable or disable automatic client import
4. WHEN auto-import is disabled, THE Auto_Import_Service SHALL not process webhook events for client registration
5. WHEN Evolution API settings are saved, THE Configuration_Interface SHALL display a success confirmation message
6. THE Configuration_Interface SHALL mask the API Key field to prevent shoulder surfing
7. WHEN loading existing settings, THE Configuration_Interface SHALL populate all fields with current values

### Requirement 5: Manual Registration Preservation

**User Story:** As a business owner, I want to continue using manual client registration, so that I can add clients who don't contact me via WhatsApp.

#### Acceptance Criteria

1. WHEN a user manually registers a client, THE System SHALL create a Client_Record with Import_Source marked as "manual"
2. THE System SHALL continue to support all existing manual client registration functionality without modification
3. THE System SHALL continue to support manual WhatsApp link sending functionality without modification
4. WHEN viewing clients, THE System SHALL display both manually registered and auto-imported clients
5. THE System SHALL allow filtering clients by Import_Source (manual or auto-imported)

### Requirement 6: Duplicate Prevention

**User Story:** As a business owner, I want the system to prevent duplicate client records, so that my client database remains clean and accurate.

#### Acceptance Criteria

1. WHEN checking for duplicates, THE Auto_Import_Service SHALL normalize phone numbers by removing spaces, dashes, and parentheses
2. WHEN checking for duplicates, THE Auto_Import_Service SHALL compare phone numbers in E.164 format
3. WHEN a duplicate phone number is detected during auto-import, THE Auto_Import_Service SHALL skip client creation and log the event
4. WHEN a duplicate phone number is detected during manual registration, THE System SHALL display an error message to the user
5. THE System SHALL treat phone numbers with different country codes as different clients

### Requirement 7: Security and Privacy

**User Story:** As a business owner, I want client data to be handled securely and privately, so that I comply with data protection regulations.

#### Acceptance Criteria

1. THE Auto_Import_Service SHALL only capture and store contact information (name and phone number) from webhook events
2. THE Auto_Import_Service SHALL not store message content, media files, or conversation history
3. WHEN storing Evolution API credentials, THE System SHALL encrypt the API Key using AES-256 encryption
4. THE Webhook_Endpoint SHALL validate webhook signatures using HMAC-SHA256
5. THE Webhook_Endpoint SHALL implement rate limiting to prevent abuse
6. WHEN webhook validation fails, THE Auto_Import_Service SHALL log the attempt without exposing sensitive information
7. THE System SHALL store all client data in Supabase with row-level security policies enabled

### Requirement 8: Error Handling and Monitoring

**User Story:** As a system administrator, I want comprehensive error handling and logging, so that I can troubleshoot issues and monitor system health.

#### Acceptance Criteria

1. WHEN Evolution API connection fails, THE System SHALL log the error with timestamp and failure reason
2. WHEN webhook processing fails, THE Auto_Import_Service SHALL log the error and continue processing subsequent events
3. WHEN client registration fails, THE Auto_Import_Service SHALL log the error with the phone number and failure reason
4. THE System SHALL provide a health check endpoint at `/api/health/evolution` that verifies Evolution API connectivity
5. WHEN the health check fails, THE System SHALL return HTTP 503 with error details
6. THE Auto_Import_Service SHALL log all successful client registrations with timestamp and source phone number

### Requirement 9: Database Schema Extension

**User Story:** As a developer, I want the database schema to support auto-import functionality, so that the system can distinguish between manual and auto-imported clients.

#### Acceptance Criteria

1. THE Client_Record table SHALL include an `import_source` column with values "manual" or "auto-imported"
2. THE Client_Record table SHALL include a `created_at` timestamp column
3. THE System SHALL create a new `evolution_api_config` table to store Evolution API credentials
4. THE `evolution_api_config` table SHALL include columns for api_url, encrypted_api_key, instance_name, and is_enabled
5. THE System SHALL apply database migrations without data loss to existing Client_Record entries
6. WHEN migrating existing data, THE System SHALL set Import_Source to "manual" for all existing Client_Record entries

### Requirement 10: Performance Requirements

**User Story:** As a business owner, I want the system to process incoming messages quickly, so that clients are registered in near real-time.

#### Acceptance Criteria

1. THE Auto_Import_Service SHALL process webhook events within 5 seconds of receipt
2. THE Auto_Import_Service SHALL validate webhook signatures within 100ms
3. THE Auto_Import_Service SHALL perform duplicate checking within 200ms
4. WHEN the database is under load, THE Auto_Import_Service SHALL queue webhook events for processing
5. THE System SHALL support processing at least 10 concurrent webhook events without performance degradation
