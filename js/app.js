/**
 * Main UI Controller for Deadlock Item Command Generator
 */

import { ITEMS, PRESETS, SHOP_METADATA } from './data/items.js';
import { ENHANCED_UPGRADES } from './data/descriptions.js';
import { appState } from './state.js';
import {
  generateCommandData,
  generateCfgFileContent,
  parseCommandString
} from './generator.js';

let draggedIndex = null;
let toastTimer = null;

/**
 * Generates an inline SVG fallback icon if a wiki CDN image fails to load
 */
export function getFallbackSvgDataUri(name, shop) {
  const colors = {
    weapon: ['#d97706', '#78350f'],
    vitality: ['#10b981', '#064e3b'],
    spirit: ['#a855f7', '#4c1d95'],
    cosmetic: ['#38bdf8', '#0c4a6e']
  };
  const [fg, bg] = colors[shop] || colors.weapon;
  const initials = (name || 'IT')
    .split(/[\s-]+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="10" fill="${bg}" stroke="${fg}" stroke-width="3"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-weight="800" font-size="22">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Displays a temporary toast notification
 */
function showToast(message) {
  const toastEl = document.getElementById('toast-notification');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2400);
}

/**
 * Copies text to clipboard with fallback
 */
async function copyToClipboard(text, label = 'Command') {
  if (!text) {
    showToast('Nothing to copy — select some items first!');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(`Copied ${label} to clipboard!`);
  }
}

/**
 * Renders the top Presets bar
 */
function renderPresetsBar() {
  const container = document.getElementById('presets-bar');
  if (!container) return;

  container.innerHTML = PRESETS.map(
    preset => `
      <button type="button" class="preset-chip" data-preset-id="${preset.id}" title="${preset.description}">
        <span class="preset-chip-dot"></span>
        <span>${preset.name}</span>
      </button>
    `
  ).join('');

  container.querySelectorAll('[data-preset-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-preset-id');
      appState.loadPreset(id);
      const preset = PRESETS.find(p => p.id === id);
      if (preset) showToast(`Loaded preset: ${preset.name}`);
    });
  });
}

/**
 * Renders the Command Generator Output & Batch Controls
 */
function renderCommandOutput() {
  const cmdData = generateCommandData(appState.queue, appState.options);
  const outputEl = document.getElementById('command-output-box');
  const charBadgeEl = document.getElementById('command-char-badge');
  const itemCountBadgeEl = document.getElementById('header-item-count');
  const bypassBadgeEl = document.getElementById('header-bypass-count');
  const activeBadgeEl = document.getElementById('header-active-count');
  const batchContainerEl = document.getElementById('batch-copy-container');

  if (outputEl) {
    outputEl.value = cmdData.fullCommand;
  }

  const totalItems = appState.queue.length;
  const activeCount = appState.queue.filter(e => e.item.active).length;
  const overflowCount = Math.max(0, totalItems - 12);

  if (itemCountBadgeEl) {
    itemCountBadgeEl.textContent = `${totalItems} Item${totalItems === 1 ? '' : 's'}`;
  }

  if (bypassBadgeEl) {
    if (overflowCount > 0) {
      bypassBadgeEl.textContent = `+${overflowCount} Over 12-Limit`;
      bypassBadgeEl.classList.add('bypass-active');
    } else {
      bypassBadgeEl.textContent = `${totalItems}/12 Standard Slots`;
      bypassBadgeEl.classList.remove('bypass-active');
    }
  }

  if (activeBadgeEl) {
    activeBadgeEl.textContent = `${activeCount}/4 Actives`;
    activeBadgeEl.classList.toggle('warning', activeCount > 4);
  }

  if (charBadgeEl) {
    charBadgeEl.textContent = `${cmdData.charCount} chars`;
    charBadgeEl.classList.toggle('warning', cmdData.charCount > 255);
  }

  // Render batch split buttons if there are multiple console chunks
  if (batchContainerEl) {
    if (cmdData.batches.length > 1) {
      batchContainerEl.innerHTML = `
        <div class="batch-notice">
          <span class="batch-notice-label">
            ⚡ Long command (${cmdData.charCount} chars) — Source 2 console may truncate single pastes over ~255 chars. Copy in safe batches:
          </span>
          <div class="batch-buttons">
            ${cmdData.batches
              .map(
                (batch, i) => `
                <button type="button" class="btn btn-batch" data-batch-idx="${i}">
                  📋 Copy Part ${i + 1} <span class="batch-len">(${batch.length}c)</span>
                </button>
              `
              )
              .join('')}
          </div>
        </div>
      `;
      batchContainerEl.querySelectorAll('[data-batch-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-batch-idx'));
          copyToClipboard(cmdData.batches[idx], `Batch Part ${idx + 1}/${cmdData.batches.length}`);
          btn.classList.add('copied');
          setTimeout(() => btn.classList.remove('copied'), 1500);
        });
      });
    } else {
      batchContainerEl.innerHTML = '';
    }
  }
}

