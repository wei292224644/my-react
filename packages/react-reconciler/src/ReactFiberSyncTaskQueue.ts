export type SchedulerCallback = (isSync: boolean) => SchedulerCallback | null;

let syncQueue: Array<SchedulerCallback> | null = null;
let isFlushingSyncQueue = false;

export const scheduleSyncCallback = (callback: SchedulerCallback) => {
  if (syncQueue === null) {
    syncQueue = [callback];
  } else {
    syncQueue.push(callback);
  }
};

export const flushSyncCallbacks = () => {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;

    try {
      syncQueue.forEach((callback) => {
        callback(true);
      });
    } catch (e) {
      if (__DEV__) {
        console.error('flushSyncCallbacks发生错误', e);
      }
    } finally {
      syncQueue = null;
      isFlushingSyncQueue = false;
    }
  }
};
