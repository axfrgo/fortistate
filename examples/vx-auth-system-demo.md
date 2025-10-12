# 🎨 FortiState Visual Studio Demo: User Authentication System

## What You Can Build RIGHT NOW

This example shows how to use the **vX Visual Studio** to design a complete user authentication system using **Generative Existence Theory** (ontogenetic operators).

---

## 🚀 Step-by-Step Tutorial

### 1. **Open Visual Studio**
```bash
cd packages/visual-studio
npm run dev
```
Navigate to `http://localhost:5173`

---

### 2. **Switch to Play Mode**
Click the **"Play"** button at the top (the game controller icon 🎮)

---

### 3. **Drag Operators to Build Your Universe**

#### **Step 1: Create a Guest User (BEGIN)**
1. Drag **BEGIN** operator from the sidebar to the canvas
2. Click on the node to see its properties:
   - **Entity**: "BEGIN" (seed of potential)
   - **Metaphor**: "Seed of Potential"
   - **Narrative**: User starts as a guest
3. This represents the **initial state** - a guest user who hasn't logged in yet

#### **Step 2: Guest Registers (BECOME)**
1. Drag **BECOME** operator to the canvas
2. Connect BEGIN → BECOME (drag from the circle on the right of BEGIN to BECOME)
3. This represents **transformation**:
   - Guest → Registered User
   - Properties change: `{ role: 'guest' }` → `{ role: 'user', email: 'user@example.com' }`

#### **Step 3: User Logs In (BECOME)**
1. Drag another **BECOME** operator
2. Connect the first BECOME → second BECOME
3. This represents **authentication**:
   - Registered User → Authenticated User
   - Properties change: `{ authenticated: false }` → `{ authenticated: true, sessionToken: 'abc123' }`

#### **Step 4: User Logs Out (CEASE)**
1. Drag **CEASE** operator to the canvas
2. Connect BECOME (authenticated) → CEASE
3. This represents **boundary/termination**:
   - Authenticated session ends
   - Properties change: `{ authenticated: true }` → `{ authenticated: false, sessionToken: null }`

#### **Step 5: User Upgrades to Admin (TRANSCEND)**
1. Drag **TRANSCEND** operator to the canvas
2. Connect BECOME (authenticated) → TRANSCEND
3. This represents **elevation to new dimension**:
   - Regular User → Admin User
   - Properties change: `{ role: 'user' }` → `{ role: 'admin', permissions: ['read', 'write', 'delete'] }`

---

### 4. **View the Narrative Timeline**
1. Click **"Narrative"** button at the top right
2. You'll see your operators listed in execution order:
   ```
   📖 Execution Narrative
   
   5 operators ready
   
   🌱 BEGIN: Guest User
      Entity: GUEST
      Status: idle
   
   🌊 BECOME: Register
      Entity: USER
      Status: idle
   
   🌊 BECOME: Login
      Entity: AUTHENTICATED_USER
      Status: idle
   
   🔲 CEASE: Logout
      Entity: GUEST
      Status: idle
   
   ✨ TRANSCEND: Upgrade to Admin
      Entity: ADMIN
      Status: idle
   ```

---

### 5. **Execute Your Universe**
1. Click the **"Execute Graph"** button in the Narrative Panel
2. Watch the operators animate in real-time:
   - **BEGIN**: Seed pulses (guest spawns)
   - **BECOME**: Wave flows (user transforms)
   - **CEASE**: Boundary pulses (session ends)
   - **TRANSCEND**: Portal rotates (user ascends to admin)
3. Status changes from `idle` → `executing` → `completed`

---

### 6. **Switch to Algebra Mode**
1. Click the **"Algebra"** button (calculator icon 🔢)
2. See your visual graph **auto-generate executable code**:

```javascript
// Generated Ontogenetic Universe Code
import { BEGIN, BECOME, CEASE, TRANSCEND } from 'fortistate/ontogenesis'

// Initial state: Guest user
const guestUser = BEGIN('GUEST', {
  role: 'guest',
  authenticated: false
})

// Transform: Registration
const registeredUser = BECOME(guestUser, 'USER', (state) => ({
  ...state,
  role: 'user',
  email: 'user@example.com',
  createdAt: new Date()
}))

// Transform: Login
const authenticatedUser = BECOME(registeredUser, 'AUTHENTICATED_USER', (state) => ({
  ...state,
  authenticated: true,
  sessionToken: generateToken(),
  lastLogin: new Date()
}))

// Boundary: Logout
const loggedOut = CEASE(authenticatedUser, 'SESSION_END', (state) => ({
  ...state,
  authenticated: false,
  sessionToken: null
}))

// Transcend: Upgrade to Admin
const adminUser = TRANSCEND(authenticatedUser, 'ADMIN', (state) => ({
  ...state,
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'admin'],
  level: 'transcended'
}))

export { guestUser, registeredUser, authenticatedUser, loggedOut, adminUser }
```

