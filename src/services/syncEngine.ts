import { storageService } from './storage';
import { soundEffects } from '../utils/audio';

type SyncListener = (state: {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
}) => void;

class SyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSimulatedOffline: boolean = false;
  private isSyncing: boolean = false;
  private lastSyncTime: string | null = null;
  private listeners: SyncListener[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (this.effectiveOnline()) {
      this.syncNow();
    }
  }

  effectiveOnline(): boolean {
    return this.isOnline && !this.isSimulatedOffline;
  }

  setSimulatedOffline(simulated: boolean) {
    this.isSimulatedOffline = simulated;
    this.notify();
    if (this.effectiveOnline()) {
      this.syncNow();
    }
  }

  getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  getPendingCount(): number {
    return storageService.getSyncQueue().length;
  }

  getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }

  addListener(listener: SyncListener) {
    this.listeners.push(listener);
    listener({
      isOnline: this.isOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      isSyncing: this.isSyncing,
      pendingCount: this.getPendingCount(),
      lastSyncTime: this.lastSyncTime,
    });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = {
      isOnline: this.isOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      isSyncing: this.isSyncing,
      pendingCount: this.getPendingCount(),
      lastSyncTime: this.lastSyncTime,
    };
    this.listeners.forEach((l) => l(state));
  }

  async syncNow(): Promise<{ syncedCount: number; success: boolean }> {
    if (!this.effectiveOnline() || this.isSyncing) {
      return { syncedCount: 0, success: false };
    }

    const queue = storageService.getSyncQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, success: true };
    }

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;
    try {
      // Simulate network request batch sync to cloud backend
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const payments = storageService.getPayments();

      for (const item of queue) {
        if (item.entityType === 'payment' && item.data) {
          const payIdx = payments.findIndex((p) => p.id === item.data.id);
          if (payIdx !== -1) {
            payments[payIdx].syncStatus = 'synced';
            payments[payIdx].isOfflineSync = false;
          }
        }
        storageService.removeFromSyncQueue(item.id);
        syncedCount++;
      }

      storageService.savePayments(payments);
      this.lastSyncTime = new Date().toLocaleTimeString('es-ES');
      soundEffects.playSync();
    } catch {
      // Handle retry
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return { syncedCount, success: true };
  }
}

export const syncEngine = new SyncEngine();