/**
 * Renders Option B Part 1: Exact Global Command Execution Queue (1 -> N)
 * with Drag & Drop, Duplicate button, Left/Right reorder, and 12-Slot Bypass indicator
 */
function renderExecutionQueue() {
  const queueContainer = document.getElementById('execution-queue-list');
  const emptyState = document.getElementById('queue-empty-state');
  if (!queueContainer) return;

  if (appState.queue.length === 0) {
    queueContainer.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  let activeSeen = 0;
  const htmlParts = [];

  appState.queue.forEach((entry, index) => {
    const { instanceId, item } = entry;
    const orderNum = index + 1;
    const isOverflow = orderNum > 12;

    // Insert visual 12-item limit divider right before item #13
    if (orderNum === 13) {
      htmlParts.push(`
        <div class="queue-limit-divider" title="Items 13+ bypass the standard 12-slot Deadlock inventory limit">
          <span>⚡ 12-ITEM LIMIT BYPASS (SLOTS 13+) ⚡</span>
        </div>
      `);
    }

    let activeBadgeHtml = '';
    if (item.active) {
      activeSeen++;
      if (activeSeen <= 4) {
        activeBadgeHtml = `<span class="slot-active-pill" title="Claims Active Keybind Slot ${activeSeen} of 4">ACTIVE ${activeSeen}/4</span>`;
      } else {
        activeBadgeHtml = `<span class="slot-active-pill overflow-active" title="Exceeds 4 Active Keybind Slots — move earlier in queue if you need a keybind">ACTIVE ${activeSeen} (NO KEY)</span>`;
      }
    }

    const fallbackIcon = getFallbackSvgDataUri(item.name, item.shop);

    htmlParts.push(`
      <div class="queue-item-card shop-${item.shop} ${isOverflow ? 'is-overflow-slot' : ''} ${item.active ? 'is-active-item' : ''}"
           draggable="true"
           data-instance-id="${instanceId}"
           data-index="${index}">
        <div class="queue-card-top">
          <span class="queue-order-badge ${isOverflow ? 'badge-overflow' : ''}">#${orderNum}</span>
          ${activeBadgeHtml}
          <span class="queue-slot-type">${isOverflow ? 'BYPASS' : 'HUD'}</span>
        </div>

        <div class="queue-card-main">
          <div class="queue-icon-wrap ${item.active ? 'active-frame' : ''}">
            <img src="${item.icon}"
                 alt="${item.name}"
                 loading="lazy"
                 onerror="this.onerror=null;this.src='${fallbackIcon}';" />
          </div>
          <div class="queue-item-info">
            <div class="queue-item-name" title="${item.name}">${item.name}</div>
            <div class="queue-item-id" title="giveitem ${item.id}">${item.id}</div>
          </div>
        </div>

        <div class="queue-card-actions">
          <button type="button"
                  class="q-btn q-btn-move"
                  data-action="move-prev"
                  data-instance-id="${instanceId}"
                  ${index === 0 ? 'disabled' : ''}
                  title="Move earlier in command order">◀</button>
          <button type="button"
                  class="q-btn q-btn-move"
                  data-action="move-next"
                  data-instance-id="${instanceId}"
                  ${index === appState.queue.length - 1 ? 'disabled' : ''}
                  title="Move later in command order">▶</button>
          <button type="button"
                  class="q-btn q-btn-dup"
                  data-action="duplicate"
                  data-instance-id="${instanceId}"
                  title="Duplicate this item (add another copy right after this slot)">+ Copy</button>
          <button type="button"
                  class="q-btn q-btn-del"
                  data-action="remove"
                  data-instance-id="${instanceId}"
                  title="Remove this copy">✕</button>
        </div>
      </div>
    `);
  });

  queueContainer.innerHTML = htmlParts.join('');

  // Bind button actions inside the execution queue
  queueContainer.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const instanceId = btn.getAttribute('data-instance-id');
      if (action === 'move-prev') {
        appState.nudgeInstance(instanceId, -1);
      } else if (action === 'move-next') {
        appState.nudgeInstance(instanceId, 1);
      } else if (action === 'duplicate') {
        appState.duplicateInstance(instanceId);
        showToast('Duplicated item in queue!');
      } else if (action === 'remove') {
        appState.removeInstance(instanceId);
      }
    });
  });

  // Bind HTML5 Drag-and-Drop reordering and tooltip hover
  queueContainer.querySelectorAll('.queue-item-card').forEach(card => {
    const idx = Number(card.getAttribute('data-index'));
    const entry = appState.queue[idx];
    if (entry) {
      card.addEventListener('mouseenter', e => {
        const count = appState.getCountsByUid().get(entry.item.uid) || 0;
        showItemTooltip(entry.item, count, e);
      });
      card.addEventListener('mousemove', e => {
        updateItemTooltipPosition(e);
      });
      card.addEventListener('mouseleave', () => {
        hideItemTooltip();
      });
    }

    card.addEventListener('dragstart', e => {
      hideItemTooltip();
      draggedIndex = Number(card.getAttribute('data-index'));
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedIndex = null;
      queueContainer.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const targetIndex = Number(card.getAttribute('data-index'));
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        appState.moveInstance(draggedIndex, targetIndex);
      }
      draggedIndex = null;
    });
  });
}

