/**
 * Reactive State Management for Deadlock Item Command Generator
 * Supports multiple copies (duplicates) via unique instanceIds,
 * exact global command ordering, and per-shop breakdown reordering.
 */

import { ITEMS, PRESETS } from './data/items.js';

const STORAGE_KEY = 'deadlock_hideout_command_state_v1';

let nextInstanceNum = 1;

function createInstance(item) {
  return {
    instanceId: `inst_${Date.now()}_${nextInstanceNum++}`,
    item
  };
}

class InventoryState {
  constructor() {
    this.queue = []; // Array of { instanceId, item }
    this.filters = {
      section: 'all', // 'all' | 'shop' | 'legendary' | 'cosmetic' | 'unreleased'
      shop: 'all',    // 'all' | 'weapon' | 'vitality' | 'spirit' | 'cosmetic'
      tier: 'all',    // 'all' | 1 | 2 | 3 | 4 | 5
      activeOnly: false,
      search: ''
    };
    this.options = {
      includeCheats: false,
      forceEnhanced: false, // Forces citadel_item_purchases_force_enhanced true
      format: 'semicolon',  // 'semicolon' | 'newline' | 'bind'
      bindKey: 'F6',
      chunkLimit: 250       // Safe Source 2 console paste limit per batch
    };
    this.listeners = new Set();
    this._loadFromStorage();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this._saveToStorage();
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.queueUids)) {
          this.queue = parsed.queueUids
            .map(entry => {
              if (typeof entry === 'string') {
                const found = ITEMS.find(i => i.uid === entry || i.id === entry);
                return found ? createInstance(found) : null;
              }
              if (entry && entry.custom) {
                return createInstance(entry);
              }
              const found = ITEMS.find(i => i.uid === entry.uid || i.id === entry.id);
              return found ? createInstance(found) : null;
            })
            .filter(Boolean);
        }
        if (parsed.options) {
          this.options = { ...this.options, ...parsed.options };
        }
        return;
      }
    } catch (err) {
      console.warn('Could not restore saved state:', err);
    }

    // Default first-visit state: Load the 8 Legendaries example command
    const defaultPreset = PRESETS[0];
    if (defaultPreset) {
      this.queue = defaultPreset.itemIds
        .map(id => ITEMS.find(i => i.id === id))
        .filter(Boolean)
        .map(item => createInstance(item));
    }
  }

  _saveToStorage() {
    try {
      const queueUids = this.queue.map(({ item }) =>
        item.custom ? item : { uid: item.uid, id: item.id }
      );
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          queueUids,
          options: this.options
        })
      );
    } catch (err) {
      // Ignore storage quota errors
    }
  }

  /**
   * Appends or stacks an item contiguous to its existing slot in queue
   */
  addItem(item) {
    // Find the last occurrence of this item in the queue so copies group together
    let lastIdx = -1;
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].item.uid === item.uid) {
        lastIdx = i;
        break;
      }
    }
    const newInst = createInstance(item);
    if (lastIdx !== -1) {
      this.queue.splice(lastIdx + 1, 0, newInst);
    } else {
      this.queue.push(newInst);
    }
    this.notify();
  }

  /**
   * Duplicates a specific instance right after its current slot in the command order
   */
  duplicateInstance(instanceId) {
    const idx = this.queue.findIndex(entry => entry.instanceId === instanceId);
    if (idx === -1) return;
    const sourceItem = this.queue[idx].item;
    const copy = createInstance(sourceItem);
    this.queue.splice(idx + 1, 0, copy);
    this.notify();
  }

  /**
   * Removes a specific instance by instanceId
   */
  removeInstance(instanceId) {
    const idx = this.queue.findIndex(entry => entry.instanceId === instanceId);
    if (idx === -1) return;
    this.queue.splice(idx, 1);
    this.notify();
  }

  /**
   * Removes the last instance of an item matching uid (used from Shop card '-' button)
   */
  removeLastByUid(uid) {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].item.uid === uid) {
        this.queue.splice(i, 1);
        this.notify();
        return;
      }
    }
  }

  /**
   * Moves all instances of an item (by uid) together to a new group position
   * preserving relative order of other items
   */
  moveGroupByUid(uid, targetGroupIndex) {
    const groups = this.getConsolidatedQueue();
    const currentGroupIdx = groups.findIndex(g => g.item.uid === uid);
    if (currentGroupIdx === -1 || currentGroupIdx === targetGroupIndex || targetGroupIndex < 0 || targetGroupIndex >= groups.length) {
      return;
    }

    const [movedGroup] = groups.splice(currentGroupIdx, 1);
    groups.splice(targetGroupIndex, 0, movedGroup);

    // Rebuild flattened queue maintaining contiguous copies
    const newQueue = [];
    for (const group of groups) {
      for (const instance of group.instances) {
        newQueue.push(instance);
      }
    }
    this.queue = newQueue;
    this.notify();
  }

  /**
   * Returns consolidated queue grouped by item.uid:
   * Array of { item, count, instances, firstIndex, lastIndex, isOverflow }
   */
  getConsolidatedQueue() {
    const groups = [];
    const groupMap = new Map();

    this.queue.forEach((entry, queueIdx) => {
      const uid = entry.item.uid;
      if (!groupMap.has(uid)) {
        const groupObj = {
          item: entry.item,
          instances: [entry],
          firstIndex: queueIdx,
          lastIndex: queueIdx,
          count: 1
        };
        groupMap.set(uid, groupObj);
        groups.push(groupObj);
      } else {
        const existing = groupMap.get(uid);
        existing.instances.push(entry);
        existing.lastIndex = queueIdx;
        existing.count++;
      }
    });

    return groups;
  }

  /**
   * Moves an item from fromIndex to toIndex in the global execution order
   */
  moveInstance(fromIndex, toIndex) {
    if (
      fromIndex < 0 ||
      fromIndex >= this.queue.length ||
      toIndex < 0 ||
      toIndex >= this.queue.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const [moved] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, moved);
    this.notify();
  }

  /**
   * Moves an instance by delta (-1 left/up, +1 right/down) in the global execution order
   */
  nudgeInstance(instanceId, delta) {
    const idx = this.queue.findIndex(entry => entry.instanceId === instanceId);
    if (idx === -1) return;
    this.moveInstance(idx, idx + delta);
  }

  /**
   * Reorders an item relative to other items of the SAME shop category
   * by swapping their slots in the global execution order
   */
  nudgeWithinShop(instanceId, direction) {
    const currentIndex = this.queue.findIndex(e => e.instanceId === instanceId);
    if (currentIndex === -1) return;
    const targetShop = this.queue[currentIndex].item.shop;

    let step = direction < 0 ? -1 : 1;
    let searchIdx = currentIndex + step;
    while (searchIdx >= 0 && searchIdx < this.queue.length) {
      if (this.queue[searchIdx].item.shop === targetShop) {
        // Swap these two positions in the global queue
        const temp = this.queue[currentIndex];
        this.queue[currentIndex] = this.queue[searchIdx];
        this.queue[searchIdx] = temp;
        this.notify();
        return;
      }
      searchIdx += step;
    }
  }

  /**
   * Sorts the global execution order by Shop (Weapon -> Vitality -> Spirit -> Cosmetic),
   * keeping relative order within each shop intact.
   */
  sortByShop() {
    const shopRank = { weapon: 1, vitality: 2, spirit: 3, cosmetic: 4 };
    this.queue.sort((a, b) => {
      const rankA = shopRank[a.item.shop] ?? 99;
      const rankB = shopRank[b.item.shop] ?? 99;
      return rankA - rankB;
    });
    this.notify();
  }

  /**
   * Moves Active items to the front of the queue so they claim the 4 active keybind slots first
   */
  prioritizeActivesFirst() {
    const actives = this.queue.filter(e => e.item.active);
    const passives = this.queue.filter(e => !e.item.active);
    this.queue = [...actives, ...passives];
    this.notify();
  }

  /**
   * Adds a custom console ID item not in the standard wiki list
   */
  addCustomItem(rawId, shop = 'weapon') {
    const cleanId = rawId.trim().replace(/^giveitem\s+/i, '').replace(/;+$/, '').trim();
    if (!cleanId) return false;
    const existing = ITEMS.find(i => i.id.toLowerCase() === cleanId.toLowerCase());
    if (existing) {
      this.addItem(existing);
      return true;
    }
    const customItem = {
      uid: `custom_${cleanId}`,
      name: cleanId.replace(/^upgrade_/, '').replace(/_/g, ' '),
      id: cleanId,
      shop,
      tier: 0,
      cost: 0,
      section: 'unreleased',
      active: false,
      custom: true,
      icon: 'https://cdn.deadlock.wiki/Souls_iconColored.png',
      wikiUrl: 'https://deadlock.wiki/Items'
    };
    this.addItem(customItem);
    return true;
  }

  loadPreset(presetId) {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    this.queue = preset.itemIds
      .map(id => {
        // Prefer shop or legendary version over unreleased when matching by ID
        return (
          ITEMS.find(i => i.id === id && i.section !== 'unreleased') ||
          ITEMS.find(i => i.id === id)
        );
      })
      .filter(Boolean)
      .map(item => createInstance(item));
    this.notify();
  }

  clearQueue() {
    this.queue = [];
    this.notify();
  }

  setFilter(key, value) {
    this.filters[key] = value;
    this.notify();
  }

  resetFilters() {
    this.filters = {
      section: 'all',
      shop: 'all',
      tier: 'all',
      activeOnly: false,
      search: ''
    };
    this.notify();
  }

  setOption(key, value) {
    this.options[key] = value;
    this.notify();
  }

  /**
   * Returns a Map of item.uid -> count in current queue
   */
  getCountsByUid() {
    const counts = new Map();
    for (const { item } of this.queue) {
      counts.set(item.uid, (counts.get(item.uid) || 0) + 1);
    }
    return counts;
  }

  /**
   * Returns filtered items for the Shop Grid
   */
  getFilteredCatalog() {
    const { section, shop, tier, activeOnly, search } = this.filters;
    const query = search.trim().toLowerCase();

    return ITEMS.filter(item => {
      if (section === 'curiosity') {
        if (item.section !== 'shop' && item.section !== 'legendary') return false;
      } else if (section !== 'all' && item.section !== section) {
        return false;
      }

      if (shop !== 'all' && item.shop !== shop) {
        return false;
      }

      if (tier !== 'all' && item.tier !== Number(tier)) {
        return false;
      }

      if (activeOnly && !item.active) {
        return false;
      }

      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesId = item.id.toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }
}

export const appState = new InventoryState();
