import {
  Component, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Character, CharacterStats, ElementType, WeaponType } from '../story.types';

// ── Element definitions ───────────────────────────────────────────────────────
export interface ElementDef {
  key: ElementType;
  label: string;
  icon: string;   // Font Awesome icon name (without 'fa-')
  color: string;
  bg: string;
}

export const ALL_ELEMENTS: ElementDef[] = [
  { key: 'licht',      label: 'Licht',      icon: 'fa-sun',                 color: '#FFD700', bg: '#1e1800' },
  { key: 'duisternis', label: 'Duisternis', icon: 'fa-moon',                color: '#9B59B6', bg: '#140a20' },
  { key: 'water',      label: 'Water',      icon: 'fa-droplet',             color: '#4FC3F7', bg: '#081828' },
  { key: 'vuur',       label: 'Vuur',       icon: 'fa-fire',                color: '#FF5722', bg: '#200800' },
  { key: 'aarde',      label: 'Aarde',      icon: 'fa-mountain',            color: '#A1887F', bg: '#140e08' },
  { key: 'ijs',        label: 'Ijs',        icon: 'fa-snowflake',           color: '#81D4FA', bg: '#081020' },
  { key: 'donder',     label: 'Donder',     icon: 'fa-bolt',                color: '#FFEE58', bg: '#181400' },
  { key: 'wind',       label: 'Wind',       icon: 'fa-wind',                color: '#80DEEA', bg: '#081818' },
  { key: 'geluid',     label: 'Geluid',     icon: 'fa-music',               color: '#F48FB1', bg: '#200818' },
  { key: 'tijd',       label: 'Tijd',       icon: 'fa-hourglass-half',      color: '#FFB74D', bg: '#180e00' },
  { key: 'ruimte',     label: 'Ruimte',     icon: 'fa-infinity',            color: '#7986CB', bg: '#080820' },
  { key: 'schepping',  label: 'Schepping',  icon: 'fa-wand-magic-sparkles', color: '#A5D6A7', bg: '#081808' },
  { key: 'ether',      label: 'Ether',      icon: 'fa-atom',                color: '#80CBC4', bg: '#081818' },
];

// ── Weapon types ──────────────────────────────────────────────────────────────
export const WEAPON_TYPES: { key: WeaponType; label: string }[] = [
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

// ── Default stats ─────────────────────────────────────────────────────────────
export const DEFAULT_STATS: CharacterStats = {
  strength: 50, agility: 50, dexterity: 50, endurance: 50,
  intelligence: 50, wisdom: 50, luck: 50,
  staggerPower: 50, staggerResistance: 50,
  lightResistance: 0, darknessResistance: 0, waterResistance: 0,
  fireResistance: 0, earthResistance: 0, iceResistance: 0,
  thunderResistance: 0, windResistance: 0, soundResistance: 0,
  timeResistance: 0, spaceResistance: 0, creationResistance: 0,
  etherResistance: 0,
  poisonResistance: 0, paralysisResistance: 0, blindResistance: 0,
  sleepResistance: 0, confusionResistance: 0, fearResistance: 0,
};

// ── Stat definitions ──────────────────────────────────────────────────────────
export interface StatDef {
  key: keyof CharacterStats;
  name: string;
  sub: string;
  color: string;
}

export const CORE_STATS: StatDef[] = [
  { key: 'strength',    name: 'Kracht',              sub: 'Strength',    color: 'linear-gradient(90deg,#c0392b,#e74c3c)' },
  { key: 'agility',     name: 'Snelheid',            sub: 'Agility',     color: 'linear-gradient(90deg,#1a7a3a,#27ae60)' },
  { key: 'dexterity',   name: 'Behendigheid',        sub: 'Dexterity',   color: 'linear-gradient(90deg,#0d6a60,#16a085)' },
  { key: 'endurance',   name: 'Uithoudingsvermogen', sub: 'Endurance',   color: 'linear-gradient(90deg,#c07820,#e67e22)' },
  { key: 'intelligence',name: 'Intelligentie',       sub: 'Intelligence',color: 'linear-gradient(90deg,#1a5a9a,#2980b9)' },
  { key: 'wisdom',      name: 'Wijsheid',            sub: 'Wisdom',      color: 'linear-gradient(90deg,#6a1a8e,#8e44ad)' },
  { key: 'luck',        name: 'Geluk',               sub: 'Luck',        color: 'linear-gradient(90deg,#b8960a,#d4ac0d)' },
];

export const STAGGER_STATS: StatDef[] = [
  { key: 'staggerPower',      name: 'Staggerkracht',    sub: 'Stagger Power',      color: 'linear-gradient(90deg,#8e0a5a,#c0396e)' },
  { key: 'staggerResistance', name: 'Staggerweerstand', sub: 'Stagger Resistance', color: 'linear-gradient(90deg,#3a3a3a,#666666)' },
];

// Mapping element key → CharacterStats resistance key
const ELEM_RESIST: Record<ElementType, keyof CharacterStats> = {
  licht:      'lightResistance',
  duisternis: 'darknessResistance',
  water:      'waterResistance',
  vuur:       'fireResistance',
  aarde:      'earthResistance',
  ijs:        'iceResistance',
  donder:     'thunderResistance',
  wind:       'windResistance',
  geluid:     'soundResistance',
  tijd:       'timeResistance',
  ruimte:     'spaceResistance',
  schepping:  'creationResistance',
  ether:      'etherResistance',
};

export interface StatusDef {
  key: keyof CharacterStats;
  label: string;
  color: string;
}

export const STATUS_RESISTANCES: StatusDef[] = [
  { key: 'poisonResistance',    label: 'Vergif',     color: 'linear-gradient(90deg,#1a5a1a,#2e8b2e)' },
  { key: 'paralysisResistance', label: 'Verlamming', color: 'linear-gradient(90deg,#7a6010,#b8940a)' },
  { key: 'blindResistance',     label: 'Blindheid',  color: 'linear-gradient(90deg,#3a3a3a,#606060)' },
  { key: 'sleepResistance',     label: 'Slaap',      color: 'linear-gradient(90deg,#1a3a6a,#2a5a9a)' },
  { key: 'confusionResistance', label: 'Verwarring', color: 'linear-gradient(90deg,#6a1a3a,#9a2a5a)' },
  { key: 'fearResistance',      label: 'Angst',      color: 'linear-gradient(90deg,#4a1a6a,#6a2a9a)' },
];

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-character-sheet',
  templateUrl: './character-sheet.html',
  styleUrl: './character-sheet.css',
  standalone: true,
  imports: [FormsModule],
})
export class CharacterSheet implements OnInit, OnChanges {
  @Input() character!: Character;
  @Output() saved  = new EventEmitter<Character>();
  @Output() closed = new EventEmitter<void>();