/**
 * Renders Option B Part 2: Selected Inventory Broken Down by Shop
 * Shows each shop's items with their global #Order number, Soul investment,
 * Duplicate (+), Remove (✕), and within-shop Up/Down (▲/▼) reorder buttons
 */
function renderShopBreakdown() {
  const container = document.getElementById('shop-breakdown-grid');
  if (!container) return;

  const shops = ['weapon', 'vitality', 'spirit', 'cosmetic'];

  container.innerHTML = shops
    .map(shopKey => {
      const meta = SHOP_METADATA[shopKey];
      const shopEntries = appState.queue
        .map((entry, globalIdx) => ({
          ...entry,
          globalOrder: globalIdx + 1
        }))
        .filter(e => e.item.shop === shopKey);

      // Hide Cosmetic column if empty to save space, unless it has items
      if (shopKey === 'cosmetic' && shopEntries.length === 0) {
        return '';
      }

      const totalSouls = shopEntries.reduce((sum, e) => sum + (e.item.cost || 0), 0);

      return `
        <div class="shop-breakdown-col shop-col-${shopKey}">
          <div class="shop-col-header">
            <div class="shop-col-title">
              <img src="${meta.icon}" alt="${meta.label}" class="shop-header-icon" onerror="this.style.display='none'" />
              <span>${meta.label}</span>
              <span class="shop-col-count">${shopEntries.length}</span>
            </div>
            ${
              totalSouls > 0
                ? `<div class="shop-col-souls" title="Total Soul Value in ${meta.label}"> ${totalSouls.toLocaleString()} Souls</div>`
                : `<div class="shop-col-souls">Special</div>`
            }
          </div>

          <div class="shop-col-list">
            ${
              shopEntries.length === 0
                ? `<div class="shop-col-empty">No ${meta.label} items selected</div>`
                : shopEntries
                    .map((entry, idxInShop) => {
                      const fallbackIcon = getFallbackSvgDataUri(entry.item.name, entry.item.shop);
                      return `
                        <div class="shop-breakdown-row shop-row-${shopKey}">
                          <span class="breakdown-order-pill" title="Position #${entry.globalOrder} in global command">#${entry.globalOrder}</span>
                          <img src="${entry.item.icon}"
                               alt="${entry.item.name}"
                               class="breakdown-row-icon ${entry.item.active ? 'active-frame' : ''}"
                               onerror="this.onerror=null;this.src='${fallbackIcon}';" />
                          <div class="breakdown-row-text">
                            <span class="breakdown-row-name">${entry.item.name}</span>
                            <span class="breakdown-row-sub">
                              ${entry.item.tier === 5 ? '★ Legendary' : entry.item.tier > 0 ? `T${entry.item.tier}` : entry.item.section}
                              ${entry.item.active ? ' • Active' : ''}
                            </span>
                          </div>
                          <div class="breakdown-row-actions">
                            <button type="button"
                                    class="b-btn"
                                    data-shop-action="up"
                                    data-instance-id="${entry.instanceId}"
                                    ${idxInShop === 0 ? 'disabled' : ''}
                                    title="Move up within ${meta.label} order">▲</button>
                            <button type="button"
                                    class="b-btn"
                                    data-shop-action="down"
                                    data-instance-id="${entry.instanceId}"
                                    ${idxInShop === shopEntries.length - 1 ? 'disabled' : ''}
                                    title="Move down within ${meta.label} order">▼</button>
                            <button type="button"
                                    class="b-btn b-btn-dup"
                                    data-shop-action="dup"
                                    data-instance-id="${entry.instanceId}"
                                    title="Duplicate this item (+1 copy)">+</button>
                            <button type="button"
                                    class="b-btn b-btn-del"
                                    data-shop-action="del"
                                    data-instance-id="${entry.instanceId}"
                                    title="Remove this copy">✕</button>
                          </div>
                        </div>
                      `;
                    })
                    .join('')
            }
          </div>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('[data-shop-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-shop-action');
      const instanceId = btn.getAttribute('data-instance-id');
      if (action === 'up') {
        appState.nudgeWithinShop(instanceId, -1);
      } else if (action === 'down') {
        appState.nudgeWithinShop(instanceId, 1);
      } else if (action === 'dup') {
        appState.duplicateInstance(instanceId);
        showToast('Added duplicate copy!');
      } else if (action === 'del') {
        appState.removeInstance(instanceId);
      }
    });
  });

  // Bind tooltip hover on shop breakdown rows
  container.querySelectorAll('.shop-breakdown-row').forEach(row => {
    const instId = row.querySelector('[data-instance-id]')?.getAttribute('data-instance-id');
    const entry = appState.queue.find(e => e.instanceId === instId);
    if (entry) {
      row.addEventListener('mouseenter', e => {
        const count = appState.getCountsByUid().get(entry.item.uid) || 0;
        showItemTooltip(entry.item, count, e);
      });
      row.addEventListener('mousemove', e => {
        updateItemTooltipPosition(e);
      });
      row.addEventListener('mouseleave', () => {
        hideItemTooltip();
      });
    }
  });
}

/**
 * Displays a rich Deadlock-style hover tooltip for any item
 */
function showItemTooltip(item, count, e) {
  const tooltip = document.getElementById('item-shop-tooltip');
  if (!tooltip) return;

  const shopMeta = SHOP_METADATA[item.shop] || { label: item.shop, color: '#e58e26' };
  const tierLabel =
    item.tier === 5
      ? '★ Legendary Item'
      : item.tier > 0
      ? `Tier ${item.tier} • ${item.cost.toLocaleString()} Souls`
      : item.section === 'cosmetic'
      ? 'Seasonal Cosmetic'
      : 'Unreleased Item';

  const activeBadge = item.active
    ? `<span class="tt-tag tt-tag-active">ACTIVE</span>`
    : `<span class="tt-tag tt-tag-passive">PASSIVE</span>`;

  const fallbackIcon = getFallbackSvgDataUri(item.name, item.shop);
  const enhancedBoost = ENHANCED_UPGRADES[item.id];
  const isEnhancedActive = appState.options.forceEnhanced;

  let enhancedHtml = '';
  if (enhancedBoost) {
    enhancedHtml = `
      <div class="tt-enhanced-box ${isEnhancedActive ? 'is-active-enhanced' : ''}">
        <div class="tt-enhanced-header">
          <span class="tt-enhanced-badge">⚡ ENHANCED BOOST</span>
          ${isEnhancedActive ? '<span class="tt-enhanced-status">ACTIVE</span>' : ''}
        </div>
        <div class="tt-enhanced-stats">${enhancedBoost}</div>
      </div>
    `;
  }

  tooltip.innerHTML = `
    <div class="tt-header">
      <img src="${item.icon}" alt="${item.name}" class="tt-icon ${item.active ? 'active-frame' : ''}" onerror="this.onerror=null;this.src='${fallbackIcon}';" />
      <div class="tt-title-wrap">
        <div class="tt-name">${item.name}</div>
        <div class="tt-meta">
          <span class="tt-shop" style="color: ${shopMeta.color}">${shopMeta.label}</span> •
          <span>${tierLabel}</span>
          ${activeBadge}
        </div>
      </div>
    </div>
    <div class="tt-divider"></div>
    <div class="tt-desc">${item.description || 'Provides bonus stats and effects in Deadlock.'}</div>
    ${enhancedHtml}
    <div class="tt-code"><code>giveitem ${item.id}</code></div>
    <div class="tt-footer">
      <span class="tt-hint"><strong>Left-Click:</strong> +1 copy ${count > 0 ? `(Purchased: ×${count})` : ''}</span>
      ${count > 0 ? `<span class="tt-hint-sub"><strong>Right-Click:</strong> −1 copy</span>` : ''}
    </div>
  `;

  tooltip.style.display = 'block';
  tooltip.setAttribute('aria-hidden', 'false');
  updateItemTooltipPosition(e);
}

function updateItemTooltipPosition(e) {
  const tooltip = document.getElementById('item-shop-tooltip');
  if (!tooltip || tooltip.style.display === 'none') return;

  const offset = 14;
  let x = e.clientX + offset;
  let y = e.clientY + offset;

  const rect = tooltip.getBoundingClientRect();
  const winW = window.innerWidth;
  const winH = window.innerHeight;

  if (x + rect.width > winW - 12) {
    x = e.clientX - rect.width - offset;
  }
  if (y + rect.height > winH - 12) {
    y = e.clientY - rect.height - offset;
  }
  if (x < 12) x = 12;
  if (y < 12) y = 12;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideItemTooltip() {
  const tooltip = document.getElementById('item-shop-tooltip');
  if (!tooltip) return;
  tooltip.style.display = 'none';
  tooltip.setAttribute('aria-hidden', 'true');
}

/**
 * Helper to render an authentic compact Item Icon Tile in the Shop Grid
 */
function renderCatalogItemTile(item, count) {
  const fallbackIcon = getFallbackSvgDataUri(item.name, item.shop);

  return `
    <button type="button"
            class="shop-item-tile shop-${item.shop} ${count > 0 ? 'is-purchased' : ''} ${item.tier === 5 ? 'is-legendary' : ''}"
            data-uid="${item.uid}"
            aria-label="${item.name}">
      <div class="tile-icon-frame ${item.active ? 'active-frame' : ''}">
        <img src="${item.icon}"
             alt="${item.name}"
             loading="lazy"
             onerror="this.onerror=null;this.src='${fallbackIcon}';" />
        ${count > 0 ? `<span class="tile-qty-badge">x${count}</span>` : ''}
      </div>
    </button>
  `;
}

/**
 * Renders the Store Shelves organized into compact Deadlock shop rows:
 * - Curiosity Shop & Legendaries in 3 side-by-side shop columns (Weapon / Vitality / Spirit)
 * - Seasonal Cosmetic Items Shelf
 * - Unreleased & Cut Items Shelves
 */
function renderCatalog() {
  const container = document.getElementById('catalog-sections-container');
  const resultCountEl = document.getElementById('catalog-result-count');
  if (!container) return;

  const filtered = appState.getFilteredCatalog();
  const countsByUid = appState.getCountsByUid();

  if (resultCountEl) {
    resultCountEl.textContent = `Showing ${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="catalog-empty">
        <p>No items match your current filter or search query.</p>
        <button type="button" id="reset-filters-empty-btn" class="btn btn-secondary">Reset All Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('reset-filters-empty-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('catalog-search-input');
        if (searchInput) searchInput.value = '';
        appState.resetFilters();
      });
    }
    return;
  }

  const htmlSections = [];

  // 1. Standard Curiosity Shop + Legendaries (Grouped by Shop -> Tier Shelves)
  const mainItems = filtered.filter(i => i.section === 'shop' || i.section === 'legendary');
  if (mainItems.length > 0) {
    const shops = ['weapon', 'vitality', 'spirit'];
    const activeShops = shops.filter(shopKey => mainItems.some(i => i.shop === shopKey));

    const shopColsHtml = activeShops
      .map(shopKey => {
        const shopItems = mainItems.filter(i => i.shop === shopKey);
        const meta = SHOP_METADATA[shopKey];
        const tiers = [5, 4, 3, 2, 1];

        const tierNames = {
          5: '★ Legendary (Street Brawl)',
          4: 'Tier 4',
          3: 'Tier 3',
          2: 'Tier 2',
          1: 'Tier 1'
        };

        const tierCosts = {
          5: 'Hideout / Brawl',
          4: '6,400 Souls',
          3: '3,200 Souls',
          2: '1,600 Souls',
          1: '800 Souls'
        };

        const tierRowsHtml = tiers
          .map(tierNum => {
            const tierItems = shopItems.filter(i => i.tier === tierNum);
            if (tierItems.length === 0) return '';
            return `
              <div class="tier-shelf-row tier-row-${tierNum}">
                <div class="tier-shelf-header">
                  <span class="tier-shelf-title">${tierNames[tierNum]}</span>
                  <span class="tier-shelf-cost">${tierCosts[tierNum]}</span>
                </div>
                <div class="tier-shelf-tiles">
                  ${tierItems.map(item => renderCatalogItemTile(item, countsByUid.get(item.uid) || 0)).join('')}
                </div>
              </div>
            `;
          })
          .join('');

        return `
          <div class="shop-shelf-col shop-col-${shopKey}">
            <div class="shop-shelf-header">
              <img src="${meta.icon}" alt="${meta.label}" class="shelf-header-icon" onerror="this.style.display='none'" />
              <div class="shelf-header-text">
                <span class="shelf-title">${meta.label} Shop</span>
                <span class="shelf-subtitle">${shopItems.length} items</span>
              </div>
            </div>
            <div class="shop-shelf-body">
              ${tierRowsHtml}
            </div>
          </div>
        `;
      })
      .join('');

    htmlSections.push(`
      <div class="curiosity-shop-shelves">
        ${shopColsHtml}
      </div>
    `);
  }

  // 2. Dedicated Cosmetic Items Section
  const cosmeticItems = filtered.filter(i => i.section === 'cosmetic');
  if (cosmeticItems.length > 0) {
    htmlSections.push(`
      <section class="special-shelf-section special-section-cosmetic" id="section-cosmetic">
        <div class="special-shelf-header">
          <img src="${SHOP_METADATA.cosmetic.icon}" alt="Cosmetic" class="shelf-header-icon" onerror="this.style.display='none'" />
          <div>
            <h3 class="shelf-title">Seasonal &amp; Event Cosmetic Items</h3>
            <p class="shelf-desc">Uses special "E" keybind slot without consuming an inventory slot.</p>
          </div>
        </div>
        <div class="tier-shelf-tiles special-tiles">
          ${cosmeticItems.map(item => renderCatalogItemTile(item, countsByUid.get(item.uid) || 0)).join('')}
        </div>
      </section>
    `);
  }

  // 3. Dedicated Unreleased & Cut Items Section
  const unreleasedItems = filtered.filter(i => i.section === 'unreleased');
  if (unreleasedItems.length > 0) {
    const subShops = ['weapon', 'spirit', 'vitality'];
    const unreleasedColsHtml = subShops
      .map(shopKey => {
        const group = unreleasedItems.filter(i => i.shop === shopKey);
        if (group.length === 0) return '';
        const meta = SHOP_METADATA[shopKey];
        return `
          <div class="unreleased-shelf-group">
            <div class="tier-shelf-header">
              <span class="tier-shelf-title">🧪 Cut &amp; Unreleased ${meta.label}</span>
              <span class="tier-shelf-cost">${group.length} items</span>
            </div>
            <div class="tier-shelf-tiles">
              ${group.map(item => renderCatalogItemTile(item, countsByUid.get(item.uid) || 0)).join('')}
            </div>
          </div>
        `;
      })
      .join('');

    htmlSections.push(`
      <section class="special-shelf-section special-section-unreleased" id="section-unreleased">
        <div class="special-shelf-header">
          <div class="unreleased-banner-badge">🧪</div>
          <div>
            <h3 class="shelf-title">Unreleased &amp; Cut Game-File Items</h3>
            <p class="shelf-desc">Hidden experimental items found in Deadlock game files. Testable in the Hideout via <code>giveitem</code>.</p>
          </div>
        </div>
        <div class="unreleased-shelves-grid">
          ${unreleasedColsHtml}
        </div>
      </section>
    `);
  }

  container.innerHTML = htmlSections.join('');

  // Bind click, right-click, and hover tooltip events on shop tiles
  container.querySelectorAll('.shop-item-tile').forEach(tile => {
    const uid = tile.getAttribute('data-uid');
    const item = ITEMS.find(i => i.uid === uid);
    if (!item) return;

    // Left-click: Add 1 copy
    tile.addEventListener('click', e => {
      e.preventDefault();
      appState.addItem(item);
      const count = (appState.getCountsByUid().get(item.uid) || 0);
      showItemTooltip(item, count, e);
    });

    // Right-click: Remove 1 copy
    tile.addEventListener('contextmenu', e => {
      e.preventDefault();
      const currentCount = (appState.getCountsByUid().get(item.uid) || 0);
      if (currentCount > 0) {
        appState.removeLastByUid(item.uid);
        const newCount = (appState.getCountsByUid().get(item.uid) || 0);
        showItemTooltip(item, newCount, e);
      }
    });

    // Hover tooltip
    tile.addEventListener('mouseenter', e => {
      const count = (appState.getCountsByUid().get(item.uid) || 0);
      showItemTooltip(item, count, e);
    });

    tile.addEventListener('mousemove', e => {
      updateItemTooltipPosition(e);
    });

    tile.addEventListener('mouseleave', () => {
      hideItemTooltip();
    });
  });
}

