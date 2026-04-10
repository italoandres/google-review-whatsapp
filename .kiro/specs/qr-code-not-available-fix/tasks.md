# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - QR Code Not Available Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: Evolution API responses with count=0 or missing base64 fields
  - Test that getQRCode throws QRCodeNotAvailableError when Evolution API returns {"count":0} or responses without base64 fields
  - Test cases: (1) response with count=0, (2) empty response {}, (3) response with base64=null, (4) response without qrcode field
  - Run test on UNFIXED code in backend/src/lib/evolutionApiClient.ts
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists, getQRCode returns undefined instead of throwing error)
  - Document counterexamples found (e.g., "getQRCode returns undefined when response is {"count":0}")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 2.1_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid QR Code Flow Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for valid QR code responses
  - Observe: getQRCode returns base64 string when response contains {"base64": "valid-data"}
  - Observe: getQRCode returns base64 string when response contains {"qrcode": {"base64": "valid-data"}}
  - Write property-based tests: for all responses with valid base64 field, getQRCode returns the base64 string
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code in backend/src/lib/evolutionApiClient.ts
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Fix QR Code Not Available Bug

  - [ ] 3.1 Add QR code validation in evolutionApiClient.ts
    - Add validation after receiving Evolution API response in getQRCode method
    - Check if base64 or qrcode.base64 exist and are not null/undefined
    - If absent, throw EvolutionAPIError with status 404 and message "QR Code not available"
    - Add detailed logging of response for debugging (log response body when QR code is missing)
    - _Bug_Condition: isBugCondition(response) where response.count == 0 OR base64 fields are undefined_
    - _Expected_Behavior: Throw QRCodeNotAvailableError with status 404 when QR code is absent_
    - _Preservation: Valid QR code responses must continue returning base64 string unchanged_
    - _Requirements: 1.1, 2.1, 2.2_

  - [ ] 3.2 Implement force reconnect mechanism in instanceManager.ts
    - Create new method forceReconnect(instanceName: string) in InstanceManagerService
    - Call Evolution API /instance/logout/{instanceName} to force logout
    - Wait 2 seconds after logout
    - Attempt to get new QR code using getQRCode method
    - If getQRCode fails, call /instance/restart/{instanceName} as fallback
    - Add debug logs for each step (logout, wait, retry, restart)
    - Return new QR code or throw error with clear message
    - _Bug_Condition: Instance in "connecting" state without valid QR code_
    - _Expected_Behavior: Force regeneration of QR code through logout/restart cycle_
    - _Preservation: Existing getQRCode behavior for valid responses unchanged_
    - _Requirements: 1.4, 2.4, 2.5_

  - [ ] 3.3 Add force reconnect endpoint in whatsappInstance.ts
    - Create new POST endpoint /api/whatsapp/force-reconnect
    - Accept instanceName in request body
    - Call instanceManager.forceReconnect(instanceName)
    - Return new QR code or error response
    - Add rate limiting (max 3 requests per minute per instance)
    - Add authentication middleware
    - _Bug_Condition: User needs to manually trigger QR code regeneration_
    - _Expected_Behavior: Provide API endpoint to force reconnect and get new QR code_
    - _Preservation: Existing endpoints unchanged_
    - _Requirements: 2.4, 2.5_

  - [ ] 3.4 Improve error handling in WhatsAppConnectionPage.tsx
    - Update fetchQRCode error handling to detect 404 QR code not available errors
    - When QR code not available after retries, show clear error message instead of blank screen
    - Add "Force Reconnect" button that calls new /api/whatsapp/force-reconnect endpoint
    - Show loading state during force reconnect operation
    - Display success message when new QR code is obtained
    - _Bug_Condition: Frontend shows blank screen when QR code unavailable_
    - _Expected_Behavior: Show clear error message with reconnect option_
    - _Preservation: Existing QR code display for valid responses unchanged_
    - _Requirements: 1.3, 2.3, 2.5_

  - [ ] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - QR Code Not Available Detection
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - getQRCode now throws error instead of returning undefined)
    - _Requirements: 2.1, 2.2_

  - [ ] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid QR Code Flow Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions - valid QR codes still work)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run all unit tests: npm test in backend directory
  - Run all property-based tests
  - Verify bug condition test passes (task 3.5)
  - Verify preservation tests pass (task 3.6)
  - Test manually: create instance → Evolution returns count:0 → click force reconnect → verify new QR code appears
  - Test manually: create instance → get valid QR code → verify existing flow still works
  - If any issues arise, ask user for guidance before proceeding
