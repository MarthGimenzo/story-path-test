import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ALL_ELEMENTS, computeBg, ElementDef, newElementKey } from '../elements';

@Component({
  selector: 'app-elements-panel',
  templateUrl: './elements-panel.html',
  styleUrl: './elements-panel.css',
  standalone: true,
  imports: [FormsModule],
})
export class ElementsPanel {
  @Input() customElements: ElementDef[] = [];
  @Input() open = false;

  @Output() customElementsChanged = new EventEmitter<ElementDef[]>();
  @Output() closed = new EventEmitter<void>();

  readonly defaultElements = ALL_ELEMENTS;

  expandedKey: string | null = null;
  addingNew = false;

  newDraft: Partial<ElementDef> = {};

  // ── Standaard elementen: uitvouwen/inklappen ──────────────────────────────
  toggleExpand(key: string, event: Event): void {
    event.stopPropagation();
    this.expandedKey = this.expandedKey === key ? null : key;
    this.addingNew = false;
  }

  // ── Custom element toevoegen ──────────────────────────────────────────────
  startAdding(): void {
    this.addingNew = true;
    this.expandedKey = null;
    this.newDraft = { color: '#e8a840', icon: 'fa-star', label: '', description: '' };
  }

  cancelAdding(): void {
    this.addingNew = false;
    this.newDraft = {};
  }

  saveNew(): void {
    if (!this.newDraft.label?.trim()) return;
    const color = this.newDraft.color ?? '#e8a840';
    const newEl: ElementDef = {
      key:         newElementKey(),
      label:       this.newDraft.label.trim(),
      icon:        this.newDraft.icon?.trim() || 'fa-star',
      color,
      bg:          computeBg(color),
      description: this.newDraft.description?.trim() ?? '',
      isCustom:    true,
    };
    this.customElementsChanged.emit([...this.customElements, newEl]);
    this.addingNew = false;
    this.newDraft = {};
  }

  // Herbereken bg als de kleur verandert
  onNewColorChange(color: string): void {
    this.newDraft.color = color;
  }

  // ── Custom element verwijderen ────────────────────────────────────────────
  removeCustom(key: string): void {
    this.customElementsChanged.emit(this.customElements.filter(e => e.key !== key));
  }

  // ── Custom element bewerken ───────────────────────────────────────────────
  editingKey: string | null = null;
  editDraft: Partial<ElementDef> = {};

  startEdit(el: ElementDef, event: Event): void {
    event.stopPropagation();
    this.editingKey = el.key;
    this.editDraft = { ...el };
    this.addingNew = false;
  }

  cancelEdit(): void {
    this.editingKey = null;
    this.editDraft = {};
  }

  saveEdit(): void {
    if (!this.editDraft.label?.trim()) return;
    const color = this.editDraft.color ?? '#e8a840';
    const updated = this.customElements.map(e =>
      e.key === this.editingKey
        ? { ...e, ...this.editDraft, bg: computeBg(color), isCustom: true } as ElementDef
        : e
    );
    this.customElementsChanged.emit(updated);
    this.editingKey = null;
    this.editDraft = {};
  }
}
