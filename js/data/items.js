/**
 * Deadlock Item Database
 * Sourced from https://deadlock.wiki/Items
 * Includes:
 * - 156 Curiosity Shop Items (Tier 1: 800, Tier 2: 1600, Tier 3: 3200, Tier 4: 6400)
 * - 17 Legendary Items (Tier 5 / Street Brawl & Hideout)
 * - 2 Seasonal Cosmetic Items
 * - 79 Unreleased & Cut Items (Weapon, Vitality, Spirit)
 */

import { ITEM_DESCRIPTIONS } from './descriptions.js';

const CDN_BASE = 'https://cdn.deadlock.wiki';

/**
 * Set of item names that are Active items (occupy one of the 4 active keybind slots in-game)
 */
const ACTIVE_ITEM_NAMES = new Set([
  'Alchemical Fire',
  'Arctic Blast',
  'Blood Tribute',
  'Capacitor',
  'Celestial Blessing',
  'Cold Front',
  'Colossus',
  'Cultist Sacrifice',
  'Cursed Relic',
  'Decay',
  'Disarming Hex',
  'Dispel Magic',
  'Divine Barrier',
  'Echo Shard',
  'Ethereal Shift',
  'Fleetfoot',
  'Focus Lens',
  'Fury Trance',
  'Golden Goose Egg',
  'Grit',
  'Guardian Ward',
  'Healing Nova',
  'Healing Rite',
  'Heroic Aura',
  'Infuser',
  'Knockdown',
  'Magic Carpet',
  'Majestic Leap',
  'Metal Skin',
  'Mystical Piano',
  'Nullification Burst',
  'Phantom Strike',
  'Prism Blast',
  'Refresher',
  'Rescue Beam',
  'Restorative Locket',
  'Return Fire',
  'Rusted Barrel',
  'Scourge',
  'Shadow Weave',
  'Shrink Ray',
  'Silence Wave',
  'Slowing Hex',
  'Spirit Sap',
  'Split Shot',
  'Unstable Concoction',
  'Unstoppable',
  'Vampiric Burst',
  'Vortex Web',
  'Warp Stone',
  'Snowball',
  'Hero Vote Posters'
]);

const TIER_COSTS = {
  1: 800,
  2: 1600,
  3: 3200,
  4: 6400,
  5: 9999, // Legendary
  0: 0     // Cosmetic / Unreleased
};

function makeItem(name, id, shop, tier, section = 'shop', customIconFile = null) {
  const fileName = customIconFile || `${name.replace(/ /g, '_').replace(/'/g, '%27')}.png`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const description = ITEM_DESCRIPTIONS[id] || `${name} (${shop} item)`;
  return {
    uid: `${section}_${id}_${slug}`,
    name,
    id,
    shop,         // 'weapon' | 'vitality' | 'spirit' | 'cosmetic'
    tier,         // 1 | 2 | 3 | 4 | 5 (Legendary) | 0 (Special/Unreleased)
    cost: TIER_COSTS[tier] ?? 0,
    section,      // 'shop' | 'legendary' | 'cosmetic' | 'unreleased'
    active: ACTIVE_ITEM_NAMES.has(name),
    description,
    icon: `${CDN_BASE}/${fileName}`,
    wikiUrl: `https://deadlock.wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`
  };
}

export const SHOP_METADATA = {
  weapon: {
    label: 'Weapon',
    color: '#e58e26',
    icon: `${CDN_BASE}/Weapon_Icon.png`,
    description: 'Improves base weapons, fire rate, bullet damage, and on-hit effects.'
  },
  vitality: {
    label: 'Vitality',
    color: '#6ab04c',
    icon: `${CDN_BASE}/Vitality_Icon.png`,
    description: 'Improves survivability, health, stamina, shields, and movement.'
  },
  spirit: {
    label: 'Spirit',
    color: '#a55eea',
    icon: `${CDN_BASE}/Spirit_Icon.png`,
    description: 'Improves abilities, spirit power, cooldowns, and durations.'
  },
  cosmetic: {
    label: 'Cosmetic',
    color: '#38bdf8',
    icon: `${CDN_BASE}/Snowball.png`,
    description: 'Seasonal active items that use the special E cosmetic slot.'
  }
};

