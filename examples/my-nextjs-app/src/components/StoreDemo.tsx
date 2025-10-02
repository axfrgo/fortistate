'use client';

import { useState } from 'react';
import { useStore } from 'fortistate';
import type { CartItem } from '@/stores';

export default function StoreDemo() {
  const [activeTab, setActiveTab] = useState('counter');

  // Access stores using the proxy-based useStore API
  // @ts-expect-error - useStore uses a Proxy for dynamic store access
  const [counterState, counterUtils] = useStore.counterStore();
  // @ts-expect-error - useStore uses a Proxy for dynamic store access
  const [cartState, cartUtils] = useStore.cartStore();
  // @ts-expect-error - useStore uses a Proxy for dynamic store access
  const [userState, userUtils] = useStore.userStore();

  const tabs = [
    { id: 'counter', label: 'Counter Store' },
    { id: 'cart', label: 'Cart Store' },
    { id: 'user', label: 'User Store' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Store Interactions</h2>
        <p className="text-gray-600 mb-4">
          Interact with different Fortistate stores. Changes are reflected in real-time in the inspector.
          <br />
          <span className="text-sm text-gray-500">
            Core Fortistate features: reactive state, nested objects, arrays, type safety
          </span>
        </p>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Counter Store */}
        {activeTab === 'counter' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">
                {counterState?.count ?? 0}
              </div>
              <div className="text-sm text-gray-600">
                Last Action: {counterState?.lastAction || 'None'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  counterUtils?.set?.({
                    ...counterState,
                    count: (counterState?.count ?? 0) + 1,
                    lastAction: 'increment',
                    history: [...(counterState?.history || []), (counterState?.count ?? 0)],
                  });
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Increment
              </button>
              <button
                onClick={() => {
                  counterUtils?.set?.({
                    ...counterState,
                    count: (counterState?.count ?? 0) - 1,
                    lastAction: 'decrement',
                    history: [...(counterState?.history || []), (counterState?.count ?? 0)],
                  });
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Decrement
              </button>
              <button
                onClick={() => {
                  counterUtils?.set?.({
                    count: 0,
                    lastAction: 'reset',
                    history: [],
                  });
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 col-span-2"
              >
                Reset
              </button>
            </div>

            {counterState?.history?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">History</div>
                <div className="text-xs text-gray-600 font-mono">
                  {counterState.history.join(' → ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart Store */}
        {activeTab === 'cart' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ${(cartState?.total ?? 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {(cartState?.items?.length ?? 0)} items
              </div>
            </div>

            <button
              onClick={() => {
                const newItem = {
                  id: `item-${Date.now()}`,
                  name: `Product ${(cartState?.items?.length ?? 0) + 1}`,
                  price: Math.floor(Math.random() * 50) + 10,
                  quantity: 1,
                };
                const items = [...(cartState?.items || []), newItem];
                const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                cartUtils?.set?.({
                  ...cartState,
                  items,
                  total,
                });
              }}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Add Random Item
            </button>

            {cartState?.items?.length > 0 ? (
              <div className="space-y-2">
                {cartState.items.map((item: CartItem, index: number) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-white border rounded-lg p-3"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        ${item.price} × {item.quantity}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const items = cartState.items.filter((_: CartItem, i: number) => i !== index);
                        const total = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
                        cartUtils?.set?.({
                          ...cartState,
                          items,
                          total,
                        });
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">Cart is empty</div>
            )}
          </div>
        )}

        {/* User Store */}
        {activeTab === 'user' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {userState?.name || 'Guest'}
              </div>
              <div className="text-sm text-gray-600">
                Role: <span className="font-mono">{userState?.role || 'observer'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={userState?.name || ''}
                  onChange={(e) => {
                    userUtils?.set?.({
                      ...userState,
                      name: e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={userState?.email || ''}
                  onChange={(e) => {
                    userUtils?.set?.({
                      ...userState,
                      email: e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <select
                  value={userState?.preferences?.theme || 'light'}
                  onChange={(e) => {
                    userUtils?.set?.({
                      ...userState,
                      preferences: {
                        ...userState?.preferences,
                        theme: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={userState?.preferences?.notifications ?? true}
                  onChange={(e) => {
                    userUtils?.set?.({
                      ...userState,
                      preferences: {
                        ...userState?.preferences,
                        notifications: e.target.checked,
                      },
                    });
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="notifications" className="text-sm font-medium">
                  Enable notifications
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
