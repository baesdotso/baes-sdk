// Core type definitions for BAES App SDK

export interface Checkpoint {
  timestamp: number;              // Natural unique identifier (when created)
  data: Record<string, any>;      // Original checkpoint data
  metadata: {
    version: string;              // SDK version
  };
}

export interface SaveCheckpointParams {
  gameId: string;
  userAddress: string;
  data: Record<string, any>;
}

export interface LoadCheckpointParams {
  gameId: string;
  userAddress: string;
  timestamp?: number;             // Optional: if not provided, loads latest
  checkpoint?: Checkpoint;        // Optional: can pass checkpoint object from listCheckpoints
}

export interface LoadLatestCheckpointParams {
  gameId: string;
  userAddress: string;
}

export interface ListCheckpointsParams {
  gameId: string;
  userAddress: string;
}

export interface IPFSRecord {
  userAddress: string;
  gameId: string;
  timestamp: number;
  data: Record<string, any>;
  metadata: {
    version: string;
  };
}

export interface SDKConfig {
  pinataApiKey: string;           // Required: Pinata API key
  debug?: boolean;
}

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface PinataFileListItem {
  id: string;
  name: string | null;
  cid: string;
  size: number;
  number_of_files: number;
  mime_type: string;
  keyvalues: Record<string, string>;
  created_at: string;
}

export interface PinataFileListResponse {
  files: PinataFileListItem[];
  next_page_token: string;
}

export class SDKError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SDKError';
  }
}
