// Store type definitions for comprehensive Fortistate demo
// Stores are accessed via useStore.storeName() proxy API

// 2. Shopping cart - demonstrates complex nested state
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Store schemas are defined implicitly via usage
// The useStore proxy automatically creates stores on first access

// Counter Store shape:
// {
//   count: number;
//   lastAction: string | null;
//   history: number[];
// }

// Cart Store shape:
// {
//   items: CartItem[];
//   total: number;
//   discount: number;
//   taxRate: number;
// }

// User Store shape:
// {
//   id: string;
//   name: string;
//   email: string;
//   role: 'observer' | 'editor' | 'admin';
//   preferences: {
//     theme: 'light' | 'dark';
//     notifications: boolean;
//   };
//   loginAt: number | null;
// }

// Collaboration Store shape:
// {
//   connectedUsers: Array<{
//     id: string;
//     displayName: string;
//     role: string;
//     activeStore: string | null;
//     cursorPath: string[] | null;
//     lastActivity: number;
//   }>;
//   myActiveStore: string | null;
//   myCursorPath: string[] | null;
// }

// Session Store shape:
// {
//   token: string | null;
//   sessionId: string | null;
//   role: 'observer' | 'editor' | 'admin';
//   expiresAt: number | null;
//   isAuthenticated: boolean;
// }

// Audit Store shape:
// {
//   entries: Array<{
//     timestamp: string;
//     level: string;
//     action: string;
//     sessionId?: string;
//     role?: string;
//     details?: string;
//   }>;
//   lastFetched: number | null;
//   format: 'json' | 'csv' | 'plain';
// }
