/**
 * Client-safe store hook for Next.js
 * This avoids importing Node.js modules (fs, path, etc.) that cause build failures
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';

// Store registry (client-side only)
const stores = new Map<string, any>();
const subscribers = new Map<string, Set<Function>>();
const registeredStores = new Set<string>();

// Inspector configuration - use Next.js API route proxy
const INSPECTOR_URL = '/api/fortistate';

let inspectorToken: string | null = null;
let inspectorSessionId: string | null = null;
let sessionPromise: Promise<string | null> | null = null;

async function ensureInspectorSession(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (inspectorToken) return inspectorToken;
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    try {
      const response = await fetch(`${INSPECTOR_URL}/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'editor',
          label: 'Space Shooter Demo',
          expiresIn: '4h',
        }),
      });

      if (!response.ok) {
        console.warn('[Fortistate] Inspector session request failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json().catch(() => null);
      const token = data && typeof data.token === 'string' ? data.token : null;
      if (token) {
        inspectorToken = token;
        inspectorSessionId = data?.session?.id ?? response.headers.get('x-fortistate-session-id');
        console.log('[Fortistate] Inspector session established', inspectorSessionId ? `(#${inspectorSessionId})` : '');
      } else {
        console.warn('[Fortistate] Inspector session response missing token');
      }
      return inspectorToken;
    } catch (error) {
      console.warn('[Fortistate] Failed to establish inspector session:', error);
      return null;
    } finally {
      sessionPromise = null;
    }
  })();

  return sessionPromise;
}

async function sendInspectorRequest(path: string, payload: Record<string, unknown>): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const token = await ensureInspectorSession();
  if (!token) return false;

  try {
    const response = await fetch(`${INSPECTOR_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('[Fortistate] Inspector request failed:', path, response.status, response.statusText);
      if (response.status === 401) {
        inspectorToken = null;
      }
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[Fortistate] Inspector request error:', path, error);
    return false;
  }
}

/**
 * Register store with inspector
 */
async function registerStoreWithInspector(key: string, initialValue: any) {
  if (typeof window === 'undefined') return;
  if (registeredStores.has(key)) return;

  const success = await sendInspectorRequest('/register', {
    key,
    initial: initialValue,
  });

  if (success) {
    registeredStores.add(key);
    console.log(`[Fortistate] Registered store "${key}" with inspector`);
  }
}

/**
 * Create or get a store
 */
function getOrCreateStore<T>(key: string, initialValue: T) {
  if (!stores.has(key)) {
    stores.set(key, initialValue);
    subscribers.set(key, new Set());
    
  // Register with inspector
  void registerStoreWithInspector(key, initialValue);
    
    // Expose to inspector
    if (typeof window !== 'undefined') {
      (window as any).__FORTISTATE_STORES__ = (window as any).__FORTISTATE_STORES__ || [];
      if (!(window as any).__FORTISTATE_STORES__.includes(key)) {
        (window as any).__FORTISTATE_STORES__.push(key);
      }
    }
  }
  return stores.get(key);
}

/**
 * Subscribe to store changes
 */
function subscribe(key: string, callback: Function) {
  const subs = subscribers.get(key) || new Set();
  subs.add(callback);
  subscribers.set(key, subs);
  
  return () => {
    subs.delete(callback);
  };
}

/**
 * Notify subscribers of changes
 */
function notify(key: string) {
  const subs = subscribers.get(key);
  if (subs) {
    subs.forEach(callback => callback());
  }
}

/**
 * Client-safe useStore hook
 */
export function useClientStore<T = any>(key: string, initialValue?: T): [T, StoreUtils<T>] {
  // Get or create store
  const storeValue = getOrCreateStore(key, initialValue);
  
  // Local state to trigger re-renders
  const [, setVersion] = useState(0);
  
  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribe(key, () => {
      setVersion(v => v + 1);
    });
    return unsubscribe;
  }, [key]);
  
  // Store utilities
  const utils: StoreUtils<T> = {
    set: useCallback((newValue: T | ((prev: T) => T)) => {
      const current = stores.get(key);
      const next = typeof newValue === 'function' 
        ? (newValue as Function)(current) 
        : newValue;
      
      stores.set(key, next);
      notify(key);
      
      // Send update to inspector via API route
      if (typeof window !== 'undefined') {
        void sendInspectorRequest('/change', {
          key,
          value: next,
        });
      }
    }, [key]),
    
    get: useCallback(() => {
      return stores.get(key);
    }, [key]),
    
    reset: useCallback(() => {
      stores.set(key, initialValue);
      notify(key);
    }, [key, initialValue]),
  };
  
  return [stores.get(key), utils];
}

if (typeof window !== 'undefined') {
  void ensureInspectorSession();
}

export interface StoreUtils<T> {
  set: (value: T | ((prev: T) => T)) => void;
  get: () => T;
  reset: () => void;
}

/**
 * Proxy-based API for backward compatibility with fortistate
 */
export const useStore = new Proxy({} as any, {
  get(target, prop: string) {
    return function<T>(initialValue?: T) {
      return useClientStore<T>(prop, initialValue);
    };
  }
});

// Default export
export default useStore;