export const ITEMS = [
  // =========================================================================
  // WEAPON ITEMS — TIER 1 (800 Souls)
  // =========================================================================
  makeItem('Close Quarters', 'upgrade_close_range', 'weapon', 1),
  makeItem('Extended Magazine', 'upgrade_clip_size', 'weapon', 1),
  makeItem('Headshot Booster', 'upgrade_headshot_booster', 'weapon', 1),
  makeItem('High-Velocity Rounds', 'upgrade_high_velocity_mag', 'weapon', 1),
  makeItem('Monster Rounds', 'upgrade_non_player_bonus', 'weapon', 1),
  makeItem('Rapid Rounds', 'upgrade_rapid_rounds', 'weapon', 1),
  makeItem('Restorative Shot', 'upgrade_medic_bullets', 'weapon', 1),

  // =========================================================================
  // WEAPON ITEMS — TIER 2 (1,600 Souls)
  // =========================================================================
  makeItem('Active Reload', 'upgrade_active_reload', 'weapon', 2),
  makeItem('Fleetfoot', 'upgrade_fleetfoot_boots', 'weapon', 2),
  makeItem('Intensifying Magazine', 'upgrade_intensifying_clip', 'weapon', 2),
  makeItem('Kinetic Dash', 'upgrade_kinetic_sash', 'weapon', 2),
  makeItem('Long Range', 'upgrade_long_range', 'weapon', 2),
  makeItem('Melee Charge', 'upgrade_melee_charge', 'weapon', 2),
  makeItem('Mystic Shot', 'upgrade_crackshot', 'weapon', 2),
  makeItem('Opening Rounds', 'upgrade_pristine_emblem', 'weapon', 2),
  makeItem('Recharging Rush', 'upgrade_rechargingbullets', 'weapon', 2),
  makeItem('Slowing Bullets', 'upgrade_slowing_bullets', 'weapon', 2),
  makeItem('Spirit Shredder', 'upgrade_tech_defense_shredders', 'weapon', 2),
  makeItem('Split Shot', 'upgrade_split_shot', 'weapon', 2),
  makeItem('Stalker', 'upgrade_weapon_backstabber', 'weapon', 2),
  makeItem('Swift Striker', 'upgrade_blitz_bullets', 'weapon', 2),
  makeItem('Titanic Magazine', 'upgrade_titan_round', 'weapon', 2),
  makeItem('Weakening Headshot', 'upgrade_headshot_booster2', 'weapon', 2),

  // =========================================================================
  // WEAPON ITEMS — TIER 3 (3,200 Souls)
  // =========================================================================
  makeItem('Alchemical Fire', 'upgrade_thermal_detonator', 'weapon', 3),
  makeItem('Ballistic Enchantment', 'upgrade_bulletshredimbue', 'weapon', 3),
  makeItem('Berserker', 'upgrade_berserker', 'weapon', 3),
  makeItem('Blood Tribute', 'upgrade_blood_tribute', 'weapon', 3),
  makeItem('Burst Fire', 'upgrade_burst_fire', 'weapon', 3),
  makeItem('Cultist Sacrifice', 'upgrade_non_player_bonus_sacrifice', 'weapon', 3),
  makeItem('Escalating Resilience', 'upgrade_reinforcing_casings', 'weapon', 3),
  makeItem('Express Shot', 'upgrade_express_shot', 'weapon', 3),
  makeItem('Headhunter', 'upgrade_headhunter', 'weapon', 3),
  makeItem('Heroic Aura', 'upgrade_dps_aura', 'weapon', 3),
  makeItem('Hollow Point', 'upgrade_hollow_point_rounds', 'weapon', 3),
  makeItem("Hunter's Aura", 'upgrade_bullet_armor_reduction_aura', 'weapon', 3),
  makeItem('Point Blank', 'upgrade_close_quarter_combat', 'weapon', 3),
  makeItem('Shadow Weave', 'upgrade_cloaking_device_active', 'weapon', 3),
  makeItem('Sharpshooter', 'upgrade_sharpshooter', 'weapon', 3),
  makeItem('Spirit Rend', 'upgrade_spellslinger_headshots', 'weapon', 3),
  makeItem('Tesla Bullets', 'upgrade_chain_lightning', 'weapon', 3),
  makeItem('Toxic Bullets', 'upgrade_toxic_bullets', 'weapon', 3),
  makeItem('Weighted Shots', 'upgrade_weighted_shots', 'weapon', 3),

  // =========================================================================
  // WEAPON ITEMS — TIER 4 (6,400 Souls)
  // =========================================================================
  makeItem('Armor Piercer', 'upgrade_aprounds', 'weapon', 4),
  makeItem('Capacitor', 'upgrade_capacitor', 'weapon', 4),
  makeItem('Crippling Headshot', 'upgrade_banshee_slugs', 'weapon', 4),
  makeItem('Crushing Fists', 'upgrade_crushing_fists', 'weapon', 4),
  makeItem('Frenzy', 'upgrade_fervor', 'weapon', 4),
  makeItem('Glass Cannon', 'upgrade_glass_cannon', 'weapon', 4),
  makeItem('Lucky Shot', 'upgrade_critshot', 'weapon', 4),
  makeItem('Ricochet', 'upgrade_ricochet', 'weapon', 4),
  makeItem('Silencer', 'upgrade_proc_silence', 'weapon', 4),
  makeItem('Spellslinger', 'upgrade_enchanted_holsters', 'weapon', 4),
  makeItem('Spiritual Overflow', 'upgrade_tech_overflow', 'weapon', 4),

  // =========================================================================
  // WEAPON ITEMS — TIER 5 / LEGENDARY (Street Brawl / Hideout)
  // =========================================================================
  makeItem('Haunting Shot', 'upgrade_eldritch_shot', 'weapon', 5, 'legendary'),
  makeItem('Infinite Rounds', 'upgrade_infinite_rounds', 'weapon', 5, 'legendary'),
  makeItem('Runed Gauntlets', 'upgrade_runed_gauntlets', 'weapon', 5, 'legendary'),

  // =========================================================================
  // VITALITY ITEMS — TIER 1 (800 Souls)
  // =========================================================================
  makeItem('Extra Health', 'upgrade_health', 'vitality', 1),
  makeItem('Extra Regen', 'upgrade_endurance', 'vitality', 1),
  makeItem('Extra Stamina', 'upgrade_improved_stamina', 'vitality', 1),
  makeItem('Grit', 'upgrade_grit', 'vitality', 1),
  makeItem('Healing Rite', 'upgrade_health_stimpak', 'vitality', 1),
  makeItem('Melee Lifesteal', 'upgrade_lifestrike_gauntlets', 'vitality', 1),
  makeItem('Rebuttal', 'upgrade_melee_rebuttal', 'vitality', 1),
  makeItem('Sprint Boots', 'upgrade_sprint_booster', 'vitality', 1),

  // =========================================================================
  // VITALITY ITEMS — TIER 2 (1,600 Souls)
  // =========================================================================
  makeItem('Battle Vest', 'upgrade_regenerating_bullet_shield', 'vitality', 2),
  makeItem('Bullet Lifesteal', 'upgrade_vampire', 'vitality', 2),
  makeItem('Debuff Reducer', 'upgrade_debuff_reducer', 'vitality', 2),
  makeItem("Enchanter's Emblem", 'upgrade_magic_shield', 'vitality', 2),
  makeItem('Enduring Speed', 'upgrade_cardio_calibrator', 'vitality', 2),
  makeItem('Guardian Ward', 'upgrade_guardian_ward', 'vitality', 2),
  makeItem('Healbane', 'upgrade_healbane', 'vitality', 2),
  makeItem('Healing Booster', 'upgrade_healing_booster', 'vitality', 2),
  makeItem('Reactive Barrier', 'upgrade_vex_barrier', 'vitality', 2),
  makeItem('Restorative Locket', 'upgrade_restorative_locket', 'vitality', 2),
  makeItem('Return Fire', 'upgrade_return_fire', 'vitality', 2),
  makeItem('Spirit Lifesteal', 'upgrade_health_stealing_magic', 'vitality', 2),
  makeItem('Spirit Shielding', 'upgrade_spirit_bubble', 'vitality', 2),
  makeItem('Trophy Collector', 'upgrade_trophy_collector', 'vitality', 2),
  makeItem('Weapon Shielding', 'upgrade_weapon_shielding', 'vitality', 2),

  // =========================================================================
  // VITALITY ITEMS — TIER 3 (3,200 Souls)
  // =========================================================================
  makeItem('Bullet Resilience', 'upgrade_improved_bullet_armor', 'vitality', 3),
  makeItem('Counterspell', 'upgrade_counterspell', 'vitality', 3),
  makeItem('Dispel Magic', 'upgrade_reduce_debuff_duration', 'vitality', 3),
  makeItem('Fortitude', 'upgrade_chonky', 'vitality', 3),
  makeItem('Fury Trance', 'upgrade_fury_trance', 'vitality', 3),
  makeItem('Healing Nova', 'upgrade_health_nova', 'vitality', 3),
  makeItem('Lifestrike', 'upgrade_boxing_glove', 'vitality', 3),
  makeItem('Majestic Leap', 'upgrade_rocket_booster', 'vitality', 3),
  makeItem('Metal Skin', 'upgrade_metal_skin', 'vitality', 3),
  makeItem('Rescue Beam', 'upgrade_rescue_beam', 'vitality', 3),
  makeItem('Spirit Resilience', 'upgrade_tech_purge', 'vitality', 3),
  makeItem('Stamina Mastery', 'upgrade_superior_stamina', 'vitality', 3),
  makeItem('Veil Walker', 'upgrade_veil_walker', 'vitality', 3),
  makeItem('Warp Stone', 'upgrade_warp_stone', 'vitality', 3),

  // =========================================================================
  // VITALITY ITEMS — TIER 4 (6,400 Souls)
  // =========================================================================
  makeItem('Cheat Death', 'upgrade_cheat_death', 'vitality', 4),
  makeItem('Colossus', 'upgrade_colossus', 'vitality', 4),
  makeItem('Divine Barrier', 'upgrade_divine_barrier', 'vitality', 4),
  makeItem("Diviner's Kevlar", 'upgrade_diviners_kevlar', 'vitality', 4),
  makeItem('Healing Tempo', 'upgrade_healbuff', 'vitality', 4),
  makeItem('Indomitable', 'upgrade_auto_cleanse', 'vitality', 4),
  makeItem('Infuser', 'upgrade_infuser', 'vitality', 4),
  makeItem('Inhibitor', 'upgrade_inhibitor', 'vitality', 4),
  makeItem('Juggernaut', 'upgrade_juggernaut', 'vitality', 4),
  makeItem('Leech', 'upgrade_damage_recycler', 'vitality', 4),
  makeItem('Phantom Strike', 'upgrade_phantom_strike', 'vitality', 4),
  makeItem('Plated Armor', 'upgrade_deflecting_armor', 'vitality', 4),
  makeItem('Siphon Bullets', 'upgrade_siphon_bullets', 'vitality', 4),
  makeItem('Spellbreaker', 'upgrade_spellbreaker', 'vitality', 4),
  makeItem('Unstoppable', 'upgrade_unstoppable', 'vitality', 4),
  makeItem('Vampiric Burst', 'upgrade_surging_power', 'vitality', 4),
  makeItem('Witchmail', 'upgrade_absorbing_armor', 'vitality', 4),

  // =========================================================================
  // VITALITY ITEMS — TIER 5 / LEGENDARY (Street Brawl / Hideout)
  // =========================================================================
  makeItem('Celestial Blessing', 'upgrade_celestial_guidance', 'vitality', 5, 'legendary'),
  makeItem('Cloak of Opportunity', 'upgrade_cloak_of_opportunity', 'vitality', 5, 'legendary'),
  makeItem('Electric Slippers', 'upgrade_electric_slippers', 'vitality', 5, 'legendary'),
  makeItem('Eternal Gift', 'upgrade_eternal_gift', 'vitality', 5, 'legendary'),
  makeItem('Nullification Burst', 'upgrade_nullification_aura', 'vitality', 5, 'legendary'),
  makeItem('Seraphim Wings', 'upgrade_icarus_wings', 'vitality', 5, 'legendary'),
  makeItem('Shadow Strike', 'upgrade_shadow_strike', 'vitality', 5, 'legendary'),

  // =========================================================================
  // SPIRIT ITEMS — TIER 1 (800 Souls)
  // =========================================================================
  makeItem('Extra Charge', 'upgrade_extra_charge', 'spirit', 1),
  makeItem('Extra Spirit', 'upgrade_improved_spirit', 'spirit', 1),
  makeItem('Golden Goose Egg', 'upgrade_goose_egg', 'spirit', 1),
  makeItem('Mystic Burst', 'upgrade_magic_burst', 'spirit', 1),
  makeItem('Mystic Expansion', 'upgrade_magic_reach', 'spirit', 1),
  makeItem('Mystic Regeneration', 'upgrade_mystic_regeneration', 'spirit', 1),
  makeItem('Rusted Barrel', 'upgrade_withering_whip', 'spirit', 1),
  makeItem('Spirit Strike', 'upgrade_acolytes_glove', 'spirit', 1),

  // =========================================================================
  // SPIRIT ITEMS — TIER 2 (1,600 Souls)
  // =========================================================================
  makeItem('Arcane Surge', 'upgrade_arcane_surge', 'spirit', 2),
  makeItem('Bullet Resist Shredder', 'upgrade_bullet_resist_shredder', 'spirit', 2),
  makeItem('Cold Front', 'upgrade_cold_front', 'spirit', 2),
  makeItem('Compress Cooldown', 'upgrade_magic_tempo', 'spirit', 2),
  makeItem('Duration Extender', 'upgrade_arcane_extension', 'spirit', 2),
  makeItem('Improved Spirit', 'upgrade_soaring_spirit', 'spirit', 2),
  makeItem('Mystic Slow', 'upgrade_magic_slow', 'spirit', 2),
  makeItem('Mystic Vulnerability', 'upgrade_magic_vulnerability', 'spirit', 2),
  makeItem('Quicksilver Reload', 'upgrade_quick_silver', 'spirit', 2),
  makeItem('Slowing Hex', 'upgrade_containment', 'spirit', 2),
  makeItem('Spirit Sap', 'upgrade_spirit_sap', 'spirit', 2),
  makeItem('Suppressor', 'upgrade_suppressor', 'spirit', 2),

  // =========================================================================
  // SPIRIT ITEMS — TIER 3 (3,200 Souls)
  // =========================================================================
  makeItem('Decay', 'upgrade_rupture', 'spirit', 3),
  makeItem('Disarming Hex', 'upgrade_greater_withering_whip', 'spirit', 3),
  makeItem('Greater Expansion', 'upgrade_tech_range', 'spirit', 3),
  makeItem('Knockdown', 'upgrade_target_stun', 'spirit', 3),
  makeItem('Radiant Regeneration', 'upgrade_resonant_healing', 'spirit', 3),
  makeItem('Rapid Recharge', 'upgrade_rapid_recharge', 'spirit', 3),
  makeItem('Silence Wave', 'upgrade_targeted_silence', 'spirit', 3),
  makeItem('Spirit Snatch', 'upgrade_spirit_snatch', 'spirit', 3),
  makeItem('Superior Cooldown', 'upgrade_cooldown_reduction', 'spirit', 3),
  makeItem('Superior Duration', 'upgrade_imbued_duration_extender', 'spirit', 3),
  makeItem('Surge of Power', 'upgrade_magic_storm', 'spirit', 3),
  makeItem('Tankbuster', 'upgrade_magic_shock', 'spirit', 3),
  makeItem('Torment Pulse', 'upgrade_tech_damage_pulse', 'spirit', 3),

  // =========================================================================
  // SPIRIT ITEMS — TIER 4 (6,400 Souls)
  // =========================================================================
  makeItem('Arctic Blast', 'upgrade_arctic_blast', 'spirit', 4),
  makeItem('Boundless Spirit', 'upgrade_boundless_spirit', 'spirit', 4),
  makeItem('Cursed Relic', 'upgrade_glitch', 'spirit', 4),
  makeItem('Echo Shard', 'upgrade_ability_power_shard', 'spirit', 4),
  makeItem('Escalating Exposure', 'upgrade_escalating_exposure', 'spirit', 4),
  makeItem('Ethereal Shift', 'upgrade_self_bubble', 'spirit', 4),
  makeItem('Focus Lens', 'upgrade_focus_lens', 'spirit', 4),
  makeItem('Lightning Scroll', 'upgrade_ultimate_burst', 'spirit', 4),
  makeItem('Magic Carpet', 'upgrade_magic_carpet', 'spirit', 4),
  makeItem('Mercurial Magnum', 'upgrade_ethereal_bullets', 'spirit', 4),
  makeItem('Mystic Reverb', 'upgrade_mystic_reverb', 'spirit', 4),
  makeItem('Refresher', 'upgrade_ability_refresher', 'spirit', 4),
  makeItem('Scourge', 'upgrade_discord', 'spirit', 4),
  makeItem('Spirit Burn', 'upgrade_spirit_burn', 'spirit', 4),
  makeItem('Transcendent Cooldown', 'upgrade_transcendent_cooldown', 'spirit', 4),
  makeItem('Vortex Web', 'upgrade_aoe_root', 'spirit', 4),

  // =========================================================================
  // SPIRIT ITEMS — TIER 5 / LEGENDARY (Street Brawl / Hideout)
  // =========================================================================
  makeItem('Frostbite Charm', 'upgrade_shivas_bracelet', 'spirit', 5, 'legendary'),
  makeItem('Mystic Conduit', 'upgrade_patrons_blessing', 'spirit', 5, 'legendary'),
  makeItem('Mystical Piano', 'upgrade_mystical_piano', 'spirit', 5, 'legendary'),
  makeItem('Omnicharge Signet', 'upgrade_omnicharge_pendant', 'spirit', 5, 'legendary'),
  makeItem('Prism Blast', 'upgrade_prism_blast', 'spirit', 5, 'legendary'),
  makeItem('Shrink Ray', 'upgrade_shrink_ray', 'spirit', 5, 'legendary'),
  makeItem('Unstable Concoction', 'upgrade_unstable_concoction', 'spirit', 5, 'legendary'),

  // =========================================================================
  // COSMETIC ITEMS (Seasonal / Event Slot "E")
  // =========================================================================
  makeItem('Snowball', 'cosmetic_item_snowball', 'cosmetic', 0, 'cosmetic', 'Snowball.png'),
  makeItem('Hero Vote Posters', 'cosmetic_item_voting_poster', 'cosmetic', 0, 'cosmetic', 'Star.png'),

  // =========================================================================
  // UNRELEASED & CUT ITEMS — WEAPON
  // =========================================================================
  makeItem('Basic Magazine (Fixed)', 'upgrade_clip_size_fixed', 'weapon', 0, 'unreleased', 'Extended_Magazine.png'),
  makeItem('Fixed Clip Size T3', 'upgrade_clip_size_fixed_t3', 'weapon', 0, 'unreleased', 'Titanic_Magazine.png'),
  makeItem('Clip Size II', 'upgrade_clip_size_2', 'weapon', 0, 'unreleased', 'Extended_Magazine.png'),
  makeItem('Clip Size III', 'upgrade_clip_size_3', 'weapon', 0, 'unreleased', 'Titanic_Magazine.png'),
  makeItem('Stabilizer', 'upgrade_stabilizer', 'weapon', 0, 'unreleased', 'Stabilizer.png'),
  makeItem('Galvanic Storm', 'upgrade_galvanic_storm', 'weapon', 0, 'unreleased', 'Galvanic_Storm.png'),
  makeItem('Fire Rate I', 'upgrade_attack_speed_1', 'weapon', 0, 'unreleased', 'Fire_Rate_(item).png'),
  makeItem('Basic Fire Rate', 'upgrade_small_attack_speed', 'weapon', 0, 'unreleased', 'Basic_Fire_Rate.png'),
  makeItem('EMP Bullets', 'upgrade_proc_silence', 'weapon', 0, 'unreleased', 'EMP_Bullets.png'),
  makeItem('Magitech Rounds', 'upgrade_proc_tech_damage', 'weapon', 0, 'unreleased', 'Magitech_Rounds.png'),
  makeItem('Detention Rounds', 'upgrade_weapon_detention_ammo', 'weapon', 0, 'unreleased', 'Detention_Rounds.png'),
  makeItem('Leveler', 'upgrade_leveler', 'weapon', 0, 'unreleased', 'Weapon_Icon.png'),
  makeItem('Adrenaline Rush', 'upgrade_nearby_enemy_boost', 'weapon', 0, 'unreleased', 'Adrenaline_Rush.png'),
  makeItem('Fire Rate Aura', 'upgrade_fire_rate_aura', 'weapon', 0, 'unreleased', 'Fire_Rate_Aura.png'),
  makeItem('Improved Fire Rate', 'upgrade_attack_speed_2', 'weapon', 0, 'unreleased', 'Improved_Fire_Rate.png'),
  makeItem('Drum Magazine', 'upgrade_drum_magazine', 'weapon', 0, 'unreleased', 'Drum_Magazine.png'),
  makeItem('Height Advantage', 'upgrade_height_advantage', 'weapon', 0, 'unreleased', 'Height_Advantage.png'),
  makeItem('Disarming Bullets', 'upgrade_proc_disarm', 'weapon', 0, 'unreleased', 'Disarming_Bullets.png'),
  makeItem('Overdrive Clip', 'upgrade_weapon_overdrive_clip', 'weapon', 0, 'unreleased', 'Overdrive_Clip.png'),
  makeItem('Burst Fire Actuator', 'upgrade_burst_fire_actuator', 'weapon', 0, 'unreleased', 'Burst_Fire_Actuator.png'),
  makeItem('Belt-Fed Magazine', 'upgrade_belt_fed_magazine', 'weapon', 0, 'unreleased', 'Belt-Fed_Magazine.png'),
  makeItem('Stabilizing Tripod', 'upgrade_stabilizing_tripod', 'weapon', 0, 'unreleased', 'Stabilizing_Tripod.png'),
  makeItem('Arcane Eater', 'upgrade_arcane_eater', 'weapon', 0, 'unreleased', 'Arcane_Eater.png'),
  makeItem('Predator Precision', 'upgrade_predator_precision', 'weapon', 0, 'unreleased', 'Predator_Precision.png'),
  makeItem('Weapon Eater', 'upgrade_weapon_eater', 'weapon', 0, 'unreleased', 'Weapon_Eater.png'),
  makeItem('Instant Reload (Huge Clip)', 'upgrade_weapon_instant_reload', 'weapon', 0, 'unreleased', 'Reloader_%2B_Huge_Clip.png'),
  makeItem('Fast Reload', 'upgrade_reload_speed', 'weapon', 0, 'unreleased', 'Fast_Reload.png'),
  makeItem('Ammo Scavenger (Cut)', 'upgrade_ammo_scavenger', 'weapon', 0, 'unreleased', 'Ammo_Scavenger.png'),

  // =========================================================================
  // UNRELEASED & CUT ITEMS — SPIRIT
  // =========================================================================
  makeItem('Long Range Slowing Tech', 'upgrade_long_range_slowing_tech', 'spirit', 0, 'unreleased', 'Slowing_Spirit.png'),
  makeItem('Full Spectrum', 'upgrade_full_spectrum', 'spirit', 0, 'unreleased', 'Full_Spectrum.png'),
  makeItem('Tech Range II', 'upgrade_tech_range_2', 'spirit', 0, 'unreleased', 'Greater_Expansion.png'),
  makeItem('Hyper Charge', 'upgrade_recharge_duration_reduction', 'spirit', 0, 'unreleased', 'Hyper_Charge.png'),
  makeItem('Bonus Ability Charge III', 'upgrade_bonus_ability_charge_3', 'spirit', 0, 'unreleased', 'Extra_Charge.png'),
  makeItem('Charge Mastery', 'upgrade_charge_mastery', 'spirit', 0, 'unreleased', 'Charge_Mastery.png'),
  makeItem('Arcane Medallion', 'upgrade_arcane_medallion', 'spirit', 0, 'unreleased', 'Arcane_Medallion.png'),
  makeItem('Soul Disruptor', 'upgrade_mod_disruptor', 'spirit', 0, 'unreleased', 'Soul_Disruptor.png'),
  makeItem('Overdrive (Ability Speed)', 'upgrade_ability_speed', 'spirit', 0, 'unreleased', 'Overdrive.png'),
  makeItem('Rescue (Succor)', 'upgrade_succor', 'spirit', 0, 'unreleased', 'Rescue.png'),
  makeItem('Quarantine', 'upgrade_quarantine', 'spirit', 0, 'unreleased', 'Quarantine.png'),
  makeItem('Slowing Spirit', 'upgrade_slowing_tech', 'spirit', 0, 'unreleased', 'Slowing_Spirit.png'),
  makeItem('Omni Spirit (Tech III)', 'upgrade_tech_3', 'spirit', 0, 'unreleased', 'Omni_Spirit.png'),
  makeItem('Spirit Barrier Pulse', 'upgrade_aoe_tech_shield', 'spirit', 0, 'unreleased', 'Spirit_Barrier_Pulse.png'),
  makeItem('Quantum Chimaera (Tech Cleave)', 'upgrade_tech_cleave', 'spirit', 0, 'unreleased', 'Quantum_Chimaera.png'),
  makeItem('Tech Armor Reduction Aura', 'upgrade_tech_armor_reduction_aura', 'spirit', 0, 'unreleased', 'Spirit_Icon.png'),
  makeItem('Imbued Ability', 'upgrade_imbued_ability', 'spirit', 0, 'unreleased', 'Imbued_Ability.png'),
  makeItem('Charmed Wraps', 'upgrade_charmed_wraps', 'spirit', 0, 'unreleased', 'Charmed_Wraps.png'),
  makeItem('Clarity', 'upgrade_magic_clarity', 'spirit', 0, 'unreleased', 'Clarity.png'),
  makeItem('Smoke Bomb', 'upgrade_aoe_smoke_bomb', 'spirit', 0, 'unreleased', 'Smoke.png'),
  makeItem('EMP Grenade', 'upgrade_aoe_silence', 'spirit', 0, 'unreleased', 'EMP_Grenade.png'),
  makeItem('Weapon Jammer (Disarm)', 'upgrade_disarm', 'spirit', 0, 'unreleased', 'Weapon_Jammer.png'),
  makeItem('Soul Explosion (Corpse Explosion)', 'upgrade_corpse_explosion', 'spirit', 0, 'unreleased', 'Soul_Explosion.png'),
  makeItem('Enduring Spirit (Cut)', 'upgrade_enduring_spirit', 'spirit', 0, 'unreleased', 'Enduring_Spirit.png'),

  // =========================================================================
  // UNRELEASED & CUT ITEMS — VITALITY
  // =========================================================================
  makeItem('Stasis Bomb', 'upgrade_stasis_bomb', 'vitality', 0, 'unreleased', 'Stasis_Bomb.png'),
  makeItem('Camouflage Suit', 'upgrade_camouflage', 'vitality', 0, 'unreleased', 'Camouflage_Suit.png'),
  makeItem('Toughness III', 'upgrade_toughness_3', 'vitality', 0, 'unreleased', 'Toughness.png'),
  makeItem('Health Regen I', 'upgrade_health_regen_1', 'vitality', 0, 'unreleased', 'Health_Regen.png'),
  makeItem('Bullet Deflector', 'upgrade_health_bullet_deflector', 'vitality', 0, 'unreleased', 'Bullet_Deflector.png'),
  makeItem('Health Regenerative Armor', 'upgrade_health_regenerative_armor', 'vitality', 0, 'unreleased', 'Regenerative_Armor.png'),
  makeItem('Double-Jump', 'upgrade_double_jump', 'vitality', 0, 'unreleased', 'Double-Jump.png'),
  makeItem('Drain Will', 'upgrade_weapon_power_and_health_drain', 'vitality', 0, 'unreleased', 'Drain_Will.png'),
  makeItem('Healing Aura', 'upgrade_health_regen_aura', 'vitality', 0, 'unreleased', 'Healing_Aura.png'),
  makeItem('Melee Knockdown', 'upgrade_proc_melee_stun', 'vitality', 0, 'unreleased', 'Melee_Knockdown.png'),
  makeItem('High Impact Armor', 'upgrade_high_impact_armor', 'vitality', 0, 'unreleased', 'High_Impact_Armor.png'),
  makeItem('Spell Absorb', 'upgrade_spell_absorb', 'vitality', 0, 'unreleased', 'Vitality_Icon.png'),
  makeItem('Spirit Armor II', 'upgrade_tech_armor_2', 'vitality', 0, 'unreleased', 'Spirit_Armor_(item).png'),
  makeItem('Deflector Shield', 'upgrade_deflector_shield', 'vitality', 0, 'unreleased', 'Bullet_Deflector.png'),
  makeItem('Shield Rush', 'upgrade_active_bullet_shield', 'vitality', 0, 'unreleased', 'Shield_Rush.png'),
  makeItem('Bullet Damage Reduction Aura', 'upgrade_bullet_damage_reduction_aura', 'vitality', 0, 'unreleased', 'Vitality_Icon.png'),
  makeItem('Regenerative Armor', 'upgrade_regenerative_armor', 'vitality', 0, 'unreleased', 'Regenerative_Armor.png'),
  makeItem('Aerial Assault', 'upgrade_aerial_assault', 'vitality', 0, 'unreleased', 'Aerial_Assault.png'),
  makeItem('Combo Breaker', 'upgrade_combo_breaker', 'vitality', 0, 'unreleased', 'Combo_Breaker.png'),
  makeItem('Ablative Coat', 'upgrade_ablative_coat', 'vitality', 0, 'unreleased', 'Ablative_Coat.png'),
  makeItem('Cloaking Device', 'upgrade_cloaking_device', 'vitality', 0, 'unreleased', 'Cloaking_Device.png'),
  makeItem('Zip Line Mastery', 'upgrade_zipine_mastery', 'vitality', 0, 'unreleased', 'Zip_Line_Mastery.png'),
  makeItem('Debuff Absorb', 'upgrade_debuff_absorb', 'vitality', 0, 'unreleased', 'Vitality_Icon.png'),
  makeItem('Tech Defender', 'upgrade_tech_defender', 'vitality', 0, 'unreleased', 'Tech_Defender.png'),
  makeItem('Bullet Armor (Cut)', 'upgrade_bullet_armor', 'vitality', 0, 'unreleased', 'Bullet_Armor_(item).png'),
  makeItem('Spirit Armor (Cut)', 'upgrade_tech_armor', 'vitality', 0, 'unreleased', 'Spirit_Armor_(item).png'),
  makeItem('Soul Rebirth (Cut)', 'upgrade_rebirth', 'vitality', 0, 'unreleased', 'Soul_Rebirth.png')
];

