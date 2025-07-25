# BAES SDK

baes-sdk is a lightweight typescript SDK for developers building on the BAES ecosystem.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Step-by-Step Setup](#step-by-step-setup)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install baes-sdk
# or
yarn add baes-sdk
```

## Quick Start

### 1. Set up Environment Variables

Copy the `.env.example` file to `.env` and configure your settings:

```bash
cp .env.example .env
```

**Required Configuration:**
- `PINATA_API_KEY`: Your Pinata JWT token (get from [Pinata Dashboard](https://app.pinata.cloud/developers/api-keys))

**Optional Configuration:**
- `DEBUG`: Enable debug logging (default: false)
- `BASE_RPC_URL`: Base Network RPC URL (for future blockchain features)
- `SUPABASE_URL`: Supabase project URL (for future database features)

### 2. Get a Pinata API Key

1. Sign up at [Pinata Cloud](https://app.pinata.cloud/)
2. Go to API Keys in your dashboard
3. Create a new API key with the following permissions:
   - `pinFileToIPFS` - For uploading checkpoints
   - `pinList` - For querying checkpoints
4. Copy your JWT token and add it to your `.env` file

### 3. Initialize the SDK

```typescript
import BaesAppSDK from 'baes-sdk';

// Initialize the SDK with your Pinata API key
const sdk = new BaesAppSDK({
  pinataApiKey: process.env.PINATA_API_KEY!, // Required
  debug: process.env.DEBUG === 'true' // Optional: Enable debug logging
});
```

### 3. Basic Usage

```typescript
// Save a checkpoint
await sdk.saveCheckpoint({
  gameId: 'bario-drift',
  userAddress: '0x1234...',
  data: {
    level: 5,
    score: 15000,
    inventory: ['shield', 'speed_boost'],
    timeLeft: 120
  }
});

// Load the latest checkpoint automatically (default behavior)
const latestCheckpoint = await sdk.loadCheckpoint({
  gameId: 'bario-drift',
  userAddress: '0x1234...'
});

// Load a specific checkpoint by timestamp
const specificCheckpoint = await sdk.loadCheckpoint({
  gameId: 'bario-drift',
  userAddress: '0x1234...',
  timestamp: 1703123456789
});

// List all checkpoints
const checkpoints = await sdk.listCheckpoints({
  gameId: 'bario-drift',
  userAddress: '0x1234...'
});
```

## Environment Variables

The SDK uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PINATA_API_KEY` | Your Pinata JWT token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug logging | `false` |

### Environment Setup Examples

**For Next.js:**
```bash
# .env.local
PINATA_API_KEY=your_jwt_token_here
DEBUG=true
```

**For Vite/React:**
```bash
# .env
VITE_PINATA_API_KEY=your_jwt_token_here
VITE_DEBUG=true
```

**For Node.js:**
```bash
# .env
PINATA_API_KEY=your_jwt_token_here
DEBUG=true
```

## Step-by-Step Setup

### For TypeScript/Modern JavaScript Projects

#### Step 1: Create SDK Configuration File

Create a new file at `lib/baes-sdk.ts` (or `src/lib/baes-sdk.ts`):

```typescript
// lib/baes-sdk.ts
import BaesAppSDK from 'baes-sdk';

// Environment-based configuration
const config = {
  pinataApiKey: process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY,
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true'
};

// Validate configuration
if (!config.pinataApiKey) {
  throw new Error('PINATA_API_KEY environment variable is required');
}

// Create and export SDK instance
export const baesSDK = new BaesAppSDK(config);

// Export types for convenience
export type { 
  Checkpoint, 
  SaveCheckpointParams, 
  LoadCheckpointParams, 
  ListCheckpointsParams 
} from 'baes-sdk';
```

#### Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# .env.local
PINATA_API_KEY=your-pinata-jwt-token-here

# For client-side applications (if needed)
NEXT_PUBLIC_PINATA_API_KEY=your-pinata-jwt-token-here
```

#### Step 3: Use in Your Game

```typescript
// In any file where you need checkpoint functionality
import { baesSDK } from '@/lib/baes-sdk';

// Save checkpoint
await baesSDK.saveCheckpoint({
  gameId: 'my-game',
  userAddress: '0x1234...',
  data: { level: 5, score: 1000 }
});
```

### For Vanilla JavaScript Games (like bario-drift)

#### Step 1: Create SDK Configuration File

Create a new file at `js/baes-sdk.js`:

```javascript
// js/baes-sdk.js - This is pure JavaScript (no TypeScript syntax)
import BaesAppSDK from 'baes-sdk';

// Configuration (you can hardcode for simple games)
const config = {
  pinataApiKey: 'your-pinata-jwt-token-here', // Replace with your actual token
  debug: true
};

// Create and export SDK instance
export const baesSDK = new BaesAppSDK(config);
```

#### Step 2: Update Your HTML

Add the SDK to your HTML file:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
</head>
<body>
    <!-- Your game content -->
    
    <!-- Import the SDK -->
    <script type="module">
        import { baesSDK } from './js/baes-sdk.js';
        
        // Make it available globally for your game
        window.baesSDK = baesSDK;
    </script>
    
    <!-- Your game scripts -->
    <script src="js/game.js"></script>
</body>
</html>
```

#### Step 3: Use in Your Game Code

```javascript
// js/game.js
class Game {
    constructor() {
        this.sdk = window.baesSDK;
        this.init();
    }
    
    async init() {
        // Game initialization
    }
    
    async saveCheckpoint() {
        try {
            await this.sdk.saveCheckpoint({
                gameId: 'bario-drift',
                userAddress: '0x1234...', // Get from wallet
                data: {
                    level: this.currentLevel,
                    score: this.score,
                    position: this.playerPosition,
                    inventory: this.inventory
                }
            });
            console.log('Checkpoint saved!');
        } catch (error) {
            console.error('Failed to save checkpoint:', error);
        }
    }
    
    async loadCheckpoint(timestamp) {
        try {
            const data = await this.sdk.loadCheckpoint({
                gameId: 'bario-drift',
                userAddress: '0x1234...',
                timestamp: timestamp
            });
            
            if (data) {
                // Restore game state
                this.currentLevel = data.level;
                this.score = data.score;
                this.playerPosition = data.position;
                this.inventory = data.inventory;
                console.log('Game loaded from checkpoint!');
            }
        } catch (error) {
            console.error('Failed to load checkpoint:', error);
        }
    }
}
```

### For React/Next.js Applications

#### Step 1: Create SDK Configuration File

Create `lib/baes-sdk.ts`:

```typescript
// lib/baes-sdk.ts
import BaesAppSDK from 'baes-sdk';

// Create a singleton instance
let sdkInstance: BaesAppSDK | null = null;

export function getSDK(): BaesAppSDK {
  if (!sdkInstance) {
    sdkInstance = new BaesAppSDK({
      pinataApiKey: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
      debug: process.env.NODE_ENV === 'development'
    });
  }
  return sdkInstance;
}
```

#### Step 2: Use in Components

```typescript
// components/GameComponent.tsx
import { getSDK } from '@/lib/baes-sdk';

export function GameComponent() {
  const sdk = getSDK();
  
  const saveCheckpoint = async () => {
    await sdk.saveCheckpoint({
      gameId: 'my-game',
      userAddress: userAddress,
      data: gameState
    });
  };
  
  return (
    <button onClick={saveCheckpoint}>
      Save Checkpoint
    </button>
  );
}
```

## TypeScript vs JavaScript Compatibility

### ✅ **Works with Both!**

The SDK is **written in TypeScript** but **distributed as JavaScript**, so it works perfectly with both:

- **TypeScript**: Get full type safety and IntelliSense
- **JavaScript**: Works exactly the same, just without type checking
- **Vanilla JS Games**: Import as ES modules or use UMD build
- **React/Next.js**: Works with both TypeScript and JavaScript projects

### **How It Works:**

1. **We write** the SDK in TypeScript (`.ts` files)
2. **We compile** it to JavaScript (`.js` files) for distribution using Rollup
3. **You use** the compiled JavaScript in your projects (no TypeScript needed!)
4. **TypeScript projects** get additional type information from `.d.ts` files
5. **JavaScript projects** work perfectly with the compiled `.js` files

### **JavaScript Usage Example**

```javascript
// No TypeScript needed! This is pure JavaScript
const BaesAppSDK = require('baes-sdk');

const sdk = new BaesAppSDK({
  pinataApiKey: 'your-token',
  debug: true
});

// Use exactly the same way
await sdk.saveCheckpoint({
  gameId: 'my-game',
  userAddress: '0x1234...',
  data: { level: 5, score: 1000 }
});
```

### **Vanilla JavaScript Example (ES Modules)**

```javascript
// js/baes-sdk.js - This is pure JavaScript
import BaesAppSDK from 'baes-sdk';

// Configuration (you can hardcode for simple games)
const config = {
  pinataApiKey: 'your-pinata-jwt-token-here', // Replace with your actual token
  debug: true
};

// Create and export SDK instance
export const baesSDK = new BaesAppSDK(config);
```

## API Reference

### Constructor

```typescript
new BaesAppSDK(config: SDKConfig)
```

**Parameters:**
- `config.pinataApiKey` (string, required) - Your Pinata JWT token
- `config.debug` (boolean, optional) - Enable debug logging

### Methods

#### `saveCheckpoint(params)`

Saves checkpoint data to IPFS using Pinata.

```typescript
await sdk.saveCheckpoint({
  gameId: string,           // Required: Unique identifier for the game
  userAddress: string,      // Required: User's wallet address
  data: Record<string, any> // Required: Any data structure to save
});
```

**Returns:** `Promise<void>`

**Throws:** `SDKError` if validation fails or upload fails

#### `loadCheckpoint(params)`

Loads checkpoint data from IPFS. This function is smart and handles multiple use cases:

**Load latest checkpoint (default):**
```typescript
const data = await sdk.loadCheckpoint({
  gameId: string,        // Required: Game identifier
  userAddress: string    // Required: User's wallet address
  // No timestamp = loads the latest checkpoint automatically
});
```

**Load specific checkpoint by timestamp:**
```typescript
const data = await sdk.loadCheckpoint({
  gameId: string,        // Required: Game identifier
  userAddress: string,   // Required: User's wallet address
  timestamp: number      // Optional: Specific timestamp to load
});
```

**Load checkpoint from listCheckpoints result:**
```typescript
const checkpoints = await sdk.listCheckpoints({
  gameId: 'my-game',
  userAddress: '0x1234...'
});

// Load the first checkpoint from the list
const data = await sdk.loadCheckpoint({
  gameId: 'my-game',
  userAddress: '0x1234...',
  checkpoint: checkpoints[0]  // Pass checkpoint object directly
});
```

**Returns:** `Promise<Record<string, any> | null>`

**Throws:** `SDKError` if validation fails or download fails

#### `listCheckpoints(params)`

Lists all checkpoints for a specific user and game.

```typescript
const checkpoints = await sdk.listCheckpoints({
  gameId: string,     // Required: Game identifier
  userAddress: string // Required: User's wallet address
});
```

**Returns:** `Promise<Checkpoint[]>`

**Throws:** `SDKError` if validation fails or query fails

### Types

```typescript
interface Checkpoint {
  timestamp: number;              // When checkpoint was created
  data: Record<string, any>;      // Original checkpoint data
  metadata: {
    version: string;              // SDK version
  };
}

interface SDKError extends Error {
  code?: string;                  // Error code for handling
}
```

## Examples

### Game Integration Example

```typescript
import BaesAppSDK from 'baes-sdk';

class GameCheckpointManager {
  private sdk: BaesAppSDK;

  constructor(pinataApiKey: string) {
    this.sdk = new BaesAppSDK({
      pinataApiKey,
      debug: true
    });
  }

  // Save game state at checkpoint
  async saveCheckpoint(gameId: string, userAddress: string, gameState: any) {
    try {
      await this.sdk.saveCheckpoint({
        gameId,
        userAddress,
        data: {
          level: gameState.level,
          score: gameState.score,
          inventory: gameState.inventory,
          position: gameState.playerPosition,
          timeLeft: gameState.timeLeft,
          powerUps: gameState.activePowerUps
        }
      });
      console.log('✅ Checkpoint saved successfully');
    } catch (error) {
      console.error('❌ Failed to save checkpoint:', error);
      throw error;
    }
  }

  // Load game state from checkpoint (smart function)
  async loadCheckpoint(gameId: string, userAddress: string, timestamp?: number, checkpoint?: any) {
    try {
      const params: any = {
        gameId,
        userAddress
      };
      
      if (timestamp) {
        params.timestamp = timestamp;
      } else if (checkpoint) {
        params.checkpoint = checkpoint;
      }
      // If neither timestamp nor checkpoint provided, loads latest automatically
      
      const data = await this.sdk.loadCheckpoint(params);
      
      if (data) {
        this.restoreGameState(data);
        console.log('✅ Game state restored from checkpoint');
        return true;
      } else {
        console.log('⚠️ No checkpoint found');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to load checkpoint:', error);
      return false;
    }
  }

  // Load the latest checkpoint (convenience method)
  async loadLatestCheckpoint(gameId: string, userAddress: string) {
    return this.loadCheckpoint(gameId, userAddress); // No timestamp = loads latest
  }

  // Restore game state from checkpoint data
  private restoreGameState(data: any) {
    // Restore game state
    gameState.level = data.level;
    gameState.score = data.score;
    gameState.inventory = data.inventory;
    gameState.playerPosition = data.position;
    gameState.timeLeft = data.timeLeft;
    gameState.activePowerUps = data.powerUps;
  }

  // Show checkpoint selection UI
  async showCheckpointMenu(gameId: string, userAddress: string) {
    try {
      const checkpoints = await this.sdk.listCheckpoints({
        gameId,
        userAddress
      });

      if (checkpoints.length === 0) {
        console.log('No saved checkpoints found');
        return;
      }

      console.log('Available checkpoints:');
      checkpoints.forEach((checkpoint, index) => {
        const date = new Date(checkpoint.timestamp).toLocaleString();
        console.log(`${index + 1}. ${date} - Level ${checkpoint.data.level}, Score: ${checkpoint.data.score}`);
      });

      // In a real game, you'd show this in a UI
      return checkpoints;
    } catch (error) {
      console.error('❌ Failed to load checkpoints:', error);
      return [];
    }
  }
}
```

### React/Next.js Integration

```typescript
import { useState, useEffect } from 'react';
import BaesAppSDK from 'baes-sdk';

export function useGameCheckpoints(pinataApiKey: string, gameId: string, userAddress: string) {
  const [sdk] = useState(() => new BaesAppSDK({ pinataApiKey }));
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveCheckpoint = async (gameData: any) => {
    setLoading(true);
    try {
      await sdk.saveCheckpoint({
        gameId,
        userAddress,
        data: gameData
      });
      // Refresh checkpoint list
      await loadCheckpoints();
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCheckpoints = async () => {
    try {
      const data = await sdk.listCheckpoints({ gameId, userAddress });
      setCheckpoints(data);
    } catch (error) {
      console.error('Failed to load checkpoints:', error);
    }
  };

  useEffect(() => {
    loadCheckpoints();
  }, [gameId, userAddress]);

  return { checkpoints, saveCheckpoint, loading };
}
```

### Error Handling Example

```typescript
import BaesAppSDK, { SDKError } from 'baes-sdk';

async function robustCheckpointOperations() {
  const sdk = new BaesAppSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    debug: true
  });

  try {
    // Save checkpoint
    await sdk.saveCheckpoint({
      gameId: 'my-game',
      userAddress: '0x1234...',
      data: { level: 5, score: 1000 }
    });
  } catch (error) {
    if (error instanceof SDKError) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          console.error('Invalid parameters:', error.message);
          break;
        case 'PINATA_UPLOAD_ERROR':
          console.error('Upload failed - check your API key and network:', error.message);
          break;
        default:
          console.error('Unknown error:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

## Architecture

### How It Works

1. **Data Storage**: Checkpoint data is stored as JSON files on IPFS via Pinata
2. **Metadata Indexing**: Each file includes metadata for efficient querying
3. **Unique Identification**: Files are identified by `userAddress + gameId + timestamp`
4. **Decentralized Access**: Data can be accessed from any device with the user's wallet

### Data Flow

```
Game State → SDK → Pinata API → IPFS → Pinata Gateway → SDK → Game State
```

### File Structure on IPFS

```json
{
  "userAddress": "0x1234...",
  "gameId": "bario-drift",
  "timestamp": 1703123456789,
  "data": {
    "level": 5,
    "score": 15000,
    "inventory": ["shield", "speed_boost"]
  },
  "metadata": {
    "version": "1.0.0"
  }
}
```

### Pinata Metadata

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

## Troubleshooting

### Common Issues

#### 1. "Pinata API key is required"
**Solution**: Make sure you're passing the `pinataApiKey` when initializing the SDK.

#### 2. "Pinata upload failed: 401"
**Solution**: Check that your API key is valid and has the correct permissions (`pinFileToIPFS`).

#### 3. "Pinata query failed: 403"
**Solution**: Ensure your API key has the `pinList` permission.

#### 4. "userAddress must be a valid Ethereum address"
**Solution**: Make sure the address starts with `0x` and is 42 characters long.

#### 5. "Checkpoint not found"
**Solution**: Verify the timestamp matches exactly. Use `listCheckpoints()` to see available timestamps.

#### 6. "Cannot find module 'baes-sdk'"
**Solution**: Make sure you've installed the package with `npm install baes-sdk`.

#### 7. "Module not found" in browser
**Solution**: For vanilla JS games, make sure you're using ES modules (`type="module"`) in your HTML.

### Debug Mode

Enable debug logging to see detailed API calls:

```typescript
const sdk = new BaesAppSDK({
  pinataApiKey: 'your-key',
  debug: true // This will log all API calls
});
```

### Rate Limits

- **Free Tier**: 60 requests/minute
- **Paid Plans**: Higher limits available
- **File Size**: 10MB limit per checkpoint

### Best Practices

1. **Error Handling**: Always wrap SDK calls in try-catch blocks
2. **Validation**: Validate game data before saving
3. **User Feedback**: Show loading states during operations
4. **Fallbacks**: Provide local storage fallbacks for offline scenarios
5. **Cleanup**: Consider implementing checkpoint cleanup for old saves
6. **Environment Variables**: Store API keys securely in environment variables
7. **Singleton Pattern**: Use a single SDK instance throughout your application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT 
