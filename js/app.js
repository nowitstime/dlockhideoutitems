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
 * Renders the Selected Inventory Queue as compact consolidated item tiles
 * matching the shop look, with #Order, xN badge, drag-and-drop reordering,
 * Left-click (+1), and Right-click (-1).
 */
function renderExecutionQueue() {
  const queueContainer = document.getElementById('execution-queue-list');
  const emptyState = document.getElementById('queue-empty-state');
  if (!queueContainer) return;

  const groups = appState.getConsolidatedQueue();

  if (groups.length === 0) {
    queueContainer.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  let runningSlot = 0;
  let dividerInserted = false;
  const htmlParts = [];

  groups.forEach((group, groupIdx) => {
    const { item, count } = group;
    const startSlot = runningSlot + 1;
    const endSlot = runningSlot + count;
    runningSlot = endSlot;

    // Check if crossing slot 12
    const isOverflow = endSlot > 12;
    if (!dividerInserted && endSlot >= 13) {
      dividerInserted = true;
      htmlParts.push(`
        <div class="queue-limit-divider" title="Items past slot 12 bypass the standard Deadlock inventory limit">
          <span>⚡ 12-ITEM LIMIT BYPASS (SLOTS 13+) ⚡</span>
        </div>
      `);
    }

    const fallbackIcon = getFallbackSvgDataUri(item.name, item.shop);
    const orderLabel = count > 1 ? `#${startSlot}–#${endSlot}` : `#${startSlot}`;

    htmlParts.push(`
      <div class="queue-tile-wrapper ${isOverflow ? 'is-overflow' : ''}"
           draggable="true"
           data-group-idx="${groupIdx}"
           data-uid="${item.uid}">
        <span class="queue-tile-order-pill ${isOverflow ? 'badge-overflow' : ''}">${orderLabel}</span>
        <button type="button"
                class="shop-item-tile shop-${item.shop} is-purchased ${item.tier === 5 ? 'is-legendary' : ''}"
                data-uid="${item.uid}"
                aria-label="${item.name}">
          <div class="tile-icon-frame ${item.active ? 'active-frame' : ''}">
            <img src="${item.icon}"
                 alt="${item.name}"
                 loading="lazy"
                 onerror="this.onerror=null;this.src='${fallbackIcon}';" />
            ${count > 1 ? `<span class="tile-qty-badge">x${count}</span>` : ''}
          </div>
        </button>
      </div>
    `);
  });

  queueContainer.innerHTML = htmlParts.join('');

  // Bind interactions for queue tiles: Left click (+1), Right click (-1), Drag & Drop, Hover Tooltip
  queueContainer.querySelectorAll('.queue-tile-wrapper').forEach(wrapper => {
    const groupIdx = Number(wrapper.getAttribute('data-group-idx'));
    const uid = wrapper.getAttribute('data-uid');
    const group = groups[groupIdx];
    if (!group) return;

    // Left click: Add 1 copy
    wrapper.addEventListener('click', e => {
      e.preventDefault();
      appState.addItem(group.item);
      const newCount = (appState.getCountsByUid().get(group.item.uid) || 0);
      showItemTooltip(group.item, newCount, e);
    });

    // Right click: Delete 1 copy
    wrapper.addEventListener('contextmenu', e => {
      e.preventDefault();
      appState.removeLastByUid(group.item.uid);
      const newCount = (appState.getCountsByUid().get(group.item.uid) || 0);
      if (newCount > 0) {
        showItemTooltip(group.item, newCount, e);
      } else {
        hideItemTooltip();
      }
    });

    // Hover Tooltip
    wrapper.addEventListener('mouseenter', e => {
      const count = (appState.getCountsByUid().get(group.item.uid) || 0);
      showItemTooltip(group.item, count, e);
    });

    wrapper.addEventListener('mousemove', e => {
      updateItemTooltipPosition(e);
    });

    wrapper.addEventListener('mouseleave', () => {
      hideItemTooltip();
    });

    // HTML5 Drag-and-Drop
    wrapper.addEventListener('dragstart', e => {
      hideItemTooltip();
      draggedIndex = groupIdx;
      wrapper.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    wrapper.addEventListener('dragend', () => {
      wrapper.classList.remove('dragging');
      draggedIndex = null;
      queueContainer.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    wrapper.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      wrapper.classList.add('drag-over');
    });

    wrapper.addEventListener('dragleave', () => {
      wrapper.classList.remove('drag-over');
    });

    wrapper.addEventListener('drop', e => {
      e.preventDefault();
      wrapper.classList.remove('drag-over');
      const targetGroupIdx = Number(wrapper.getAttribute('data-group-idx'));
      if (draggedIndex !== null && draggedIndex !== targetGroupIdx) {
        const sourceGroup = groups[draggedIndex];
        if (sourceGroup) {
          appState.moveGroupByUid(sourceGroup.item.uid, targetGroupIdx);
        }
      }
      draggedIndex = null;
    });
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
  if (!container) return;

  const countsByUid = appState.getCountsByUid();
  const htmlSections = [];

  // 1. Standard Curiosity Shop + Legendaries (Grouped by Shop -> Tier Shelves)
  const mainItems = ITEMS.filter(i => i.section === 'shop' || i.section === 'legendary');
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
  const cosmeticItems = ITEMS.filter(i => i.section === 'cosmetic');
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
  const unreleasedItems = ITEMS.filter(i => i.section === 'unreleased');
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
  const cheatsToggle = document.getElementById('opt-include-cheats');
  if (cheatsToggle) {
    cheatsToggle.checked = appState.options.includeCheats;
  }

  const enhancedToggle = document.getElementById('opt-force-enhanced');
  if (enhancedToggle) {
    enhancedToggle.checked = appState.options.forceEnhanced;
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

  // Initial render
  renderAll();
}

document.addEventListener('DOMContentLoaded', initApp);