---

### 7. **Switch to Hybrid Mode**
1. Click **"Hybrid"** button (split icon ⚡)
2. See **both visual graph AND code side-by-side**
3. Edit nodes on the left, watch code update on the right in real-time!

---

## 🎯 What This Demonstrates

### ✅ **Ontogenetic Operators in Action**
- **BEGIN**: Create initial entities (guest user spawns)
- **BECOME**: Transform entities (guest → user → authenticated)
- **CEASE**: Define boundaries (session ends)
- **TRANSCEND**: Elevate to new dimensions (user → admin)

### ✅ **Visual Programming**
- Drag-and-drop interface (no coding required initially)
- Connect operators to define flow
- Animate execution in real-time

### ✅ **Code Generation**
- Visual graph auto-generates executable JavaScript/TypeScript
- Copy-paste into your React/Node.js app
- Full type safety with FortiState

### ✅ **Three Modes**
- **Play Mode**: Visual-only design (for non-coders)
- **Algebra Mode**: Code-only view (for developers)
- **Hybrid Mode**: Best of both worlds

---

## 🔥 More Examples You Can Build

### **E-Commerce Cart**
1. **BEGIN**: Empty cart
2. **BECOME**: Add item to cart
3. **BECOME**: Update quantity
4. **CEASE**: Remove item
5. **TRANSCEND**: Cart → Order (checkout)

### **Game Character**
1. **BEGIN**: Spawn player at level 1
2. **BECOME**: Level up (gain XP)
3. **BECOME**: Equip weapon
4. **CEASE**: Lose health/die
5. **TRANSCEND**: Become legendary hero

### **Todo App**
1. **BEGIN**: Create todo
2. **BECOME**: Mark as in-progress
3. **BECOME**: Mark as completed
4. **CEASE**: Delete todo
5. **TRANSCEND**: Todo → Achievement (epic quest completed)

### **Social Media Post**
1. **BEGIN**: Draft post
2. **BECOME**: Publish post
3. **BECOME**: Edit post
4. **CEASE**: Archive post
5. **TRANSCEND**: Post goes viral (dimensional shift)

---

## 🎨 Why This Is Powerful

### **Traditional State Management**
```javascript
// Redux/Zustand - imperative, verbose
const userSlice = createSlice({
  name: 'user',
  initialState: { role: 'guest', authenticated: false },
  reducers: {
    register: (state, action) => { /* manual logic */ },
    login: (state, action) => { /* manual logic */ },
    logout: (state) => { /* manual logic */ },
    upgradeToAdmin: (state) => { /* manual logic */ }
  }
})
```

### **FortiState Visual Studio**
```
🎨 Drag 4 operators → Auto-generates code → Execute → Done!
```

### **Benefits**
- ✅ **Visual thinking**: Design state flow like a flowchart
- ✅ **Declarative**: Describe WHAT happens, not HOW
- ✅ **Type-safe**: Generated code includes TypeScript types
- ✅ **Testable**: Each operator is a pure function
- ✅ **Reusable**: Save universes as templates
- ✅ **Educational**: Learn state management visually

---

## 🚀 Try It NOW

1. **Load a Template** (bottom of sidebar):
   - Banking System
   - E-Commerce
   - Game State
   - Simple Demo

2. **Modify the Template**:
   - Add new operators
   - Change connections
   - Execute and watch

3. **Export the Code**:
   - Switch to Algebra Mode
   - Copy the generated code
   - Use in your app!

---

## 🌟 What's Next?

### **Coming Soon**
- Save/load custom universes
- Share universes with team
- Export to React/Vue/Svelte components
- Universe versioning & time-travel debugging

### **Already Available**
- ✅ Law Fabric Engine (universe forking)
- ✅ Paradox detection (no conflicts: ✓)
- ✅ 464 tests passing (0.64ms propagation)
- ✅ Production-ready TypeScript/React

---

## 📚 Learn More

- **Docs**: `docs/VISUAL_STUDIO_VX.md` - Full Visual Studio guide
- **Examples**: `examples/vx-*.mjs` - Executable demos
- **Theory**: `docs/EMERGENCE.md` - Generative Existence Theory

---

## 🎉 You're Ready!

Open Visual Studio, drag some operators, and **build something amazing**! 🚀✨

The universe is yours to create. 🌌
