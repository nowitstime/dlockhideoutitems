# Deadlock Hideout & Legendary Item Command Generator

🌐 **Live Website**: [https://nowitstime.github.io/dlockhideoutitems/](https://nowitstime.github.io/dlockhideoutitems/)

A static web tool for generating **Deadlock** (`giveitem`) console commands to bypass the 12-item inventory limit, stack duplicate copies of items, and equip Street Brawl **Legendary**, **Cosmetic**, and **Unreleased** items in the Hideout or Sandbox.

Item data and icons are sourced from [https://deadlock.wiki/Items](https://deadlock.wiki/Items).

---

## Features

- **Full Item Database (254 Items)**:
  - **156 Curiosity Shop Items** across **Weapon**, **Vitality**, and **Spirit** (Tier 1 `800` through Tier 4 `6,400`).
  - **17 Street Brawl / Hideout Legendary Items** (`Runed Gauntlets`, `Infinite Rounds`, `Haunting Shot`, `Mystical Piano`, `Prism Blast`, `Electric Slippers`, `Celestial Blessing`, `Seraphim Wings`, etc.).
  - **Dedicated Cosmetic Items Section** (`Snowball`, `Hero Vote Posters`).
  - **Dedicated Unreleased & Cut Items Section** (79 hidden game-file items organized by Weapon, Spirit, and Vitality).
- **Duplicate Item Stacking**:
  - Click any shop card or use the **`+ Copy` / `+ Duplicate`** buttons in the Execution Queue, Shop Breakdown, or Catalog to stack multiple copies of the same item.
- **Dual Inventory View (Option B)**:
  1. **Exact Command Execution Order (`#1 → #N`)**: Reorder via Drag & Drop or `◀ / ▶` buttons, with visual indicators for the **4 Active Item Keybind Slots** and the **12-Item Limit Bypass (`Slots 13+`)**.
  2. **Shop Breakdown View**: Inspect your selected items grouped by **Weapon**, **Vitality**, **Spirit**, and **Cosmetic**, complete with Soul investment totals, global `#Order` badges, and within-shop `▲ / ▼` reordering.
- **One-Click Clipboard & Console Batching**:
  - Copies chained `giveitem <id>; giveitem <id2>` strings matching:
    ```text
    giveitem upgrade_runed_gauntlets; giveitem upgrade_infinite_rounds; giveitem upgrade_eldritch_shot; giveitem upgrade_mystical_piano; giveitem upgrade_prism_blast; giveitem upgrade_electric_slippers; giveitem upgrade_celestial_guidance; giveitem upgrade_icarus_wings
    ```
  - Automatically provides **Batch Copy (`Part 1`, `Part 2`, ...)** buttons and a **`.cfg` file download** (`exec hideout_items`) when your stack exceeds the Source 2 single-paste console character limit.
