// Define the shape of each store entry
type StoreEntry = { value: any };

// Define the config type as a record
type Config = Record<string, StoreEntry>;

// Default config object for state management
const config: Config = {
  counter: { value: 0 },
  items: { value: [] },
  user: { value: null },
  isLoggedIn: { value: false },
  todos: { value: [] }
};

export default config;
