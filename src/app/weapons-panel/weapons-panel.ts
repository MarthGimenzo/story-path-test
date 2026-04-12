import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { newWeaponKey, WeaponDef } from '../weapons';

@Component({
  selector: 'app-weapons-panel',
  templateUrl: './weapons-panel.html',
  styleUrl: './weapons-panel.css',
  standalone: true,
  imports: [FormsModule],
})
export class WeaponsPanel {
  @Input() weapons: WeaponDef[] = [];
  @Input() open = false;

  @Output() weaponsChanged = new EventEmitter<WeaponDef[]>();
  @Output() closed = new EventEmitter<void>();

  addingNew = false;
  newLabel = '';

  editingKey: string | null = null;
  editLabel = '';

  // ── Nieuw wapen ──────────────────────────────────────────────────────────────
  startAdding(): void {
    this.addingNew = true;
    this.newLabel = '';
    this.editingKey = null;
  }

  cancelAdding(): void {
    this.addingNew = false;
    this.newLabel = '';
  }

  saveNew(): void {
    if (!this.newLabel.trim()) return;
    const newWeapon: WeaponDef = {
      key:      newWeaponKey(),
      label:    this.newLabel.trim(),
      isCustom: true,
    };
    this.weaponsChanged.emit([...this.weapons, newWeapon]);
    this.addingNew = false;
    this.newLabel = '';
  }

  // ── Wapen bewerken ────────────────────────────────────────────────────────────
  startEdit(weapon: WeaponDef, event: Event): void {
    event.stopPropagation();
    this.editingKey = weapon.key;
    this.editLabel  = weapon.label;
    this.addingNew  = false;
  }

  cancelEdit(): void {
    this.editingKey = null;
    this.editLabel  = '';
  }

  saveEdit(): void {
    if (!this.editLabel.trim()) return;
    const updated = this.weapons.map(w =>
      w.key === this.editingKey ? { ...w, label: this.editLabel.trim() } : w
    );
    this.weaponsChanged.emit(updated);
    this.editingKey = null;
    this.editLabel  = '';
  }

  // ── Wapen verwijderen ─────────────────────────────────────────────────────────
  removeWeapon(key: string): void {
    this.weaponsChanged.emit(this.weapons.filter(w => w.key !== key));
  }
}
