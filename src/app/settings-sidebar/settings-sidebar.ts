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

  pendingRemovalId: string | null = null;

  get activeStarters(): Character[] {
    return this.characters.filter(c => this.selectedStarters.has(c.id));
  }

  get inactiveChars(): Character[] {
    return this.characters.filter(c => !this.selectedStarters.has(c.id));
  }

  handleChipClick(charId: string): void {
    // Actief → vraag bevestiging
    this.pendingRemovalId = charId;
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