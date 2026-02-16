# TypeBox Documentation Test Suite

## Overview

This test suite validates all code examples from [`docs/concepts/typebox.md`](../../../docs/concepts/typebox.md), ensuring the TypeBox protocol documentation remains accurate and functional.

## Test File

**Location:** `src/gateway/protocol/typebox-docs.test.ts`

## Test Coverage

### ✅ All 19 Tests Passing

#### 1. Protocol Frame Validation (6 tests)
- ✅ Validates connect request frame from docs
- ✅ Validates connect params from docs
- ✅ Validates hello-ok response from docs
- ✅ Validates health request frame from docs
- ✅ Validates health response frame from docs
- ✅ Validates tick event frame from docs

#### 2. Minimal Client Example (2 tests)
- ✅ Minimal client flow: connect + health
- ✅ Receives tick events after connect

#### 3. Worked Example: system.echo (4 tests)
- ✅ Validates system.echo params schema
- ✅ Validates system.echo result schema
- ✅ system.echo request frame structure
- ✅ system.echo response frame structure

#### 4. Frame Structure Validation (3 tests)
- ✅ All request frames have required fields
- ✅ Response frames support both success and error
- ✅ Event frames include optional sequence numbers

#### 5. Protocol Compatibility (2 tests)
- ✅ Supports minProtocol and maxProtocol negotiation
- ✅ Client modes are correctly typed

#### 6. Idempotency Keys (2 tests)
- ✅ Side-effect methods include idempotencyKey in params
- ✅ Agent method includes idempotencyKey

## What's Tested

### Documentation Examples

1. **Protocol Frames**
   - Connect request/response frames
   - Health check frames
   - Tick event frames
   - All frame types match the documentation examples exactly

2. **Minimal WebSocket Client**
   - Complete connect → health flow
   - WebSocket connection lifecycle
   - Event reception (tick events)
   - Token-based authentication

3. **TypeBox Schema Examples**
   - Custom schema definitions (system.echo)
   - Schema validation
   - Request/response frame structures

4. **Protocol Features**
   - Protocol version negotiation (minProtocol/maxProtocol)
   - Client mode types (cli, ui, node)
   - Idempotency key patterns
   - Success and error response formats

## Running the Tests

```bash
# Run only these tests
pnpm vitest run src/gateway/protocol/typebox-docs.test.ts

# Run with verbose output
pnpm vitest run src/gateway/protocol/typebox-docs.test.ts --reporter=verbose

# Watch mode for development
pnpm vitest watch src/gateway/protocol/typebox-docs.test.ts
```

## Test Architecture

### Gateway Server Setup
- Starts a real Gateway server on port `18799`
- Uses token-based authentication
- Binds to loopback interface
- Properly cleans up after tests

### WebSocket Client Tests
- Uses real WebSocket connections
- Tests complete message flows
- Validates protocol compliance
- Tests both sync and async patterns

### Validation Tests
- Uses actual protocol validators (AJV-based)
- Tests TypeBox schema compliance
- Validates frame structures
- Tests type safety

## Maintaining Documentation Sync

When updating `docs/concepts/typebox.md`:

1. **Add New Examples**: Add corresponding test cases
2. **Change Examples**: Update matching tests
3. **Run Tests**: Ensure all tests pass before committing
4. **Keep in Sync**: Tests should exactly match documentation

## Implementation Details

### Authentication
Tests use token-based auth to match production scenarios:
```typescript
const testToken = "test-token-12345";
server = await startGatewayServer(port, {
  bind: "loopback",
  auth: { mode: "token", token: testToken },
});
```

### Frame Validation
All frames are validated using the actual protocol validators:
```typescript
expect(validateRequestFrame(connectFrame)).toBe(true);
expect(validateConnectParams(params)).toBe(true);
```

### Client Flow Testing
Real WebSocket connections test the full protocol:
```typescript
ws.send(JSON.stringify({ type: "req", method: "connect", ... }));
ws.on("message", (data) => { /* validate responses */ });
```

## Benefits

1. **Documentation Accuracy**: Ensures examples in docs actually work
2. **Regression Prevention**: Catches protocol changes that break examples
3. **Living Documentation**: Tests serve as executable specifications
4. **Type Safety**: Validates TypeScript types match runtime behavior
5. **Protocol Compliance**: Verifies frames match schema definitions

## Related Files

- **Documentation**: [`docs/concepts/typebox.md`](../../../docs/concepts/typebox.md)
- **Test Suite**: [`src/gateway/protocol/typebox-docs.test.ts`](./typebox-docs.test.ts)
- **Protocol Schemas**: [`src/gateway/protocol/schema.ts`](./schema.ts)
- **Protocol Validators**: [`src/gateway/protocol/index.ts`](./index.ts)

## Test Results

```
Test Files  1 passed (1)
Tests      19 passed (19)
Duration   ~6.7s
```

## Continuous Integration

These tests run as part of the standard test suite:
```bash
pnpm test
```

They ensure the TypeBox documentation remains accurate across all changes to the gateway protocol.
