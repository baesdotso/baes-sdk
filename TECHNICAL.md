# BAES SDK - Technical Documentation

This document explains the internal architecture and implementation details of the BAES SDK for developers who want to understand how it works under the hood.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Pinata Integration](#pinata-integration)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Security](#security)
- [Testing](#testing)

## Architecture Overview

The BAES SDK is built with a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Public API Layer                         │
│  BaesAppSDK (index.ts) - Main entry point                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
│  CheckpointManager - Core checkpoint operations             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│  IPFSManager - Pinata API integration                       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     External APIs                           │
│  Pinata Cloud - IPFS storage and retrieval                  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. BaesAppSDK (Public API)

**File:** `src/index.ts`

The main entry point that provides the public API. It:
- Validates configuration on initialization
- Delegates operations to CheckpointManager
- Provides a clean, simple interface for developers

```typescript
export class BaesAppSDK {
  private checkpointManager: CheckpointManager;

  constructor(config: SDKConfig) {
    // Validate required configuration
    if (!config.pinataApiKey) {
      throw new Error('Pinata API key is required');
    }
    this.checkpointManager = new CheckpointManager(config);
  }

  // Public methods delegate to CheckpointManager
  async saveCheckpoint(params: SaveCheckpointParams): Promise<void> {
    return this.checkpointManager.saveCheckpoint(params);
  }
}
```

### 2. CheckpointManager (Business Logic)

**File:** `src/core/CheckpointManager.ts`

Handles the core business logic for checkpoint operations:
- Input validation
- Data transformation
- Error handling
- Orchestrates IPFS operations

```typescript
export class CheckpointManager {
  private ipfsManager: IPFSManager;
  private version = '1.0.0';

  async saveCheckpoint(params: SaveCheckpointParams): Promise<void> {
    // 1. Validate inputs
    this.validateSaveParams(params);
    
    // 2. Create timestamp
    const timestamp = Date.now();
    
    // 3. Create IPFS record
    const record: IPFSRecord = {
      userAddress: params.userAddress,
      gameId: params.gameId,
      timestamp: timestamp,
      data: params.data,
      metadata: { version: this.version }
    };
    
    // 4. Upload to IPFS
    await this.ipfsManager.uploadCheckpoint(record);
  }
}
```

### 3. IPFSManager (Infrastructure)

**File:** `src/core/IPFSManager.ts`

Handles all Pinata API interactions:
- File uploads via `pinFileToIPFS`
- File queries via `pinList`
- File downloads via Pinata gateway
- Error handling for network operations

```typescript
export class IPFSManager {
  private pinataApiKey: string;
  private readonly PINATA_API_BASE = 'https://api.pinata.cloud';

  async uploadCheckpoint(record: IPFSRecord): Promise<string> {
    // 1. Create JSON blob
    const jsonBlob = new Blob([JSON.stringify(record)], {
      type: 'application/json'
    });

    // 2. Create FormData with metadata
    const formData = new FormData();
    formData.append('file', jsonBlob, 'checkpoint.json');
    formData.append('pinataMetadata', JSON.stringify({
      name: `checkpoint_${record.userAddress}_${record.gameId}_${record.timestamp}`,
      keyvalues: {
        userAddress: record.userAddress,
        gameId: record.gameId,
        timestamp: record.timestamp.toString(),
        type: 'checkpoint'
      }
    }));

    // 3. Upload to Pinata
    const response = await fetch(`${this.PINATA_API_BASE}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.pinataApiKey}` },
      body: formData
    });

    // 4. Return IPFS hash
    const result: PinataUploadResponse = await response.json();
    return result.IpfsHash;
  }
}
```

### 4. Types (Type Safety)

**File:** `src/core/types.ts`

Defines all TypeScript interfaces and types:
- Input/output parameter types
- Internal data structures
- Error types
- Pinata API response types

## Data Flow

### Save Checkpoint Flow

```
1. Developer calls sdk.saveCheckpoint(params)
   ↓
2. BaesAppSDK delegates to CheckpointManager
   ↓
3. CheckpointManager validates inputs
   ↓
4. CheckpointManager creates IPFSRecord with timestamp
   ↓
5. CheckpointManager calls IPFSManager.uploadCheckpoint()
   ↓
6. IPFSManager creates JSON blob and FormData
   ↓
7. IPFSManager uploads to Pinata API
   ↓
8. Pinata stores file on IPFS and returns hash
   ↓
9. IPFSManager returns hash to CheckpointManager
   ↓
10. CheckpointManager completes successfully
```

### Load Checkpoint Flow

```
1. Developer calls sdk.loadCheckpoint(params)
   ↓
2. BaesAppSDK delegates to CheckpointManager
   ↓
3. CheckpointManager validates inputs
   ↓
4. CheckpointManager calls IPFSManager.queryCheckpoints()
   ↓
5. IPFSManager queries Pinata API with metadata filters
   ↓
6. Pinata returns list of matching files
   ↓
7. IPFSManager downloads each file from Pinata gateway
   ↓
8. IPFSManager filters by timestamp and returns matching record
   ↓
9. CheckpointManager extracts and returns data
   ↓
10. BaesAppSDK returns data to developer
```

## Pinata Integration

### API Endpoints Used

1. **Upload**: `POST /pinning/pinFileToIPFS`
   - Uploads JSON files to IPFS
   - Returns IPFS hash (CID)

2. **Query**: `GET /data/pinList`
   - Queries files by metadata
   - Supports filtering by keyvalues

3. **Download**: `GET https://gateway.pinata.cloud/ipfs/{hash}`
   - Downloads files from IPFS
   - Public gateway access

### Metadata Strategy

The SDK uses Pinata's metadata system for efficient querying:

```json
{
  "name": "checkpoint_0x1234..._bario-drift_1703123456789",
  "keyvalues": {
    "userAddress": "0x1234...",
    "gameId": "bario-drift", 
    "timestamp": "1703123456789",
    "type": "checkpoint"
  }
}
```

This enables:
- Fast filtering by user and game
- Efficient querying without downloading all files
- Clear identification of checkpoint files

### Authentication

Uses JWT Bearer token authentication:
```typescript
headers: {
  'Authorization': `Bearer ${this.pinataApiKey}`
}
```

## Error Handling

### Error Hierarchy

```
SDKError (base class)
├── VALIDATION_ERROR (input validation)
├── PINATA_UPLOAD_ERROR (upload failures)
├── PINATA_DOWNLOAD_ERROR (download failures)
├── PINATA_QUERY_ERROR (query failures)
└── SAVE_CHECKPOINT_ERROR (business logic)
```

### Error Handling Strategy

1. **Input Validation**: Validate all inputs before processing
2. **Network Errors**: Handle Pinata API failures gracefully
3. **Data Validation**: Verify downloaded data integrity
4. **User-Friendly Messages**: Provide clear error messages
5. **Error Codes**: Enable programmatic error handling

```typescript
export class SDKError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SDKError';
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Batch Operations**: Query multiple checkpoints in one API call
2. **Caching**: Consider caching frequently accessed checkpoints
3. **Lazy Loading**: Only download checkpoint data when needed
4. **Compression**: JSON data is naturally compact for game states

### Rate Limiting

- **Free Tier**: 60 requests/minute
- **Paid Plans**: Higher limits available
- **Recommendation**: Implement exponential backoff for retries

### File Size Limits

- **Pinata Limit**: 10MB per file
- **Typical Game State**: < 1KB (well within limits)
- **Recommendation**: Keep checkpoint data minimal

## Security

### Data Privacy

1. **User Isolation**: Data is isolated by `userAddress`
2. **Game Isolation**: Data is further isolated by `gameId`
3. **No Central Storage**: Data stored on decentralized IPFS
4. **User Control**: Users control their own data

### API Key Security

1. **Environment Variables**: Store API keys securely
2. **Scoped Permissions**: Use minimal required permissions
3. **Key Rotation**: Rotate API keys regularly
4. **Monitoring**: Monitor API key usage

### Validation

1. **Ethereum Address Validation**: Ensures valid wallet addresses
2. **Input Sanitization**: Validates all user inputs
3. **Type Safety**: TypeScript prevents type-related errors

## Testing

### Unit Tests

Test each component in isolation:
- Input validation
- Data transformation
- Error handling

### Integration Tests

Test Pinata API integration:
- Upload functionality
- Query functionality
- Download functionality

### Mock Strategy

```typescript
// Mock Pinata API responses
const mockPinataResponse = {
  IpfsHash: 'QmTestHash123...',
  PinSize: 1024,
  Timestamp: '2024-01-01T00:00:00.000Z'
};
```

### Test Coverage

- ✅ Input validation
- ✅ Error handling
- ✅ API integration
- ✅ Data transformation
- ✅ Type safety

## Build Process

### Rollup Configuration

The SDK uses Rollup for bundling:
- **CommonJS**: For Node.js compatibility
- **ES Modules**: For modern bundlers
- **UMD**: For browser compatibility
- **TypeScript**: Full type definitions

### Distribution

```bash
npm run build  # Build all formats
npm run test   # Run tests
npm run lint   # Check code quality
```

## Future Enhancements

### Potential Improvements

1. **Caching Layer**: Add Redis/Memory caching
2. **Batch Operations**: Support bulk checkpoint operations
3. **Compression**: Add data compression for large checkpoints
4. **Encryption**: Add optional data encryption
5. **Analytics**: Add usage analytics (anonymized)
6. **Webhooks**: Add webhook support for events

### Backward Compatibility

- Semantic versioning (SemVer)
- Deprecation warnings for breaking changes
- Migration guides for major versions 