/**
 * Syncs filter button active states with appState.filters
 */
function syncFilterControlsUI() {
  const { section, shop, tier, activeOnly } = appState.filters;

  document.querySelectorAll('[data-filter-section]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter-section') === section);
  });

  document.querySelectorAll('[data-filter-shop]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter-shop') === shop);
  });

  document.querySelectorAll('[data-filter-tier]').forEach(btn => {
    btn.classList.toggle('active', String(btn.getAttribute('data-filter-tier')) === String(tier));
  });

  const activeToggle = document.getElementById('filter-active-only');
  if (activeToggle) {
    activeToggle.checked = activeOnly;
  }

  const cheatsToggle = document.getElementById('opt-include-cheats');
  if (cheatsToggle) {
    cheatsToggle.checked = appState.options.includeCheats;
  }

  const formatSelect = document.getElementById('opt-format-select');
  if (formatSelect) {
    formatSelect.value = appState.options.format;
  }

  const bindKeyWrap = document.getElementById('bind-key-input-wrap');
  if (bindKeyWrap) {
    bindKeyWrap.style.display = appState.options.format === 'bind' ? 'inline-flex' : 'none';
  }
}

/**
 * Full UI render cycle
 */
function renderAll() {
  syncFilterControlsUI();
  renderCommandOutput();
  renderExecutionQueue();
  renderShopBreakdown();
  renderCatalog();
}

