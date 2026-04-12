import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule],
})
export class CharacterPanel {
  @Input() characters: Character[] = [];
  @Input() open = false;

  @Output() charactersChanged = new EventEmitter<Character[]>();
  @Output() closed            = new EventEmitter<void>();
  @Output() editRequested     = new EventEmitter<Character>();

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
  }

  removeCharacter(id: string): void {
    this.charactersChanged.emit(this.characters.filter(c => c.id !== id));
  }

  emit(): void {
    this.charactersChanged.emit([...this.characters]);
  }

  onAvatarChange(char: Character, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      char.avatar = reader.result as string;
      this.emit();
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeAvatar(char: Character): void {
    char.avatar = undefined;
    this.emit();
  }

  exportCharacters(): void {
    // Strip base64 images (too large) — export only data fields
    const exportData = this.characters.map(
      ({ avatar: _a, fullBodyPhoto: _fb, ...rest }) => rest
    );
    const json = JSON.stringify(exportData, null, 2);
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
            id:           c.id ?? `char-${Date.now()}-${Math.random()}`,
            name:         c.name ?? 'Onbekend',
            lastName:     c.lastName,
            color:        c.color ?? '#aaaaaa',
            description:  c.description ?? '',
            element1:     c.element1,
            element2:     c.element2,
            weaponType:   c.weaponType,
            itemSlots:    c.itemSlots,
            stats:        c.stats,
          }));
          this.charactersChanged.emit(chars);
        }
      } catch { /* invalid JSON */ }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }
}
