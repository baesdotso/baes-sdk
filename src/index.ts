// BAES App SDK - Main Entry Point
// This SDK provides checkpoint saving and loading functionality for games using Pinata IPFS

import { CheckpointManager } from './core/CheckpointManager';
import { IPFSManager } from './core/IPFSManager';
import type { 
  Checkpoint,
  SaveCheckpointParams,
  LoadCheckpointParams,
  ListCheckpointsParams,
  SDKConfig,
  SDKError
} from './core/types';

export { CheckpointManager } from './core/CheckpointManager';
export { IPFSManager } from './core/IPFSManager';
export type { 
  Checkpoint,
  SaveCheckpointParams,
  LoadCheckpointParams,
  ListCheckpointsParams,
  SDKConfig,
  SDKError
} from './core/types';

// Main SDK class
export class BaesAppSDK {
  private checkpointManager: CheckpointManager;

  constructor(config: SDKConfig) {
    // Validate required configuration
    if (!config.pinataApiKey) {
      throw new Error('Pinata API key is required. Please provide pinataApiKey in the SDK configuration.');
    }

    this.checkpointManager = new CheckpointManager(config);
  }

  /**
   * Save checkpoint data to IPFS using Pinata
   */
  async saveCheckpoint(params: SaveCheckpointParams): Promise<void> {
    return this.checkpointManager.saveCheckpoint(params);
  }

  /**
   * Load checkpoint data from IPFS
   * - If no timestamp or checkpoint provided: loads the latest checkpoint
   * - If timestamp provided: loads that specific checkpoint
   * - If checkpoint object provided: loads that checkpoint
   */
  async loadCheckpoint(params: LoadCheckpointParams): Promise<Record<string, any> | null> {
    return this.checkpointManager.loadCheckpoint(params);
  }

  /**
   * List all checkpoints for a specific user and game
   */
  async listCheckpoints(params: ListCheckpointsParams): Promise<Checkpoint[]> {
    return this.checkpointManager.listCheckpoints(params);
  }
}

// Default export
export default BaesAppSDK;
