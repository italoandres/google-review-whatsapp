# Implementation Plan: WhatsApp Auto-Import

## Overview

This implementation plan breaks down the WhatsApp Auto-Import feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The implementation follows the existing Express/TypeScript/Supabase architecture and maintains backward compatibility with all existing features.

## Tasks

- [x] 1. Database schema extension and migration
  - Create migration script to add `import_source` column to `clients` table
  - Create `evolution_api_config` table with RLS policies
  - Update TypeScript interfaces in `backend/src/lib/supabase.ts` to include new fields
  - Test migration on development database
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 1.1 Write property test for migration data preservation
  - **Property 27: Migration Data Preservation**
  - **Validates: Requirements 9.5**

- [ ]* 1.2 Write property test for migration default import source
  - **Property 28: Migration Default Import Source**
  - **Validates: Requirements 9.6**

- [x] 2. Implement encryption utilities
  - Create `backend/src/utils/encryption.ts` with `encryptApiKey` and `decryptApiKey` functions
  - Use AES-256-CBC with IV
  - Add `ENCRYPTION_KEY` to environment variables
  - _Requirements: 1.5, 7.3_

- [ ]* 2.1 Write property test for encryption round-trip
  - **Property 1: API Key Encryption Round-Trip**
  - **Validates: Requirements 1.5**

- [x] 3. Implement phone normalization utility
  - Create `backend/src/utils/phoneNormalizer.ts` with `normalizePhone` function
  - Handle various formats (spaces, dashes, parentheses)
  - Convert to E.164 format
  - Handle Brazilian and international numbers
  - _Requirements: 3.4, 6.1, 6.2_

- [ ]* 3.1 Write property test for phone normalization
  - **Property 11: Phone Normalization to E.164**
  - **Validates: Requirements 3.4, 6.1, 6.2**

- [ ]* 3.2 Write property test for equivalent phone duplicate detection
  - **Property 18: Equivalent Phone Number Duplicate Detection**
  - **Validates: Requirements 6.2**

- [ ]* 3.3 Write unit tests for phone normalization edge cases
  - Test empty strings, too short, too long
  - Test various country codes
  - _Requirements: 6.1, 6.2_

- [x] 4. Implement signature validation utility
  - Create `backend/src/utils/signatureValidator.ts` with `validateSignature` function
  - Use HMAC-SHA256 with constant-time comparison
  - _Requirements: 2.2, 2.3, 7.4_

- [ ]* 4.1 Write property test for invalid signature rejection
  - **Property 5: Invalid Signature Rejection**
  - **Validates: Requirements 2.3, 7.4**

- [ ]* 4.2 Write unit tests for signature validation
  - Test valid signatures
  - Test invalid signatures
  - Test missing signatures
  - _Requirements: 2.2, 2.3_

- [x] 5. Implement Evolution API configuration model
  - Create `backend/src/models/evolutionConfig.ts`
  - Implement `getConfig`, `saveConfig`, `toggleEnabled` functions
  - Use encryption utilities for API key storage
  - _Requirements: 1.2, 4.4_

- [ ]* 5.1 Write property test for credential storage
  - **Property 3: Credential Storage After Successful Connection**
  - **Validates: Requirements 1.2**

- [ ]* 5.2 Write property test for configuration loading
  - **Property 14: Configuration Loading Completeness**
  - **Validates: Requirements 4.7**

- [ ]* 5.3 Write unit tests for configuration model
  - Test save with encryption
  - Test load with decryption
  - Test toggle enable/disable
  - _Requirements: 1.2, 4.4_

- [x] 6. Implement Evolution API connection testing
  - Add `testConnection` function to `evolutionConfig.ts`
  - Make GET request to Evolution API `/instance/connectionState/{instanceName}`
  - Handle connection success and failure
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]* 6.1 Write property test for connection validation
  - **Property 2: Connection Validation Correctness**
  - **Validates: Requirements 1.1, 1.3**

- [ ]* 6.2 Write property test for URL format support
  - **Property 4: URL Format Support**
  - **Validates: Requirements 1.4**

- [ ]* 6.3 Write unit tests for connection testing
  - Test successful connection
  - Test failed connection
  - Test invalid URL
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement contact extraction utility
  - Create `backend/src/utils/contactExtractor.ts` with `extractContact` function
  - Extract phone from `remoteJid` (remove @s.whatsapp.net)
  - Extract name from `pushName` or use phone as fallback
  - Filter out messages where `fromMe` is true
  - _Requirements: 2.4, 3.6_

