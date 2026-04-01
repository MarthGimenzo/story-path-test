import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Character, StoryEdge, StoryNode } from '../story.types';

@Component({
  selector: 'app-story-canvas',
  templateUrl: './story-canvas.html',
  styleUrl: './story-canvas.css',
  standalone: true,
})
export class StoryCanvas {
  @Input() nodes: StoryNode[] = [];
  @Input() edges: StoryEdge[] = [];
  @Input() characters: Character[] = [];

  @Output() encounterAdded  = new EventEmitter<{ parentId: string; charId: string }>();
  @Output() mergeRequested  = new EventEmitter<{ parentId: string; mergeWithId: string }>();
  @Output() nodeRemoved     = new EventEmitter<string>();

  // ── Layout constanten ──────────────────────────────────────────────────────
  readonly NODE_WIDTH    = 190;
  readonly COL_SPACING   = 260;
  readonly ROW_SPACING   = 280;
  readonly PADDING_X     = 80;
  readonly PADDING_BOTTOM = 55;

  readonly DOTS_PER_ROW  = 6;
  readonly DOT_R         = 8;   // straal van karakter-dot
  readonly DOT_GAP       = 5;
  readonly DOT_AREA_TOP  = 50;  // Y waar dots beginnen (relatief aan node top)

  // ── Picker state ───────────────────────────────────────────────────────────
  pickerParentId: string | null = null;
  availableChars: Character[]   = [];
  mergeableGroups: StoryNode[]  = [];

  // ── SVG afmetingen ─────────────────────────────────────────────────────────
  get svgWidth(): number {
    const maxCol = this.nodes.reduce((max, n) => Math.max(max, n.col), 0);
    return Math.max(500, this.PADDING_X * 2 + (maxCol + 1) * this.COL_SPACING);
  }

  get svgHeight(): number {
    const maxRow = this.nodes.reduce((max, n) => Math.max(max, n.row), 0);
    return Math.max(480, this.PADDING_BOTTOM + (maxRow + 2) * this.ROW_SPACING);
  }

  // ── Node hoogte (dynamisch op basis van groepsgrootte) ─────────────────────
  getNodeHeight(node: StoryNode): number {
    const rows = Math.ceil(node.characters.length / this.DOTS_PER_ROW);
    return this.DOT_AREA_TOP + rows * (this.DOT_R * 2 + this.DOT_GAP) + 14;
  }

  // ── Positie berekeningen ───────────────────────────────────────────────────
  getNodeX(node: StoryNode): number {
    return this.PADDING_X + node.col * this.COL_SPACING;
  }

  getNodeY(node: StoryNode): number {
    const h = this.getNodeHeight(node);
    const slotCenterY = this.svgHeight - this.PADDING_BOTTOM - (node.row + 0.5) * this.ROW_SPACING;
    return slotCenterY - h / 2;
  }

  getNodeCenterX(node: StoryNode): number {
    return this.getNodeX(node) + this.NODE_WIDTH / 2;
  }

  getRowLabelY(row: number): number {
    const node = this.nodes.find(n => n.row === row);
    if (!node) return -100;
    const h = this.getNodeHeight(node);
    return this.getNodeY(node) + h / 2 + 5;
  }

  get activeRows(): number[] {
    return [...new Set(this.nodes.map(n => n.row))].sort((a, b) => a - b);
  }

  rowLabel(row: number): string {
    return row === 0 ? 'BEGIN' : `H.${row}`;
  }

  // ── Dot posities ───────────────────────────────────────────────────────────
  getDotCx(index: number, total: number): number {
    const col       = index % this.DOTS_PER_ROW;
    const rowIndex  = Math.floor(index / this.DOTS_PER_ROW);
    const totalRows = Math.ceil(total / this.DOTS_PER_ROW);
    const charsInRow = rowIndex === totalRows - 1
      ? total - rowIndex * this.DOTS_PER_ROW
      : this.DOTS_PER_ROW;
    const step      = this.DOT_R * 2 + this.DOT_GAP;
    const rowWidth  = charsInRow * step - this.DOT_GAP;
    return this.NODE_WIDTH / 2 - rowWidth / 2 + this.DOT_R + col * step;
  }

  getDotCy(index: number, total: number, node: StoryNode): number {
    const rowIndex  = Math.floor(index / this.DOTS_PER_ROW);
    const totalRows = Math.ceil(total / this.DOTS_PER_ROW);
    const h         = this.getNodeHeight(node);
    const step      = this.DOT_R * 2 + this.DOT_GAP;
    // Dots van onder naar boven: rij 0 = onderste rij
    return h - 10 - (totalRows - 1 - rowIndex) * step - this.DOT_R;
  }

  // ── Edges ──────────────────────────────────────────────────────────────────
  getEdgePath(edge: StoryEdge): string {
    const from = this.nodes.find(n => n.id === edge.from)!;
    const to   = this.nodes.find(n => n.id === edge.to)!;

    const x1 = this.getNodeCenterX(from);
    const y1 = this.getNodeY(from);
    const x2 = this.getNodeCenterX(to);
    const y2 = this.getNodeY(to) + this.getNodeHeight(to) - 2;

    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }

  // ── Leaf nodes = actieve groepen (geen uitgaande edges) ────────────────────
  get leafNodes(): StoryNode[] {
    const withOutgoing = new Set(this.edges.map(e => e.from));
    return this.nodes.filter(n => !withOutgoing.has(n.id));
  }

  // ── Picker ─────────────────────────────────────────────────────────────────
  openPicker(nodeId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.pickerParentId = nodeId;

    const activeChars = new Set<string>();
    this.leafNodes.forEach(n => n.characters.forEach(c => activeChars.add(c)));

    this.availableChars   = this.characters.filter(c => !activeChars.has(c.id));
    this.mergeableGroups  = this.leafNodes.filter(n => n.id !== nodeId);
  }

  selectCharacter(charId: string): void {
    if (!this.pickerParentId) return;
    this.encounterAdded.emit({ parentId: this.pickerParentId, charId });
    this.pickerParentId = null;
  }

  selectMerge(mergeWithId: string): void {
    if (!this.pickerParentId) return;
    this.mergeRequested.emit({ parentId: this.pickerParentId, mergeWithId });
    this.pickerParentId = null;
  }

  // ── Kleur hulpfuncties ─────────────────────────────────────────────────────
  getCharacter(id: string): Character | undefined {
    return this.characters.find(c => c.id === id);
  }

  getNodeFill(type: string): string {
    const map: Record<string, string> = {
      start:     '#061a2e',
      encounter: '#15082a',
      dungeon:   '#200808',
      event:     '#071a0f',
      split:     '#1a1508',
    };
    return map[type] ?? '#111827';
  }

  getNodeStroke(node: StoryNode): string {
    if (node.type === 'start' && node.characters.length === 1) {
      return this.getCharacter(node.characters[0])?.color ?? '#4fc3f7';
    }
    const map: Record<string, string> = {
      encounter: '#9c6fce',
      dungeon:   '#ef5350',
      event:     '#66bb6a',
      split:     '#ffb74d',
    };
    return map[node.type] ?? '#4b5563';
  }

  getTypeLabelColor(type: string): string {
    const map: Record<string, string> = {
      start:     '#4fc3f7',
      encounter: '#ce93d8',
      dungeon:   '#ef5350',
      event:     '#81c784',
      split:     '#ffb74d',
    };
    return map[type] ?? '#9e9e9e';
  }
}