  draft!: Character;

  readonly elements      = ALL_ELEMENTS;
  readonly weaponTypes   = WEAPON_TYPES;
  readonly coreStats     = CORE_STATS;
  readonly staggerStats  = STAGGER_STATS;
  readonly statusResist  = STATUS_RESISTANCES;

  openElement1Picker = false;
  openElement2Picker = false;

  avatarDragOver   = false;
  fullBodyDragOver = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void { this.initDraft(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']) this.initDraft();
  }

  private initDraft(): void {
    if (!this.character) return;
    this.draft = {
      ...this.character,
      stats: { ...DEFAULT_STATS, ...(this.character.stats ?? {}) },
    };
    this.openElement1Picker = false;
    this.openElement2Picker = false;
  }

  // ── Element helpers ───────────────────────────────────────────────────────
  get element1Def(): ElementDef | undefined {
    return this.elements.find(e => e.key === this.draft?.element1);
  }

  get element2Def(): ElementDef | undefined {
    return this.elements.find(e => e.key === this.draft?.element2);
  }

  selectElement1(key: ElementType | undefined): void {
    this.draft.element1 = key;
    this.openElement1Picker = false;
  }

  selectElement2(key: ElementType | undefined): void {
    this.draft.element2 = key;
    this.openElement2Picker = false;
  }

  togglePicker1(event: Event): void {
    event.stopPropagation();
    this.openElement1Picker = !this.openElement1Picker;
    this.openElement2Picker = false;
  }

  togglePicker2(event: Event): void {
    event.stopPropagation();
    this.openElement2Picker = !this.openElement2Picker;
    this.openElement1Picker = false;
  }

  stopProp(event: Event): void { event.stopPropagation(); }

  closePickers(): void {
    this.openElement1Picker = false;
    this.openElement2Picker = false;
  }

  // ── Stat helpers ──────────────────────────────────────────────────────────
  getStat(key: keyof CharacterStats): number {
    return ((this.draft?.stats as unknown) as Record<string, number>)?.[key] ?? 0;
  }

  setStat(key: keyof CharacterStats, value: number | string): void {
    if (!this.draft.stats) return;
    ((this.draft.stats as unknown) as Record<string, number>)[key] =
      Math.min(100, Math.max(0, Math.round(+value || 0)));
  }

  getElemResist(elemKey: ElementType): number {
    return this.getStat(ELEM_RESIST[elemKey]);
  }

  setElemResist(elemKey: ElementType, value: number | string): void {
    this.setStat(ELEM_RESIST[elemKey], value);
  }

  // ── Photo handling ────────────────────────────────────────────────────────
  onAvatarDrop(event: DragEvent): void {
    event.preventDefault();
    this.avatarDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) this.loadImage(file, 'avatar');
  }

  onFullBodyDrop(event: DragEvent): void {
    event.preventDefault();
    this.fullBodyDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) this.loadImage(file, 'fullBody');
  }

  onAvatarFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.loadImage(file, 'avatar');
    (event.target as HTMLInputElement).value = '';
  }

  onFullBodyFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.loadImage(file, 'fullBody');
    (event.target as HTMLInputElement).value = '';
  }

  private loadImage(file: File, target: 'avatar' | 'fullBody'): void {
    const reader = new FileReader();
    reader.onload = () => {
      if (target === 'avatar') this.draft.avatar = reader.result as string;
      else this.draft.fullBodyPhoto = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  save(): void {
    this.saved.emit({ ...this.draft });
  }

  close(): void {
    this.closed.emit();
  }

  onOverlayKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
  }
}