- [ ]* 8.1 Write property test for contact extraction
  - **Property 6: Contact Extraction from Valid Payloads**
  - **Validates: Requirements 2.4, 3.6**

- [ ]* 8.2 Write unit tests for contact extraction
  - Test with valid payload
  - Test with missing pushName
  - Test with fromMe=true (should return null)
  - _Requirements: 2.4, 3.6_

- [x] 9. Extend client model for auto-import
  - Update `backend/src/models/client.ts` to include `importSource` field
  - Add `createAutoImportedClient` function
  - Update `checkPhoneExists` to use normalized phone
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ]* 9.1 Write property test for client creation
  - **Property 8: Client Creation for New Phone Numbers**
  - **Validates: Requirements 3.1**

- [ ]* 9.2 Write property test for auto-imported client completeness
  - **Property 9: Auto-Imported Client Record Completeness**
  - **Validates: Requirements 3.2**

- [ ]* 9.3 Write property test for duplicate prevention
  - **Property 10: Duplicate Prevention Idempotence**
  - **Validates: Requirements 3.3, 6.3**

- [ ]* 9.4 Write property test for message content exclusion
  - **Property 12: Message Content Exclusion**
  - **Validates: Requirements 3.5, 7.1, 7.2**

- [ ]* 9.5 Write property test for manual registration import source
  - **Property 15: Manual Registration Import Source**
  - **Validates: Requirements 5.1**

- [x] 10. Implement webhook endpoint
  - Create `backend/src/routes/evolution.ts` with webhook endpoint
  - POST `/api/webhooks/evolution` - receive Evolution API events
  - Validate signature using `signatureValidator`
  - Extract contact using `contactExtractor`
  - Normalize phone using `phoneNormalizer`
  - Check duplicate using `checkPhoneExists`
  - Create client using `createAutoImportedClient`
  - Implement rate limiting (100 requests/minute)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 10.1 Write property test for error response on processing failure
  - **Property 7: Error Response on Processing Failure**
  - **Validates: Requirements 2.6**

- [ ]* 10.2 Write property test for auto-import toggle enforcement
  - **Property 13: Auto-Import Toggle Enforcement**
  - **Validates: Requirements 4.4**

- [ ]* 10.3 Write property test for country code differentiation
  - **Property 20: Country Code Differentiation**
  - **Validates: Requirements 6.5**

- [ ]* 10.4 Write property test for sensitive information exclusion
  - **Property 21: Sensitive Information Exclusion from Error Logs**
  - **Validates: Requirements 7.6**

- [ ]* 10.5 Write property test for processing resilience
  - **Property 23: Processing Resilience**
  - **Validates: Requirements 8.2**

- [ ]* 10.6 Write unit tests for webhook endpoint
  - Test valid webhook processing
  - Test invalid signature rejection
  - Test missing fields handling
  - Test rate limiting
  - Test duplicate phone handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

- [x] 11. Implement Evolution API configuration endpoints
  - Add to `backend/src/routes/evolution.ts`:
  - GET `/api/evolution/config` - get current configuration
  - POST `/api/evolution/config` - save configuration
  - POST `/api/evolution/test-connection` - test connection
  - POST `/api/evolution/toggle` - enable/disable auto-import
  - Apply `authMiddleware` to all endpoints
  - _Requirements: 1.1, 1.2, 1.3, 4.4, 4.7_

- [ ]* 11.1 Write unit tests for configuration endpoints
  - Test get config (with masking)
  - Test save config
  - Test test connection
  - Test toggle enable/disable
  - _Requirements: 1.1, 1.2, 1.3, 4.4_

- [x] 12. Implement health check endpoint
  - Add GET `/api/health/evolution` to `backend/src/routes/evolution.ts`
  - Check Evolution API connectivity
  - Return 503 if disconnected
  - _Requirements: 8.4, 8.5_

- [ ]* 12.1 Write property test for health check failure response
  - **Property 25: Health Check Failure Response**
  - **Validates: Requirements 8.5**

- [ ]* 12.2 Write unit tests for health check
  - Test when configured and connected
  - Test when not configured
  - Test when disconnected
  - _Requirements: 8.4, 8.5_

- [x] 13. Implement logging for webhook events
  - Add logging to webhook endpoint for:
  - Connection failures
  - Processing failures
  - Registration failures
  - Successful registrations
  - Validation failures (without sensitive data)
  - _Requirements: 7.6, 8.1, 8.2, 8.3, 8.6_

- [ ]* 13.1 Write property test for connection failure logging
  - **Property 22: Connection Failure Logging**
  - **Validates: Requirements 8.1**

