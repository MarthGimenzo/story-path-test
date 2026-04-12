import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ALL_ELEMENTS } from '../elements';
import { Character } from '../story.types';

const PALETTE = [
  '#4fc3f7', '#81c784', '#f06292', '#ffb74d', '#ce93d8',
  '#ef5350', '#4db6ac', '#ff8a65', '#fff176', '#80cbc4',
  '#90caf9', '#a5d6a7', '#f48fb1', '#b39ddb', '#80deea', '#ffcc02',
];

@Component({
  selector: 'app-character-panel',
  templateUrl: './character-panel.html',
  styleUrl: './character-panel.css',
  standalone: true,
  imports: [],
})
export class CharacterPanel {
  @Input() characters: Character[] = [];
  @Input() open = false;

  @Output() charactersChanged = new EventEmitter<Character[]>();
  @Output() closed            = new EventEmitter<void>();
  @Output() editRequested     = new EventEmitter<Character>();

  private readonly elemMap = new Map(
    ALL_ELEMENTS.map(e => [e.key, e])
  );

  getElementIcon(key: string): string {
    return this.elemMap.get(key)?.icon ?? 'fa-circle-dot';
  }

  getElementColor(key: string): string {
    return this.elemMap.get(key)?.color ?? '#5a3a1a';
  }

  addCharacter(): void {
    const used = new Set(this.characters.map(c => c.color));
    const color = PALETTE.find(c => !used.has(c))
      ?? '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: 'Nieuw karakter',
      color,
      description: '',
    };
    this.charactersChanged.emit([...this.characters, newChar]);
    // Open de sheet direct zodat gebruiker het nieuwe karakter kan invullen
    this.editRequested.emit(newChar);
  }

  removeCharacter(id: string): void {
    this.charactersChanged.emit(this.characters.filter(c => c.id !== id));
  }

  exportCharacters(): void {
    // Exporteer alles inclusief afbeeldingen (base64)
    const json = JSON.stringify(this.characters, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'characters.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  onImportFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data)) {
          const chars: Character[] = data.map((c: any) => ({
            id:            c.id ?? `char-${Date.now()}-${Math.random()}`,
            name:          c.name ?? 'Onbekend',
            lastName:      c.lastName,
            color:         c.color ?? '#aaaaaa',
            avatar:        c.avatar,
            fullBodyPhoto: c.fullBodyPhoto,
            description:   c.description ?? '',
            element1:      c.element1,
            element2:      c.element2,
            weaponType:    c.weaponType,
            itemSlots:     c.itemSlots,
            stats:         c.stats,
          }));
          this.charactersChanged.emit(chars);
        }
      } catch { /* invalid JSON */ }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }
}
