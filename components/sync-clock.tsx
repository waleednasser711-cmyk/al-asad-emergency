'use client';
import {memo,useSyncExternalStore} from 'react';
import type {createSyncClock} from '@/lib/sync-clock';
export const SyncClock=memo(function SyncClock({source}:{source:ReturnType<typeof createSyncClock>}){
 const time=useSyncExternalStore(source.subscribe,source.getSnapshot,source.getSnapshot);
 return <small>{time}</small>;
});