/**
 * Initializes event listeners and starts the application
 */
export function initApp() {
  renderPresetsBar();

  // Subscribe to state updates
  appState.subscribe(() => {
    renderAll();
  });

  // Copy full command button
  const copyMainBtn = document.getElementById('copy-main-command-btn');
  if (copyMainBtn) {
    copyMainBtn.addEventListener('click', () => {
      const cmdData = generateCommandData(appState.queue, appState.options);
      copyToClipboard(cmdData.fullCommand, `${cmdData.itemCount}-item command`);
    });
  }

  // Download .cfg file button
  const downloadCfgBtn = document.getElementById('download-cfg-btn');
  if (downloadCfgBtn) {
    downloadCfgBtn.addEventListener('click', () => {
      if (appState.queue.length === 0) {
        showToast('Add at least one item before downloading a .cfg file!');
        return;
      }
      const cfgContent = generateCfgFileContent(appState.queue, appState.options);
      const blob = new Blob([cfgContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hideout_items.cfg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded hideout_items.cfg! Run "exec hideout_items" in console.');
    });
  }

  // Queue Action Buttons: Sort by Shop, Prioritize Actives, Clear All
  const sortShopBtn = document.getElementById('sort-by-shop-btn');
  if (sortShopBtn) {
    sortShopBtn.addEventListener('click', () => {
      appState.sortByShop();
      showToast('Sorted command order by Shop (Weapon → Vitality → Spirit)!');
    });
  }

  const prioritizeActivesBtn = document.getElementById('prioritize-actives-btn');
  if (prioritizeActivesBtn) {
    prioritizeActivesBtn.addEventListener('click', () => {
      appState.prioritizeActivesFirst();
      showToast('Moved Active items to front of queue (Slots 1–4)!');
    });
  }

  const clearQueueBtn = document.getElementById('clear-queue-btn');
  if (clearQueueBtn) {
    clearQueueBtn.addEventListener('click', () => {
      appState.clearQueue();
      showToast('Cleared item queue.');
    });
  }

  // Command Generator Options
  const cheatsToggle = document.getElementById('opt-include-cheats');
  if (cheatsToggle) {
    cheatsToggle.checked = !!appState.options.includeCheats;
    cheatsToggle.addEventListener('change', e => {
      appState.setOption('includeCheats', e.target.checked);
    });
  }

  const enhancedToggle = document.getElementById('opt-force-enhanced');
  if (enhancedToggle) {
    enhancedToggle.checked = !!appState.options.forceEnhanced;
    enhancedToggle.addEventListener('change', e => {
      appState.setOption('forceEnhanced', e.target.checked);
      if (e.target.checked) {
        showToast('⚡ Enhanced Items active: Prepending citadel_item_purchases_force_enhanced true');
      }
    });
  }

  const formatSelect = document.getElementById('opt-format-select');
  if (formatSelect) {
    formatSelect.addEventListener('change', e => {
      appState.setOption('format', e.target.value);
    });
  }

  const bindKeyInput = document.getElementById('opt-bind-key');
  if (bindKeyInput) {
    bindKeyInput.addEventListener('input', e => {
      appState.setOption('bindKey', e.target.value.trim() || 'F6');
    });
  }

  // Custom / Import Command Form
  const customForm = document.getElementById('custom-item-form');
  if (customForm) {
    customForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('custom-item-input');
      if (!input || !input.value.trim()) return;
      const val = input.value.trim();

      // Check if user pasted a multi-command string like "giveitem upgrade_a; giveitem upgrade_b"
      const parsedIds = parseCommandString(val);
      if (parsedIds.length > 0) {
        parsedIds.forEach(id => appState.addCustomItem(id));
        showToast(`Imported ${parsedIds.length} item${parsedIds.length === 1 ? '' : 's'} into queue!`);
      } else {
        appState.addCustomItem(val);
        showToast(`Added "${val}" to queue!`);
      }
      input.value = '';
    });
  }

  // Section Filter Tabs (All, Curiosity Shop, Legendaries, Cosmetics, Unreleased)
  document.querySelectorAll('[data-filter-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.setFilter('section', btn.getAttribute('data-filter-section'));
    });
  });

  // Shop Filter Tabs (All, Weapon, Vitality, Spirit, Cosmetic)
  document.querySelectorAll('[data-filter-shop]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.setFilter('shop', btn.getAttribute('data-filter-shop'));
    });
  });

  // Tier Filter Pills
  document.querySelectorAll('[data-filter-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-filter-tier');
      appState.setFilter('tier', val === 'all' ? 'all' : Number(val));
    });
  });

  // Active Only Toggle
  const activeOnlyCheckbox = document.getElementById('filter-active-only');
  if (activeOnlyCheckbox) {
    activeOnlyCheckbox.addEventListener('change', e => {
      appState.setFilter('activeOnly', e.target.checked);
    });
  }

  // Search Input
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      appState.setFilter('search', e.target.value);
    });
  }

  // Initial render
  renderAll();
}

document.addEventListener('DOMContentLoaded', initApp);
