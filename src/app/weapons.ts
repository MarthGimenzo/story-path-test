export interface WeaponDef {
  key: string;
  label: string;
  isCustom?: boolean;
}

export const DEFAULT_WEAPONS: WeaponDef[] = [
  { key: 'geen',       label: 'Geen' },
  { key: 'zwaard',     label: 'Zwaard' },
  { key: 'langzwaard', label: 'Langzwaard' },
  { key: 'katana',     label: 'Katana' },
  { key: 'dolk',       label: 'Dolk' },
  { key: 'bijl',       label: 'Bijl' },
  { key: 'strijdbijl', label: 'Strijdbijl' },
  { key: 'speer',      label: 'Speer' },
  { key: 'lans',       label: 'Lans' },
  { key: 'boog',       label: 'Boog' },
  { key: 'kruisboog',  label: 'Kruisboog' },
  { key: 'staf',       label: 'Staf' },
  { key: 'toverstok',  label: 'Toverstok' },
  { key: 'schild',     label: 'Schild' },
  { key: 'vuisten',    label: 'Vuisten' },
  { key: 'zweep',      label: 'Zweep' },
  { key: 'werpwapen',  label: 'Werpwapen' },
  { key: 'blaaspijp',  label: 'Blaaspijp' },
  { key: 'instrument', label: 'Instrument' },
];

export function newWeaponKey(): string {
  return `weapon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
