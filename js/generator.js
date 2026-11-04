/**
 * Deadlock Console Command Generator & Batch Splitter
 */

export function generateCommandData(queue, options = {}) {
  const {
    includeCheats = false,
    forceEnhanced = false,
    format = 'semicolon',
    bindKey = 'F6',
    chunkLimit = 250
  } = options;

  if (!queue || queue.length === 0) {
    return {
      fullCommand: '',
      batches: [],
      charCount: 0,
      itemCount: 0
    };
  }

  const individualCommands = queue.map(({ item }) => `giveitem ${item.id}`);

  // When forceEnhanced is enabled, it requires sv_cheats 1 and the console variable
  if (forceEnhanced) {
    individualCommands.unshift('citadel_item_purchases_force_enhanced true');
    individualCommands.unshift('sv_cheats 1');
  } else if (includeCheats) {
    individualCommands.unshift('sv_cheats 1');
  }

  let fullCommand = '';
  if (format === 'newline') {
    fullCommand = individualCommands.join('\n');
  } else if (format === 'bind') {
    const safeKey = (bindKey || 'F6').replace(/"/g, '');
    const inner = individualCommands.join('; ');
    fullCommand = `bind "${safeKey}" "${inner}"`;
  } else {
    // Standard semicolon-separated command string
    fullCommand = individualCommands.join('; ');
  }

  // Build safe console batches (always split cleanly on command boundaries)
  const batches = [];
  let currentBatch = [];
  let currentLen = 0;

  for (const cmd of individualCommands) {
    const additionLen = currentBatch.length === 0 ? cmd.length : cmd.length + 2; // "; "
    if (currentBatch.length > 0 && currentLen + additionLen > chunkLimit) {
      batches.push(currentBatch.join('; '));
      currentBatch = [cmd];
      currentLen = cmd.length;
    } else {
      currentBatch.push(cmd);
      currentLen += additionLen;
    }
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch.join('; '));
  }

  return {
    fullCommand,
    batches,
    charCount: fullCommand.length,
    itemCount: queue.length
  };
}

/**
 * Generates downloadable .cfg file content for Source 2 (exec hideout.cfg)
 */
export function generateCfgFileContent(queue, options = {}) {
  // Support both boolean includeCheats legacy call and options object
  const includeCheats = typeof options === 'boolean' ? options : (options.includeCheats || options.forceEnhanced || true);
  const forceEnhanced = typeof options === 'object' && options.forceEnhanced;

  const lines = [
    '// Deadlock Hideout & Legendary Item Stack',
    '// Place in: Steam/steamapps/common/Deadlock/game/citadel/cfg/hideout_items.cfg',
    '// Run in console: exec hideout_items',
    ''
  ];
  if (includeCheats) {
    lines.push('sv_cheats 1');
  }
  if (forceEnhanced) {
    lines.push('citadel_item_purchases_force_enhanced true');
  }
  for (const { item } of queue) {
    lines.push(`giveitem ${item.id} // ${item.name}`);
  }
  lines.push('echo "[Hideout Generator] Equipped ' + queue.length + ' items!"');
  return lines.join('\n');
}

/**
 * Parses a pasted console string like "giveitem upgrade_a; giveitem upgrade_b"
 * into an array of item IDs
 */
export function parseCommandString(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const matches = [...rawText.matchAll(/giveitem\s+([a-zA-Z0-9_]+)/gi)];
  return matches.map(m => m[1]);
}
