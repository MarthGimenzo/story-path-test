import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_WEAPONS, newWeaponKey, WeaponDef } from '../weapons';

@Component({
  selector: 'app-weapons-panel',
  templateUrl: './weapons-panel.html',
  styleUrl: './weapons-panel.css',
  standalone: true,
  imports: [FormsModule],
})
export class WeaponsPanel {
  @Input() customWeapons: WeaponDef[] = [];
  @Input() open = false;

  @Output() customWeaponsChanged = new EventEmitter<WeaponDef[]>();
  @Output() closed = new EventEmitter<void>();

  readonly defaultWeapons = DEFAULT_WEAPONS;

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
    this.customWeaponsChanged.emit([...this.customWeapons, newWeapon]);
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
    const updated = this.customWeapons.map(w =>
      w.key === this.editingKey ? { ...w, label: this.editLabel.trim() } : w
    );
    this.customWeaponsChanged.emit(updated);
    this.editingKey = null;
    this.editLabel  = '';
  }

  // ── Wapen verwijderen ─────────────────────────────────────────────────────────
  removeWeapon(key: string): void {
    this.customWeaponsChanged.emit(this.customWeapons.filter(w => w.key !== key));
  }
}
