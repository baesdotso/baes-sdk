import { 
  SaveCheckpointParams, 
  LoadCheckpointParams, 
  ListCheckpointsParams, 
  Checkpoint, 
  IPFSRecord, 
  SDKError,
  SDKConfig 
} from './types';
import { IPFSManager } from './IPFSManager';

/**
 * Main checkpoint manager for the BAES SDK
 * Handles saving, loading, and listing checkpoints using Pinata
 */
export class CheckpointManager {
  private ipfsManager: IPFSManager;
  private config: SDKConfig;
  private version = '1.0.0';

  constructor(config: SDKConfig) {
    this.config = config;
    this.ipfsManager = new IPFSManager(config);
  }

  /**
   * Save checkpoint data to IPFS using Pinata
   */
  async saveCheckpoint(params: SaveCheckpointParams): Promise<void> {
    try {
      // Validate inputs
      this.validateSaveParams(params);

      // Create timestamp
      const timestamp = Date.now();

      // Create IPFS record
      const record: IPFSRecord = {
        userAddress: params.userAddress,
        gameId: params.gameId,
        timestamp: timestamp,
        data: params.data,
        metadata: {
          version: this.version
        }
      };

      if (this.config.debug) {
        console.log('Saving checkpoint to Pinata:', record);
      }

      // Upload to Pinata
      await this.ipfsManager.uploadCheckpoint(record);

      if (this.config.debug) {
        console.log('Checkpoint saved successfully to Pinata');
      }
    } catch (error) {
      throw new SDKError(
        `Failed to save checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SAVE_CHECKPOINT_ERROR'
      );
    }
  }

  /**
   * Load checkpoint data from IPFS
   * - If no timestamp or checkpoint provided: loads the latest checkpoint
   * - If timestamp provided: loads that specific checkpoint
   * - If checkpoint object provided: loads that checkpoint
   */
  async loadCheckpoint(params: LoadCheckpointParams): Promise<Record<string, any> | null> {
    try {
      // Validate inputs
      this.validateLoadParams(params);

      if (this.config.debug) {
        console.log('Loading checkpoint from Pinata:', params);
      }

      let targetTimestamp: number | undefined;

      // Determine which checkpoint to load
      if (params.checkpoint) {
        // Use checkpoint object from listCheckpoints
        targetTimestamp = params.checkpoint.timestamp;
        if (this.config.debug) {
          console.log('Loading specific checkpoint from object:', targetTimestamp);
        }
      } else if (params.timestamp) {
        // Use provided timestamp
        targetTimestamp = params.timestamp;
        if (this.config.debug) {
          console.log('Loading checkpoint with timestamp:', targetTimestamp);
        }
      } else {
        // No timestamp or checkpoint provided - load latest
        if (this.config.debug) {
          console.log('No timestamp provided, loading latest checkpoint');
        }
      }

      // Query checkpoints for the user and game
      const records = await this.ipfsManager.queryCheckpoints(params.userAddress, params.gameId);

      if (records.length === 0) {
        if (this.config.debug) {
          console.log('No checkpoints found in Pinata');
        }
        return null;
      }

      let targetRecord: IPFSRecord | undefined;

      if (targetTimestamp) {
        // Find the specific checkpoint by timestamp
        targetRecord = records.find(record => record.timestamp === targetTimestamp);
      } else {
        // Get the most recent checkpoint (first in the sorted list)
        targetRecord = records[0];
      }

      if (!targetRecord) {
        if (this.config.debug) {
          console.log('Target checkpoint not found in Pinata');
        }
        return null;
      }

      if (this.config.debug) {
        console.log('Checkpoint loaded successfully from Pinata:', targetRecord.data);
      }

      return targetRecord.data;
    } catch (error) {
      throw new SDKError(
        `Failed to load checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LOAD_CHECKPOINT_ERROR'
      );
    }
  }

  /**
   * List all checkpoints for a specific user and game
   */
  async listCheckpoints(params: ListCheckpointsParams): Promise<Checkpoint[]> {
    try {
      // Validate inputs
      this.validateListParams(params);

      if (this.config.debug) {
        console.log('Listing checkpoints from Pinata:', params);
      }

      // Query checkpoints from Pinata
      const records = await this.ipfsManager.queryCheckpoints(params.userAddress, params.gameId);

      // Convert to Checkpoint format
      const checkpoints: Checkpoint[] = records.map(record => ({
        timestamp: record.timestamp,
        data: record.data,
        metadata: {
          version: record.metadata.version
        }
      }));

      if (this.config.debug) {
        console.log('Checkpoints listed successfully from Pinata:', checkpoints.length);
      }

      return checkpoints;
    } catch (error) {
      throw new SDKError(
        `Failed to list checkpoints: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LIST_CHECKPOINTS_ERROR'
      );
    }
  }

  /**
   * Validate save checkpoint parameters
   */
  private validateSaveParams(params: SaveCheckpointParams): void {
    if (!params.gameId || typeof params.gameId !== 'string') {
      throw new SDKError('gameId is required and must be a string', 'VALIDATION_ERROR');
    }

    if (!params.userAddress || typeof params.userAddress !== 'string') {
      throw new SDKError('userAddress is required and must be a string', 'VALIDATION_ERROR');
    }

    if (!params.data || typeof params.data !== 'object') {
      throw new SDKError('data is required and must be an object', 'VALIDATION_ERROR');
    }

    // Validate Ethereum address format (basic check)
    if (!this.isValidEthereumAddress(params.userAddress)) {
      throw new SDKError('userAddress must be a valid Ethereum address', 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate load checkpoint parameters
   */
  private validateLoadParams(params: LoadCheckpointParams): void {
    if (!params.gameId || typeof params.gameId !== 'string') {
      throw new SDKError('gameId is required and must be a string', 'VALIDATION_ERROR');
    }

    if (!params.userAddress || typeof params.userAddress !== 'string') {
      throw new SDKError('userAddress is required and must be a string', 'VALIDATION_ERROR');
    }

    // Validate timestamp if provided
    if (params.timestamp !== undefined && (typeof params.timestamp !== 'number' || params.timestamp <= 0)) {
      throw new SDKError('timestamp must be a positive number', 'VALIDATION_ERROR');
    }

    // Validate checkpoint object if provided
    if (params.checkpoint && typeof params.checkpoint !== 'object') {
      throw new SDKError('checkpoint must be a valid checkpoint object', 'VALIDATION_ERROR');
    }

    // Validate Ethereum address format
    if (!this.isValidEthereumAddress(params.userAddress)) {
      throw new SDKError('userAddress must be a valid Ethereum address', 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate list checkpoints parameters
   */
  private validateListParams(params: ListCheckpointsParams): void {
    if (!params.gameId || typeof params.gameId !== 'string') {
      throw new SDKError('gameId is required and must be a string', 'VALIDATION_ERROR');
    }

    if (!params.userAddress || typeof params.userAddress !== 'string') {
      throw new SDKError('userAddress is required and must be a string', 'VALIDATION_ERROR');
    }

    // Validate Ethereum address format
    if (!this.isValidEthereumAddress(params.userAddress)) {
      throw new SDKError('userAddress must be a valid Ethereum address', 'VALIDATION_ERROR');
    }
  }

  /**
   * Basic Ethereum address validation
   */
  private isValidEthereumAddress(address: string): boolean {
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  }
} 