/**
 * Curated Presets for instant Hideout testing
 */
export const PRESETS = [
  {
    id: 'featured-8-legendaries',
    name: '8 Core Legendaries (Example)',
    description: 'Your 8-item legendary command stack in exact order',
    itemIds: [
      'upgrade_runed_gauntlets',
      'upgrade_infinite_rounds',
      'upgrade_eldritch_shot',
      'upgrade_mystical_piano',
      'upgrade_prism_blast',
      'upgrade_electric_slippers',
      'upgrade_celestial_guidance',
      'upgrade_icarus_wings'
    ]
  },
  {
    id: 'all-17-legendaries',
    name: 'All 17 Legendaries (Bypass 12-Limit)',
    description: 'Equips every single Street Brawl / Hideout Legendary across Weapon, Spirit & Vitality',
    itemIds: [
      'upgrade_runed_gauntlets',
      'upgrade_infinite_rounds',
      'upgrade_eldritch_shot',
      'upgrade_mystical_piano',
      'upgrade_prism_blast',
      'upgrade_celestial_guidance',
      'upgrade_shivas_bracelet',
      'upgrade_patrons_blessing',
      'upgrade_omnicharge_pendant',
      'upgrade_electric_slippers',
      'upgrade_icarus_wings',
      'upgrade_cloak_of_opportunity',
      'upgrade_eternal_gift',
      'upgrade_shadow_strike',
      'upgrade_nullification_aura',
      'upgrade_shrink_ray',
      'upgrade_unstable_concoction'
    ]
  },
  {
    id: 'stacked-glass-cannon',
    name: '5× Glass Cannon + Infinite Rounds',
    description: 'Demonstrates duplicate item stacking for extreme Hideout DPS testing',
    itemIds: [
      'upgrade_infinite_rounds',
      'upgrade_glass_cannon',
      'upgrade_glass_cannon',
      'upgrade_glass_cannon',
      'upgrade_glass_cannon',
      'upgrade_glass_cannon',
      'upgrade_ricochet',
      'upgrade_critshot',
      'upgrade_fervor',
      'upgrade_aprounds'
    ]
  },
  {
    id: 'arcane-piano-god',
    name: 'Arcane Piano & Spirit Overflow',
    description: 'All top Spirit Tier 4 & Legendary items with Refresher & Echo Shard',
    itemIds: [
      'upgrade_mystical_piano',
      'upgrade_prism_blast',
      'upgrade_ability_refresher',
      'upgrade_ability_power_shard',
      'upgrade_boundless_spirit',
      'upgrade_transcendent_cooldown',
      'upgrade_omnicharge_pendant',
      'upgrade_patrons_blessing',
      'upgrade_shivas_bracelet',
      'upgrade_mystic_reverb',
      'upgrade_escalating_exposure',
      'upgrade_spirit_burn',
      'upgrade_ethereal_bullets',
      'upgrade_ultimate_burst'
    ]
  },
  {
    id: 'unreleased-showcase',
    name: 'Unreleased Lab Pack',
    description: 'Tests experimental unreleased items (Double-Jump, Galvanic Storm, Stabilizing Tripod, etc.)',
    itemIds: [
      'upgrade_double_jump',
      'upgrade_galvanic_storm',
      'upgrade_stabilizing_tripod',
      'upgrade_arcane_eater',
      'upgrade_full_spectrum',
      'upgrade_tech_cleave',
      'upgrade_aerial_assault',
      'upgrade_zipine_mastery',
      'cosmetic_item_snowball'
    ]
  }
];
