export type ElementType =
  'licht' | 'duisternis' | 'water' | 'vuur' | 'aarde' |
  'ijs' | 'donder' | 'wind' | 'geluid' | 'tijd' |
  'ruimte' | 'schepping' | 'ether';

export type WeaponType =
  'geen' | 'zwaard' | 'langzwaard' | 'katana' | 'dolk' | 'bijl' | 'strijdbijl' |
  'speer' | 'lans' | 'boog' | 'kruisboog' | 'staf' | 'toverstok' | 'schild' |
  'vuisten' | 'zweep' | 'werpwapen' | 'blaaspijp' | 'instrument';

export interface CharacterStats {
  // Kernstatistieken (0–100)
  strength: number;           // Kracht
  agility: number;            // Snelheid
  dexterity: number;          // Behendigheid
  endurance: number;          // Uithoudingsvermogen
  intelligence: number;       // Intelligentie
  wisdom: number;             // Wijsheid
  luck: number;               // Geluk
  staggerPower: number;       // Staggerkracht
  staggerResistance: number;  // Staggerweerstand
  // Elementaire resistentie (0–100)
  lightResistance: number;
  darknessResistance: number;
  waterResistance: number;
  fireResistance: number;
  earthResistance: number;
  iceResistance: number;
  thunderResistance: number;
  windResistance: number;
  soundResistance: number;
  timeResistance: number;
  spaceResistance: number;
  creationResistance: number;
  etherResistance: number;
  // Statuseffect weerstand (0–100)
  poisonResistance: number;
  paralysisResistance: number;
  blindResistance: number;
  sleepResistance: number;
  confusionResistance: number;
  fearResistance: number;
}

export interface Character {
  id: string;
  name: string;
  lastName?: string;
  color: string;
  avatar?: string;        // base64 data-URL
  fullBodyPhoto?: string; // base64 data-URL
  description?: string;
  element1?: ElementType;
  element2?: ElementType;
  weaponType?: WeaponType;
  itemSlots?: number;
  stats?: CharacterStats;
}

export interface Chapter {
  label: string;
  height: number;  // minimum section height in SVG units (default 220)
}

export interface StoryNode {
  id: string;
  characters: string[];
  label: string;
  description: string;
  col: number;
  row: number;
  type: 'start' | 'encounter' | 'dungeon' | 'event' | 'split';
  /** IDs van de karakters die zich aansluiten bij de bestaande groep (voor visuele pijl). */
  joiners?: string[];
}

export interface StoryEdge {
  id: string;
  from: string;
  to: string;
  type?: 'story' | 'character-move';
  charId?: string;  // alleen bij type='character-move'
}
