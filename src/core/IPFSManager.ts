import { IPFSRecord, SDKError, SDKConfig, PinataUploadResponse, PinataFileListResponse } from './types';

/**
 * Manages IPFS operations for the BAES SDK using Pinata API
 * Handles uploading, downloading, and querying checkpoint data
 */
export class IPFSManager {
  private pinataApiKey: string;
  private debug: boolean;
  private readonly PINATA_API_BASE = 'https://api.pinata.cloud';

  constructor(config: SDKConfig) {
    this.pinataApiKey = config.pinataApiKey;
    this.debug = config.debug || false;
  }

  /**
   * Upload checkpoint data to IPFS using Pinata
   */
  async uploadCheckpoint(record: IPFSRecord): Promise<string> {
    try {
      if (this.debug) {
        console.log('Uploading checkpoint to Pinata:', record);
      }

      // Create JSON blob for upload
      const jsonBlob = new Blob([JSON.stringify(record)], {
        type: 'application/json'
      });

      // Create FormData for Pinata API
      const formData = new FormData();
      formData.append('file', jsonBlob, 'checkpoint.json');

      // Add metadata for easier querying
      const metadata = {
        name: `checkpoint_${record.userAddress}_${record.gameId}_${record.timestamp}`,
        keyvalues: {
          userAddress: record.userAddress,
          gameId: record.gameId,
          timestamp: record.timestamp.toString(),
          type: 'checkpoint'
        }
      };
      formData.append('pinataMetadata', JSON.stringify(metadata));

      const response = await fetch(`${this.PINATA_API_BASE}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataApiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new SDKError(`Pinata upload failed: ${response.status} - ${errorText}`, 'PINATA_UPLOAD_ERROR');
      }

      const result: PinataUploadResponse = await response.json();
      const ipfsHash = result.IpfsHash;

      if (this.debug) {
        console.log('Checkpoint uploaded successfully to Pinata:', ipfsHash);
      }

      return ipfsHash;
    } catch (error) {
      throw new SDKError(
        `Failed to upload checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PINATA_UPLOAD_ERROR'
      );
    }
  }

  /**
   * Download checkpoint data from IPFS using Pinata gateway
   */
  async downloadCheckpoint(ipfsHash: string): Promise<IPFSRecord> {
    try {
      if (this.debug) {
        console.log('Downloading checkpoint from Pinata gateway:', ipfsHash);
      }

      // Use Pinata's public gateway to download
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      
      if (!response.ok) {
        throw new SDKError(`Pinata download failed: ${response.statusText}`, 'PINATA_DOWNLOAD_ERROR');
      }

      const record: IPFSRecord = await response.json();

      if (this.debug) {
        console.log('Checkpoint downloaded successfully from Pinata:', record);
      }

      return record;
    } catch (error) {
      throw new SDKError(
        `Failed to download checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PINATA_DOWNLOAD_ERROR'
      );
    }
  }

  /**
   * Query checkpoints for a specific user and game using Pinata API
   */
  async queryCheckpoints(userAddress: string, gameId: string): Promise<IPFSRecord[]> {
    try {
      if (this.debug) {
        console.log('Querying checkpoints from Pinata for:', { userAddress, gameId });
      }

      // Query files with specific metadata filters
      const queryParams = new URLSearchParams({
        metadata: JSON.stringify({
          keyvalues: {
            userAddress: { value: userAddress, op: 'eq' },
            gameId: { value: gameId, op: 'eq' },
            type: { value: 'checkpoint', op: 'eq' }
          }
        }),
        status: 'pinned',
        limit: '1000' // Get all checkpoints for this user/game
      });

      const response = await fetch(`${this.PINATA_API_BASE}/data/pinList?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.pinataApiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new SDKError(`Pinata query failed: ${response.status} - ${errorText}`, 'PINATA_QUERY_ERROR');
      }

      const result: PinataFileListResponse = await response.json();
      
      // Download all checkpoint records
      const records: IPFSRecord[] = [];
      for (const file of result.files) {
        try {
          const record = await this.downloadCheckpoint(file.cid);
          records.push(record);
        } catch (error) {
          if (this.debug) {
            console.warn(`Failed to download checkpoint ${file.cid}:`, error);
          }
          // Continue with other files
        }
      }

      // Sort by timestamp (newest first)
      records.sort((a, b) => b.timestamp - a.timestamp);

      if (this.debug) {
        console.log('Checkpoints queried successfully from Pinata:', records.length);
      }

      return records;
    } catch (error) {
      throw new SDKError(
        `Failed to query checkpoints: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PINATA_QUERY_ERROR'
      );
    }
  }

  /**
   * Validate IPFS hash format (CID)
   */
  private validateIPFSHash(hash: string): boolean {
    // Basic IPFS hash validation (CID v0 or v1)
    const ipfsHashRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]{55}$/;
    return ipfsHashRegex.test(hash);
  }
} 