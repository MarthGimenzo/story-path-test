/** Beschrijving van een element (standaard of custom). */
export interface ElementDef {
  key: string;
  label: string;
  icon: string;         // Font Awesome class, bijv. 'fa-fire'
  color: string;        // Primaire kleur (hex)
  bg: string;           // Donkere achtergrondtint (voor het icoontje-rondje)
  description: string;
  isCustom?: boolean;
}

/** De 13 standaard elementen — altijd aanwezig, niet verwijderbaar. */
export const ALL_ELEMENTS: ElementDef[] = [
  {
    key: 'licht',
    label: 'Licht',
    icon: 'fa-sun',
    color: '#FFD700',
    bg: '#1e1800',
    description: 'Energie van helderheid en reinheid. Kan helen en statuseffecten reinigen.',
  },
  {
    key: 'duisternis',
    label: 'Duisternis',
    icon: 'fa-moon',
    color: '#9B59B6',
    bg: '#140a20',
    description: 'Energie van schaduw en verval. Ondermijnt de vijand van binnenuit door statistieken naar beneden te halen.',
  },
  {
    key: 'water',
    label: 'Water',
    icon: 'fa-droplet',
    color: '#4FC3F7',
    bg: '#081828',
    description: 'Vloeiende, aanpassende energie. Niet de sterkste in directe kracht, maar moeilijk te stoppen en te voorspellen.',
  },
  {
    key: 'vuur',
    label: 'Vuur',
    icon: 'fa-fire',
    color: '#FF5722',
    bg: '#200800',
    description: 'Explosieve, agressieve energie. Hoge schade maar vraagt voorbereiding en laat je kwetsbaar achter.',
  },
  {
    key: 'aarde',
    label: 'Aarde',
    icon: 'fa-mountain',
    color: '#A1887F',
    bg: '#140e08',
    description: 'Trage, zware energie. Moeilijk te onderbreken en te verplaatsen, maar weinig flexibiliteit.',
  },
  {
    key: 'ijs',
    label: 'Ijs',
    icon: 'fa-snowflake',
    color: '#81D4FA',
    bg: '#081020',
    description: 'Bevriest beweging en verhoogt recovery-tijd van vijanden.',
  },
  {
    key: 'donder',
    label: 'Donder',
    icon: 'fa-bolt',
    color: '#FFEE58',
    bg: '#181400',
    description: 'Scherpte en precisie van elektrische energie. Raak snel en hard, maar vereist goede timing.',
  },
  {
    key: 'wind',
    label: 'Wind',
    icon: 'fa-wind',
    color: '#80DEEA',
    bg: '#081818',
    description: 'Vrije, ongrijpbare energie van beweging. Zwak in directe schade, maar onovertroffen in controle over het slagveld.',
  },
  {
    key: 'geluid',
    label: 'Geluid',
    icon: 'fa-music',
    color: '#F48FB1',
    bg: '#200818',
    description: 'Interrupt-gebaseerd, hoge staggerkracht. Destabiliseert vijanden via resonantie.',
  },
  {
    key: 'tijd',
    label: 'Tijd',
    icon: 'fa-hourglass-half',
    color: '#FFB74D',
    bg: '#180e00',
    description: 'De stroom van oorzaak en gevolg. Kan vijanden vertragen of stilzetten. Kan warmup en cooldown-tijd beïnvloeden.',
  },
  {
    key: 'ruimte',
    label: 'Ruimte',
    icon: 'fa-infinity',
    color: '#7986CB',
    bg: '#080820',
    description: 'De leegte waarin alles bestaat en beweegt. Beïnvloedt bereik en knockback fundamenteel. Kan vijanden verplaatsen.',
  },
  {
    key: 'schepping',
    label: 'Schepping',
    icon: 'fa-wand-magic-sparkles',
    color: '#A5D6A7',
    bg: '#081808',
    description: 'De oerkracht van ontstaan en vorm. Het tegenovergestelde van verval — genereert tijdelijke barrières of terrein op het veld.',
  },
  {
    key: 'ether',
    label: 'Ether',
    icon: 'fa-atom',
    color: '#80CBC4',
    bg: '#081818',
    description: 'Beïnvloedt mana/MP en magische statistieken. De onderstroom waaruit alle andere elementen putten.',
  },
];

/** Hulpfunctie: bereken een donkere achtergrondtint op basis van de hoofdkleur. */
export function computeBg(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '#0f0a04';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * 0.12)},${Math.round(g * 0.12)},${Math.round(b * 0.12)})`;
}

/** Unieke sleutel genereren voor custom elementen. */
export function newElementKey(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
