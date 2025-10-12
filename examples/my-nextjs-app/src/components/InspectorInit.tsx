'use client';

import { useEffect } from 'react';
import { exposeStoresToInspector, announceToInspector } from '@/utils/inspector';

/**
 * Client component to initialize inspector integration
 */
export default function InspectorInit() {
  useEffect(() => {
    // Expose all stores to the inspector for automatic detection
    const storeKeys = [
      'counter',
      'cart',
      'user',
      'collaboration',
      'session',
      'audit',
      'gameState',
    ];
    
    exposeStoresToInspector(storeKeys);
    
    // Announce this app to the inspector
    announceToInspector({
      name: 'Fortistate Next.js Demo',
      version: '1.0.0',
      stores: storeKeys,
    });
    
    console.log('🔍 Inspector integration initialized');
    console.log('📊 Exposed stores:', storeKeys.join(', '));
    console.log('💡 Run `npm run inspect` to open the inspector');
  }, []);
  
  return null;
}