- [ ]* 13.2 Write property test for registration failure logging
  - **Property 24: Registration Failure Logging**
  - **Validates: Requirements 8.3**

- [ ]* 13.3 Write property test for success logging
  - **Property 26: Success Logging**
  - **Validates: Requirements 8.6**

- [x] 14. Register Evolution API routes in server
  - Import `evolutionRoutes` in `backend/src/server.ts`
  - Add `app.use('/api/evolution', evolutionRoutes)`
  - Add `app.use('/api/webhooks/evolution', evolutionRoutes)`
  - _Requirements: 2.1_

- [x] 15. Checkpoint - Test backend integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Update client list to support import source filtering
  - Modify `backend/src/routes/clients.ts` GET `/api/clients` endpoint
  - Add optional query parameter `importSource` for filtering
  - Update `getClientsByUserId` in `backend/src/models/client.ts` to support filtering
  - _Requirements: 5.4, 5.5_

- [ ]* 16.1 Write property test for client list inclusivity
  - **Property 16: Client List Inclusivity**
  - **Validates: Requirements 5.4**

- [ ]* 16.2 Write property test for import source filtering
  - **Property 17: Import Source Filtering**
  - **Validates: Requirements 5.5**

- [ ]* 16.3 Write unit tests for client filtering
  - Test without filter (returns all)
  - Test with "manual" filter
  - Test with "auto-imported" filter
  - _Requirements: 5.4, 5.5_

- [x] 17. Verify manual registration still works
  - Test existing POST `/api/clients` endpoint
  - Verify `import_source` is set to "manual"
  - Verify duplicate phone detection works
  - _Requirements: 5.1, 5.2, 6.4_

- [ ]* 17.1 Write property test for manual registration duplicate error
  - **Property 19: Manual Registration Duplicate Error**
  - **Validates: Requirements 6.4**

- [ ]* 17.2 Write unit tests for manual registration preservation
  - Test manual registration creates client with import_source="manual"
  - Test duplicate phone returns error
  - _Requirements: 5.1, 5.2, 6.4_

- [x] 18. Create Evolution API configuration page component
  - Create `frontend/src/pages/EvolutionConfigPage.tsx`
  - Add form with fields: API URL, API Key, Instance Name, Webhook Secret
  - Add "Test Connection" button with loading state
  - Add "Enable Auto-Import" toggle
  - Add "Save Configuration" button
  - Mask API Key field (type="password")
  - Display success/error messages
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

- [ ]* 18.1 Write unit tests for configuration page
  - Test form rendering
  - Test form submission
  - Test connection button
  - Test toggle interaction
  - Test API key masking
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

- [x] 19. Add Evolution API service to frontend
  - Create `frontend/src/services/evolutionApi.ts`
  - Implement functions: `getConfig`, `saveConfig`, `testConnection`, `toggleAutoImport`
  - Use existing `api.ts` axios instance
  - _Requirements: 1.1, 1.2, 4.4_

- [x] 20. Add Evolution API configuration route
  - Update `frontend/src/main.tsx` to add route for `/evolution-config`
  - Add navigation link in sidebar/menu
  - _Requirements: 4.1_

- [x] 21. Update clients page to show import source
  - Modify `frontend/src/pages/ClientsPage.tsx`
  - Add "Import Source" column to client table
  - Add filter dropdown for import source (All, Manual, Auto-Imported)
  - Display badge/icon to differentiate manual vs auto-imported
  - _Requirements: 5.4, 5.5_

- [ ]* 21.1 Write unit tests for client page filtering
  - Test filter dropdown
  - Test filtering by import source
  - Test display of import source badge
  - _Requirements: 5.4, 5.5_

- [x] 22. Update API service to support client filtering
  - Modify `frontend/src/services/api.ts` `getClients` function
  - Add optional `importSource` parameter
  - _Requirements: 5.5_

- [x] 23. Add environment variable documentation
  - Update README.md with `ENCRYPTION_KEY` setup instructions
  - Document how to generate encryption key
  - Document Evolution API webhook URL configuration
  - _Requirements: 1.5, 7.3_

- [x] 24. Create database migration script
  - Create `migrations/add_evolution_api_support.sql`
  - Include all schema changes from design document
  - Add rollback script
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 25. Final checkpoint - Integration testing
  - Run all unit tests and property tests
  - Test end-to-end flow: configure Evolution API → receive webhook → verify client created
  - Test manual registration still works
  - Test duplicate prevention
  - Verify no regressions in existing features
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation maintains full backward compatibility with existing manual registration
- All new code follows existing TypeScript/Express/Supabase patterns
