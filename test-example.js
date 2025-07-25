// Test example for BAES SDK with Pinata
// This shows how developers would use the SDK

const BaesAppSDK = require('./dist/index.js').default;

async function testSDK() {
  try {
    // Initialize SDK with Pinata API key
    const sdk = new BaesAppSDK({
      pinataApiKey: 'your-pinata-jwt-token-here', // Replace with actual token
      debug: true
    });

    console.log('✅ SDK initialized successfully');

    // Test saving a checkpoint
    await sdk.saveCheckpoint({
      gameId: 'test-game',
      userAddress: '0x1234567890123456789012345678901234567890',
      data: {
        level: 5,
        score: 15000,
        inventory: ['shield', 'speed_boost'],
        timeLeft: 120
      }
    });

    console.log('✅ Checkpoint saved successfully');

    // Test listing checkpoints
    const checkpoints = await sdk.listCheckpoints({
      gameId: 'test-game',
      userAddress: '0x1234567890123456789012345678901234567890'
    });

    console.log('✅ Checkpoints listed:', checkpoints.length);

    if (checkpoints.length > 0) {
      // Test loading the most recent checkpoint
      const latestCheckpoint = checkpoints[0];
      const loadedData = await sdk.loadCheckpoint({
        gameId: 'test-game',
        userAddress: '0x1234567890123456789012345678901234567890',
        timestamp: latestCheckpoint.timestamp
      });

      console.log('✅ Checkpoint loaded successfully:', loadedData);
    }

  } catch (error) {
    console.error('❌ SDK test failed:', error.message);
  }
}

// Run the test
testSDK(); 