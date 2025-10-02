/**
 * E-commerce Shopping Cart Example
 * 
 * Demonstrates constraint enforcement in a real-world business scenario:
 * - Inventory constraints (stock levels must be non-negative)
 * - Pricing laws (total = sum of item prices)
 * - Discount rules (automatic price adjustments)
 * - Cross-store dependencies (cart affects inventory)
 */

import { createUniverse, createSubstrate } from '../../dist/index.js';

// Define our business constraints
const ecommerceConstraints = new Map();

// Inventory must be non-negative
ecommerceConstraints.set('inventory', [
  {
    name: 'non-negative-stock',
    check: (state) => {
      for (const [product, qty] of Object.entries(state)) {
        if (qty < 0) {
          return { 
            valid: false, 
            reason: `${product} stock cannot be negative: ${qty}` 
          };
        }
      }
      return { valid: true };
    },
    repair: (state) => {
      const repaired = { ...state };
      for (const [product, qty] of Object.entries(repaired)) {
        if (qty < 0) repaired[product] = 0;
      }
      return repaired;
    },
  },
]);

// Cart items must have valid quantities
ecommerceConstraints.set('cart', [
  {
    name: 'valid-quantities',
    check: (state) => {
      for (const item of state.items || []) {
        if (item.quantity < 1) {
          return { 
            valid: false, 
            reason: `Item ${item.productId} must have quantity >= 1` 
          };
        }
      }
      return { valid: true };
    },
    repair: (state) => ({
      ...state,
      items: (state.items || []).filter(item => item.quantity >= 1),
    }),
  },
]);

// Define business laws
const ecommerceLaws = new Map();

// Law: Cart total must equal sum of item prices
ecommerceLaws.set('cart', [
  {
    name: 'calculate-total',
    description: 'Cart total = sum of (price × quantity) for all items',
    enforce: (state, allStates) => {
      const prices = allStates.get('prices') || {};
      let total = 0;
      
      for (const item of state.items || []) {
        const price = prices[item.productId] || 0;
        total += price * item.quantity;
      }
      
      return { ...state, total };
    },
    reactions: {
      prices: (cartState, pricesChanged, allStates) => {
        // Recalculate when prices change
        return {
          ...cartState,
          needsRecalc: true,
        };
      },
    },
  },
  {
    name: 'apply-discounts',
    description: 'Apply quantity discounts (buy 5+, get 10% off)',
    enforce: (state, allStates) => {
      const prices = allStates.get('prices') || {};
      let total = 0;
      let discountApplied = false;
      
      for (const item of state.items || []) {
        const basePrice = prices[item.productId] || 0;
        let itemTotal = basePrice * item.quantity;
        
        // Volume discount: 10% off when buying 5 or more
        if (item.quantity >= 5) {
          itemTotal *= 0.9;
          discountApplied = true;
        }
        
        total += itemTotal;
      }
      
      return { 
        ...state, 
        total: Math.round(total * 100) / 100,
        discountApplied,
      };
    },
  },
]);

// Law: Adding items to cart reduces inventory
ecommerceLaws.set('inventory', [
  {
    name: 'reserve-stock',
    description: 'When cart items added, reserve inventory',
    reactions: {
      cart: (inventoryState, cartChanged, allStates) => {
        const cart = allStates.get('cart') || { items: [] };
        const reservations = allStates.get('reservations') || {};
        const updated = { ...inventoryState };
        
        // For each cart item, ensure inventory is reserved
        for (const item of cart.items || []) {
          const reserved = reservations[item.productId] || 0;
          const inStock = updated[item.productId] || 0;
          
          // If we need more reserves, reduce inventory
          if (item.quantity > reserved) {
            const needed = item.quantity - reserved;
            updated[item.productId] = Math.max(0, inStock - needed);
          }
        }
        
        return updated;
      },
    },
  },
]);

// Create the e-commerce universe
const substrate = createSubstrate(
  'ecommerce',
  ecommerceConstraints,
  undefined,
  { laws: ecommerceLaws }
);

const universe = createUniverse({
  id: 'ecommerce-store',
  substrate,
  autoRepair: true,
  applyReactions: true,
});

// Initialize stores
const inventory = universe.createStore('inventory', {
  'widget-a': 100,
  'widget-b': 50,
  'gadget-x': 25,
});

const prices = universe.createStore('prices', {
  'widget-a': 19.99,
  'widget-b': 29.99,
  'gadget-x': 49.99,
});

const cart = universe.createStore('cart', {
  items: [],
  total: 0,
  discountApplied: false,
});

const reservations = universe.createStore('reservations', {
  'widget-a': 0,
  'widget-b': 0,
  'gadget-x': 0,
});

// Start the universe
universe.start();

console.log('🛒 E-commerce Shopping Cart Demo');
console.log('═'.repeat(50));
console.log();

// Display initial state
function displayState() {
  console.log('📦 Inventory:');
  const inv = inventory.get();
  for (const [product, qty] of Object.entries(inv)) {
    console.log(`   ${product}: ${qty} units`);
  }
  console.log();
  
  console.log('💰 Prices:');
  const prc = prices.get();
  for (const [product, price] of Object.entries(prc)) {
    console.log(`   ${product}: $${price}`);
  }
  console.log();
  
  console.log('🛍️  Cart:');
  const crt = cart.get();
  if (crt.items.length === 0) {
    console.log('   (empty)');
  } else {
    for (const item of crt.items) {
      const price = prices.get()[item.productId];
      console.log(`   ${item.productId} × ${item.quantity} @ $${price} = $${(price * item.quantity).toFixed(2)}`);
    }
    console.log(`   Total: $${crt.total.toFixed(2)}${crt.discountApplied ? ' (discount applied)' : ''}`);
  }
  console.log();
}

displayState();

// Scenario 1: Add item to cart
console.log('➕ Adding 3 widget-a to cart...');
cart.set({
  items: [
    { productId: 'widget-a', quantity: 3 },
  ],
  total: 0,
});

setTimeout(() => {
  displayState();
  
  // Scenario 2: Add more items to trigger volume discount
  console.log('➕ Adding 5 widget-b to cart (volume discount!)...');
  cart.set({
    items: [
      { productId: 'widget-a', quantity: 3 },
      { productId: 'widget-b', quantity: 5 },
    ],
    total: 0,
  });
  
  setTimeout(() => {
    displayState();
    
    // Scenario 3: Price change triggers recalculation
    console.log('💲 Price change: widget-a now $15.99...');
    prices.set({
      'widget-a': 15.99,
      'widget-b': 29.99,
      'gadget-x': 49.99,
    });
    
    setTimeout(() => {
      displayState();
      
      // Scenario 4: Try to add invalid quantity (will be repaired)
      console.log('❌ Attempting to add item with quantity 0 (will be repaired)...');
      cart.set({
        items: [
          { productId: 'widget-a', quantity: 3 },
          { productId: 'widget-b', quantity: 5 },
          { productId: 'gadget-x', quantity: 0 }, // Invalid!
        ],
        total: 0,
      });
      
      setTimeout(() => {
        displayState();
        
        // Display telemetry
        console.log('📊 System Telemetry:');
        const telemetry = universe.getTelemetry();
        console.log(`   Laws executed: ${telemetry.length}`);
        console.log(`   Repairs performed: ${telemetry.filter(t => t.repaired).length}`);
        console.log(`   Cross-store reactions: ${telemetry.filter(t => t.reactions).length}`);
        console.log();
        
        // Cleanup
        universe.destroy();
        console.log('✅ Demo complete!');
      }, 100);
    }, 100);
  }, 100);
}, 100);
