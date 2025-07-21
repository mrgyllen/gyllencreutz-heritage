import { Octokit } from "@octokit/rest";

export interface GitHubSyncOptions {
  token: string;
  owner: string;
  repo: string;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'bulk';
  data: any;
  timestamp: Date;
  attempts: number;
  lastError?: string;
}

export interface SyncStatus {
  connected: boolean;
  lastSync?: Date;
  pendingOperations: number;
  failedRetries: number;
  isRetrying: boolean;
  error?: string;
}

export class GitHubSync {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private retryQueue: SyncOperation[] = [];
  private failCount: number = 0;
  private isProcessingRetries: boolean = false;
  private syncLogs: Array<{ timestamp: Date; message: string; success: boolean }> = [];

  constructor(options: GitHubSyncOptions) {
    this.octokit = new Octokit({
      auth: options.token,
      userAgent: 'Gyllencreutz-Admin/1.0'
    });
    this.owner = options.owner;
    this.repo = options.repo;
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.octokit.rest.users.getAuthenticated();
      return { connected: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { connected: false, error: errorMessage };
    }
  }

  async syncFamilyData(operation: string, memberData: any, familyData: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current file info from GitHub
      const fileResponse = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'functions/data/family-members.json'
      });

      // Create commit message with [data-only] prefix
      const commitMessage = `[data-only] admin: ${this.generateCommitMessage(operation, memberData)}`;

      // Update file via GitHub API
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: 'functions/data/family-members.json',
        message: commitMessage,
        content: Buffer.from(JSON.stringify(familyData, null, 2)).toString('base64'),
        sha: Array.isArray(fileResponse.data) ? '' : fileResponse.data.sha
      });

      // Log successful sync
      this.addSyncLog(`✅ ${operation} operation synced successfully`, true);
      
      // Reset fail count on success
      this.failCount = 0;

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      // Log failed sync
      this.addSyncLog(`❌ Sync failed: ${errorMessage}`, false);
      
      // Add to retry queue
      await this.scheduleRetry({
        id: Date.now().toString(),
        type: operation as any,
        data: { memberData, familyData },
        timestamp: new Date(),
        attempts: 0,
        lastError: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }

  private generateCommitMessage(operation: string, data: any): string {
    switch (operation) {
      case 'create':
        return `add family member '${data?.name || 'unknown'}' (${data?.externalId || 'no-id'})`;
      case 'update':
        return `update ${data?.name || 'family member'} (${data?.externalId || 'no-id'})`;
      case 'delete':
        return `delete family member '${data?.name || 'unknown'}' (${data?.externalId || 'no-id'})`;
      case 'bulk':
        return `bulk update ${data?.count || 'multiple'} family members`;
      default:
        return `${operation} family data`;
    }
  }

  private async scheduleRetry(operation: SyncOperation): Promise<void> {
    this.retryQueue.push(operation);
    this.failCount++;

    if (!this.isProcessingRetries) {
      this.processRetries();
    }
  }

  private async processRetries(): Promise<void> {
    this.isProcessingRetries = true;

    while (this.retryQueue.length > 0) {
      const operation = this.retryQueue.shift()!;
      
      // Determine retry interval: 5 minutes for first 3 failures, then 1 hour
      const retryInterval = this.failCount < 3 ? 5 * 60 * 1000 : 60 * 60 * 1000;
      
      this.addSyncLog(`⏳ Retrying sync in ${this.failCount < 3 ? '5 minutes' : '1 hour'}...`, false);
      
      await new Promise(resolve => setTimeout(resolve, retryInterval));
      
      try {
        operation.attempts++;
        const result = await this.syncFamilyData(operation.type, operation.data.memberData, operation.data.familyData);
        
        if (result.success) {
          this.addSyncLog(`✅ Retry successful for ${operation.type} operation`, true);
        } else {
          // If retry fails and we've tried 5 times, give up on this operation
          if (operation.attempts >= 5) {
            this.addSyncLog(`❌ Giving up on ${operation.type} operation after 5 attempts`, false);
          } else {
            // Re-queue for another retry
            this.retryQueue.push(operation);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown retry error';
        this.addSyncLog(`❌ Retry failed: ${errorMessage}`, false);
        
        if (operation.attempts < 5) {
          this.retryQueue.push(operation);
        }
      }
    }

    this.isProcessingRetries = false;
  }

  public async manualRetry(): Promise<{ success: boolean; message: string }> {
    if (this.retryQueue.length === 0) {
      return { success: true, message: 'No pending operations to retry' };
    }

    const pendingCount = this.retryQueue.length;
    this.failCount = 0; // Reset fail count for immediate retry
    this.processRetries();
    
    return { success: true, message: `Retrying ${pendingCount} pending operations...` };
  }

  public getStatus(): SyncStatus {
    return {
      connected: true, // Will be tested separately
      lastSync: this.syncLogs.length > 0 ? this.syncLogs[this.syncLogs.length - 1].timestamp : undefined,
      pendingOperations: this.retryQueue.length,
      failedRetries: this.failCount,
      isRetrying: this.isProcessingRetries,
      error: this.syncLogs.filter(log => !log.success).slice(-1)[0]?.message
    };
  }

  public getSyncLogs(): Array<{ timestamp: Date; message: string; success: boolean }> {
    return this.syncLogs.slice(-20); // Return last 20 log entries
  }

  private addSyncLog(message: string, success: boolean): void {
    this.syncLogs.push({
      timestamp: new Date(),
      message,
      success
    });

    // Keep only last 100 log entries
    if (this.syncLogs.length > 100) {
      this.syncLogs = this.syncLogs.slice(-100);
    }

    console.log(`[GitHub Sync] ${message}`);
  }
}