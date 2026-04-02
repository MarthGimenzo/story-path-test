import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Character } from '../story.types';

@Component({
  selector: 'app-settings-sidebar',
  templateUrl: './settings-sidebar.html',
  styleUrl: './settings-sidebar.css',
  standalone: true,
})
export class SettingsSidebar {
  @Input() characters: Character[] = [];
  @Input() selectedStarters: Set<string> = new Set();
  @Input() open = false;

  @Output() toggled = new EventEmitter<string>();
  @Output() closed  = new EventEmitter<void>();

  /** Id van het karakter dat wacht op bevestiging voor verwijdering */
  pendingRemovalId: string | null = null;

  handleChipClick(charId: string): void {
    if (this.selectedStarters.has(charId)) {
      // Actief → vraag bevestiging
      this.pendingRemovalId = charId;
    } else {
      // Inactief → direct toevoegen
      this.toggled.emit(charId);
    }
  }

  confirmRemoval(): void {
    if (this.pendingRemovalId) {
      this.toggled.emit(this.pendingRemovalId);
      this.pendingRemovalId = null;
    }
  }

  cancelRemoval(): void {
    this.pendingRemovalId = null;
  }
}