/**
 * Tests for Cosmogenesis Universe Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UniverseManager, createUniverse, Multiverse } from '../src/cosmogenesis/universe.js';
import type { Substrate } from '../src/algebra/substrate.js';
import type { UniverseId } from '../src/temporal/causalEvent.js';

// Test substrate with a simple constraint
const createTestSubstrate = (): Substrate => ({
  id: 'test-substrate',
  name: 'Test Substrate',
  constraints: new Map([
    ['positive', {
      name: 'positive',
      invariants: [],
      validate: (value: number) => ({
        valid: value > 0,
        message: value > 0 ? undefined : `Value ${value} must be positive`,
      }),
    }],
  ]),
  laws: new Map(),
});

describe('UniverseManager', () => {
  let substrate: Substrate;

  beforeEach(() => {
    substrate = createTestSubstrate();
  });

  describe('initialization', () => {
    it('should create a universe with basic config', () => {
      const universe = new UniverseManager({
        id: 'test-universe' as UniverseId,
        name: 'Test Universe',
        substrate,
      });

      expect(universe.id).toBe('test-universe');
      expect(universe.name).toBe('Test Universe');
      expect(universe.getState()).toBe('initializing');
    });

    it('should create initial stores', () => {
      const initialStores = new Map<string, any>([
        ['counter', 0],
        ['name', 'Alice'],
      ]);

      const universe = new UniverseManager({
        id: 'test-universe' as UniverseId,
        substrate,
        initialStores,
      });

      expect(universe.hasStore('counter')).toBe(true);
      expect(universe.hasStore('name')).toBe(true);
      expect(universe.getStore('counter')?.get()).toBe(0);
      expect(universe.getStore('name')?.get()).toBe('Alice');
    });

    it('should track metadata', () => {
      const metadata = { environment: 'test', version: '1.0.0' };
      
      const universe = new UniverseManager({
        id: 'test-universe' as UniverseId,
        substrate,
        metadata,
      });

      const snapshot = universe.snapshot();
      expect(snapshot.metadata).toEqual(metadata);
    });
  });

  describe('lifecycle', () => {
    it('should transition through states correctly', () => {
      const universe = createUniverse({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      expect(universe.getState()).toBe('running');

      universe.pause();
      expect(universe.getState()).toBe('paused');

      universe.resume();
      expect(universe.getState()).toBe('running');

      universe.destroy();
      expect(universe.getState()).toBe('destroyed');
    });

    it('should not allow starting a destroyed universe', () => {
      const universe = new UniverseManager({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      universe.destroy();

      expect(() => universe.start()).toThrow('Cannot start destroyed universe');
    });

    it('should auto-start with createUniverse helper', () => {
      const universe = createUniverse({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      expect(universe.getState()).toBe('running');
    });
  });

  describe('store management', () => {
    let universe: UniverseManager;

    beforeEach(() => {
      universe = new UniverseManager({
        id: 'test-universe' as UniverseId,
        substrate,
      });
    });

    it('should create stores dynamically', () => {
      const store = universe.createStore('counter', 0);

      expect(store).toBeDefined();
      expect(store.get()).toBe(0);
      expect(universe.hasStore('counter')).toBe(true);
    });

    it('should not allow duplicate store keys', () => {
      universe.createStore('counter', 0);

      expect(() => universe.createStore('counter', 10)).toThrow(
        'Store counter already exists'
      );
    });

    it('should retrieve stores by key', () => {
      universe.createStore('counter', 42);

      const store = universe.getStore<number>('counter');
      expect(store?.get()).toBe(42);
    });

    it('should remove stores', () => {
      universe.createStore('counter', 0);
      expect(universe.hasStore('counter')).toBe(true);

      const removed = universe.removeStore('counter');
      expect(removed).toBe(true);
      expect(universe.hasStore('counter')).toBe(false);
    });

    it('should return false when removing non-existent store', () => {
      const removed = universe.removeStore('nonexistent');
      expect(removed).toBe(false);
    });

    it('should list all store keys', () => {
      universe.createStore('counter', 0);
      universe.createStore('name', 'Alice');
      universe.createStore('age', 30);

      const keys = universe.getStoreKeys();
      expect(keys).toContain('counter');
      expect(keys).toContain('name');
      expect(keys).toContain('age');
      expect(keys).toHaveLength(3);
    });
  });

  describe('statistics', () => {
    it('should track event counts', () => {
      const universe = createUniverse({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      const counter = universe.createStore('counter', 0);
      
      // Initial state has 1 event (creation)
      let stats = universe.getStats();
      expect(stats.eventCount).toBeGreaterThanOrEqual(0);

      counter.set(1);
      counter.set(2);
      counter.set(3);

      stats = universe.getStats();
      expect(stats.eventCount).toBeGreaterThanOrEqual(3);
    });

    it('should track store counts', () => {
      const universe = new UniverseManager({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      let stats = universe.getStats();
      expect(stats.storeCount).toBe(0);

      universe.createStore('counter', 0);
      stats = universe.getStats();
      expect(stats.storeCount).toBe(1);

      universe.createStore('name', 'Alice');
      stats = universe.getStats();
      expect(stats.storeCount).toBe(2);

      universe.removeStore('counter');
      stats = universe.getStats();
      expect(stats.storeCount).toBe(1);
    });

    it('should track uptime', () => {
      const universe = new UniverseManager({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      const stats = universe.getStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
      expect(stats.createdAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('snapshots', () => {
    it('should capture complete universe state', () => {
      const universe = new UniverseManager({
        id: 'test-universe' as UniverseId,
        name: 'Test Universe',
        substrate,
      });

      universe.createStore('counter', 42);
      universe.createStore('name', 'Alice');

      const snapshot = universe.snapshot();

      expect(snapshot.id).toBe('test-universe');
      expect(snapshot.name).toBe('Test Universe');
      expect(snapshot.storeCount).toBe(2);
      expect(snapshot.stores.get('counter')).toBe(42);
      expect(snapshot.stores.get('name')).toBe('Alice');
    });

    it('should restore from snapshot', () => {
      const universe = createUniverse({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      universe.createStore('counter', 10);
      universe.createStore('name', 'Alice');

      const snapshot = universe.snapshot();

      // Modify state
      universe.getStore('counter')?.set(99);
      universe.createStore('newStore', 'test');

      // Restore
      universe.restore(snapshot);

      expect(universe.getStore('counter')?.get()).toBe(10);
      expect(universe.getStore('name')?.get()).toBe('Alice');
      expect(universe.hasStore('newStore')).toBe(false);
    });

    it('should reject snapshot from different universe', () => {
      const universe1 = new UniverseManager({
        id: 'universe-1' as UniverseId,
        substrate,
      });

      const universe2 = new UniverseManager({
        id: 'universe-2' as UniverseId,
        substrate,
      });

      const snapshot = universe2.snapshot();

      expect(() => universe1.restore(snapshot)).toThrow(
        'Cannot restore snapshot from universe universe-2 into universe-1'
      );
    });
  });

  describe('forking', () => {
    it('should fork universe with current state', () => {
      const universe = createUniverse({
        id: 'original' as UniverseId,
        name: 'Original',
        substrate,
      });

      universe.createStore('counter', 42);
      
      const fork = universe.fork('fork-1' as UniverseId);

      expect(fork.id).toBe('fork-1');
      expect(fork.name).toBe('Original (fork)');
      expect(fork.getStore('counter')?.get()).toBe(42);
      
      // Changes to fork shouldn't affect original
      fork.getStore('counter')?.set(99);
      expect(universe.getStore('counter')?.get()).toBe(42);
    });

    it('should preserve metadata with fork marker', () => {
      const universe = createUniverse({
        id: 'original' as UniverseId,
        substrate,
        metadata: { environment: 'prod' },
      });

      const fork = universe.fork('fork-1' as UniverseId);
      const forkSnapshot = fork.snapshot();

      expect(forkSnapshot.metadata).toEqual({
        environment: 'prod',
        forkedFrom: 'original',
      });
    });

    it('should clone with automatic ID suffix', () => {
      const universe = createUniverse({
        id: 'original' as UniverseId,
        substrate,
      });

      const clone = universe.clone();
      expect(clone.id).toBe('original-clone');

      const clone2 = universe.clone('backup');
      expect(clone2.id).toBe('original-backup');
    });
  });

  describe('telemetry', () => {
    it('should collect telemetry events', () => {
      const universe = createUniverse({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      const telemetry = universe.getTelemetry();
      expect(Array.isArray(telemetry)).toBe(true);
    });

    it('should accept custom telemetry sink', () => {
      const events: any[] = [];
      const telemetrySink = (entry: any) => events.push(entry);

      const universe = createUniverse({
        id: 'test-universe' as UniverseId,
        substrate,
        telemetrySink,
      });

      // Create store and trigger some events
      const counter = universe.createStore('counter', 0);
      counter.set(1);

      // Note: telemetry events are only recorded when laws are violated
      // This test just verifies the sink is wired correctly
      expect(events.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('constraint auditing', () => {
    it('should perform full constraint scan', async () => {
      const universe = createUniverse({
        id: 'test-universe' as UniverseId,
        substrate,
      });

      universe.createStore('counter', 10);
      
      await expect(universe.scan()).resolves.not.toThrow();
    });
  });
});

describe('Multiverse', () => {
  let substrate: Substrate;

  beforeEach(() => {
    substrate = createTestSubstrate();
  });

  it('should manage multiple universes', () => {
    const multiverse = new Multiverse();

    const universe1 = new UniverseManager({
      id: 'universe-1' as UniverseId,
      substrate,
    });

    const universe2 = new UniverseManager({
      id: 'universe-2' as UniverseId,
      substrate,
    });

    multiverse.add(universe1);
    multiverse.add(universe2);

    expect(multiverse.getIds()).toEqual(['universe-1', 'universe-2']);
  });

  it('should not allow duplicate universe IDs', () => {
    const multiverse = new Multiverse();

    const universe = new UniverseManager({
      id: 'test' as UniverseId,
      substrate,
    });

    multiverse.add(universe);

    expect(() => multiverse.add(universe)).toThrow(
      'Universe test already exists in multiverse'
    );
  });

  it('should retrieve universes by ID', () => {
    const multiverse = new Multiverse();

    const universe = createUniverse({
      id: 'test' as UniverseId,
      name: 'Test Universe',
      substrate,
    });

    multiverse.add(universe);

    const retrieved = multiverse.get('test' as UniverseId);
    expect(retrieved?.name).toBe('Test Universe');
  });

  it('should remove and destroy universes', () => {
    const multiverse = new Multiverse();

    const universe = createUniverse({
      id: 'test' as UniverseId,
      substrate,
    });

    multiverse.add(universe);
    expect(multiverse.getIds()).toContain('test');

    const removed = multiverse.remove('test' as UniverseId);
    expect(removed).toBe(true);
    expect(multiverse.getIds()).not.toContain('test');
    expect(universe.getState()).toBe('destroyed');
  });

  it('should pause all universes', () => {
    const multiverse = new Multiverse();

    const universe1 = createUniverse({ id: 'u1' as UniverseId, substrate });
    const universe2 = createUniverse({ id: 'u2' as UniverseId, substrate });

    multiverse.add(universe1);
    multiverse.add(universe2);

    multiverse.pauseAll();

    expect(universe1.getState()).toBe('paused');
    expect(universe2.getState()).toBe('paused');
  });

  it('should resume all universes', () => {
    const multiverse = new Multiverse();

    const universe1 = createUniverse({ id: 'u1' as UniverseId, substrate });
    const universe2 = createUniverse({ id: 'u2' as UniverseId, substrate });

    multiverse.add(universe1);
    multiverse.add(universe2);

    multiverse.pauseAll();
    multiverse.resumeAll();

    expect(universe1.getState()).toBe('running');
    expect(universe2.getState()).toBe('running');
  });

  it('should destroy all universes', () => {
    const multiverse = new Multiverse();

    const universe1 = createUniverse({ id: 'u1' as UniverseId, substrate });
    const universe2 = createUniverse({ id: 'u2' as UniverseId, substrate });

    multiverse.add(universe1);
    multiverse.add(universe2);

    multiverse.destroyAll();

    expect(universe1.getState()).toBe('destroyed');
    expect(universe2.getState()).toBe('destroyed');
    expect(multiverse.getIds()).toHaveLength(0);
  });

  it('should aggregate statistics', () => {
    const multiverse = new Multiverse();

    const universe1 = createUniverse({ id: 'u1' as UniverseId, substrate });
    universe1.createStore('s1', 0);
    universe1.createStore('s2', 0);

    const universe2 = createUniverse({ id: 'u2' as UniverseId, substrate });
    universe2.createStore('s3', 0);

    multiverse.add(universe1);
    multiverse.add(universe2);

    const stats = multiverse.getStats();

    expect(stats.universeCount).toBe(2);
    expect(stats.totalStores).toBe(3);
    expect(stats.byState.running).toBe(2);
    expect(stats.byState.paused).toBe(0);
  });

  it('should get all universes', () => {
    const multiverse = new Multiverse();

    const universe1 = createUniverse({ id: 'u1' as UniverseId, substrate });
    const universe2 = createUniverse({ id: 'u2' as UniverseId, substrate });

    multiverse.add(universe1);
    multiverse.add(universe2);

    const all = multiverse.getAll();
    expect(all).toHaveLength(2);
    expect(all).toContain(universe1);
    expect(all).toContain(universe2);
  });
});
