import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Character, StoryEdge, StoryNode } from '../story.types';

@Component({
  selector: 'app-story-canvas',
  templateUrl: './story-canvas.html',
  styleUrl: './story-canvas.css',
  standalone: true,
})
export class StoryCanvas implements OnChanges {

  constructor(
    private readonly el:  ElementRef,
    private readonly zone: NgZone,
    private readonly cdr:  ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['nodes']) return;
    const prev: StoryNode[] = changes['nodes'].previousValue ?? [];
    const curr: StoryNode[] = changes['nodes'].currentValue ?? [];
    // Alleen panen bij interactieve toevoeging (niet bij laden / undo)
    if (prev.length === 0) return;
    const newNodes = curr.filter(n => !prev.some(p => p.id === n.id));
    if (newNodes.length === 0 || newNodes.length > 3) return;
    this.panToNode(newNodes[newNodes.length - 1]);
  }

  private panToNode(node: StoryNode): void {
    const host = this.el.nativeElement as HTMLElement;
    const cx = host.clientWidth  / 2;
    const cy = host.clientHeight / 2;
    const targetX = cx - this.getNodeCenterX(node);
    const targetY = cy - (this.getNodeY(node) + this.getNodeHeight(node) / 2);
    this.animatePan(targetX, targetY, 1000);
  }

  private animatePan(toX: number, toY: number, duration: number): void {
    const fromX = this.panX;
    const fromY = this.panY;
    const t0    = performance.now();

    this.zone.runOutsideAngular(() => {
      const tick = (now: number) => {
        const t = Math.min((now - t0) / duration, 1);
        // ease-in-out cubic
        const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
        this.panX = fromX + (toX - fromX) * e;
        this.panY = fromY + (toY - fromY) * e;
        this.cdr.detectChanges();
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  @Input() nodes: StoryNode[] = [];
  @Input() edges: StoryEdge[] = [];
  @Input() characters: Character[] = [];

  @Output() encounterAdded   = new EventEmitter<{ parentId: string; charId: string }>();
  @Output() eventInserted    = new EventEmitter<{ edgeId: string; name: string; type: 'dungeon' | 'event' | 'split' }>();
  @Output() eventAppended    = new EventEmitter<{ nodeId: string; name: string; type: 'dungeon' | 'event' | 'split' }>();
  @Output() mergeRequested   = new EventEmitter<{ parentId: string; mergeWithId: string }>();
  @Output() nodeRemoved      = new EventEmitter<string>();
  @Output() characterLeft    = new EventEmitter<{ fromNodeId: string; charId: string }>();
  @Output() characterMoved   = new EventEmitter<{ fromNodeId: string; charId: string; toNodeId: string }>();

  // ── Layout constanten ──────────────────────────────────────────────────────
  readonly NODE_WIDTH  = 190;
  readonly COL_SPACING = 420;
  readonly ROW_GAP     = 120;  // minimale ruimte tussen rijen
  readonly PADDING_X   = 80;
  readonly PADDING_TOP = 60;   // ruimte boven de eerste rij

  readonly DOTS_PER_ROW  = 6;
  readonly DOT_R         = 8;   // straal bondgenoot-dot
  readonly DOT_R_LEADER  = 10;  // straal aanvoerder-dot
  readonly DOT_GAP       = 5;
  readonly DOT_AREA_TOP  = 54;  // Y waar dots beginnen (relatief aan node top)

  // ── Pan/sleep state ───────────────────────────────────────────────────────
  panX = 40;
  panY = 40;
  isDragging = false;
  private didPan = false;
  private dragLastX = 0;
  private dragLastY = 0;

  onPanStart(event: MouseEvent): void {
    // Alleen slepen als achtergrond geklikt (niet een interactief element)
    const target = event.target as Element;
    if (target.closest('foreignObject, .picker-overlay')) return;
    this.isDragging = true;
    this.didPan     = false;
    this.dragLastX  = event.clientX;
    this.dragLastY  = event.clientY;
    event.preventDefault();
  }

  onPanMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.dragLastX;
    const dy = event.clientY - this.dragLastY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.didPan = true;
    this.panX += dx;
    this.panY += dy;
    this.dragLastX = event.clientX;
    this.dragLastY = event.clientY;
  }

  onPanEnd(): void {
    this.isDragging = false;
  }

  onCanvasClick(): void {
    if (!this.didPan) this.closeAllPickers();
  }

  // ── '+' picker state ──────────────────────────────────────────────────────
  pickerParentId: string | null = null;
  availableChars: Character[]   = [];
  mergeableGroups: StoryNode[]  = [];

  // ── Karakter-dot picker state ─────────────────────────────────────────────
  charPicker: { nodeId: string; charId: string } | null = null;
  charPickerMoveTargets: StoryNode[] = [];

  // ── Node picker: ook voor gebeurtenissen ──────────────────────────────────
  nodePickerEventType: 'dungeon' | 'event' | 'split' = 'event';

  // ── Edge gebeurtenis picker state ─────────────────────────────────────────
  edgePicker: string | null = null;  // edgeId
  edgePickerType: 'dungeon' | 'event' | 'split' = 'event';
  edgePickerName = '';

  readonly eventTypeOptions: { value: 'dungeon' | 'event' | 'split'; label: string; icon: string }[] = [
    { value: 'dungeon', label: 'Dungeon',      icon: 'fa-dungeon'           },
    { value: 'event',   label: 'Verhaaltwist', icon: 'fa-bolt-lightning'    },
    { value: 'split',   label: 'Gebeurtenis',  icon: 'fa-star'              },
  ];

  // ── SVG afmetingen ─────────────────────────────────────────────────────────
  get svgWidth(): number {
    const maxCol = this.nodes.reduce((max, n) => Math.max(max, n.col), 0);
    return Math.max(500, this.PADDING_X * 2 + (maxCol + 1) * this.COL_SPACING);
  }

  get svgHeight(): number {
    const rows = this.sortedRows;
    if (rows.length === 0) return 480;
    let h = this.PADDING_TOP;
    for (const r of rows) h += this.getRowMaxHeight(r) + this.ROW_GAP;
    return Math.max(480, h);
  }

  /** Unieke rijindexen, oplopend gesorteerd. */
  private get sortedRows(): number[] {
    return [...new Set(this.nodes.map(n => n.row))].sort((a, b) => a - b);
  }

  /** Maximale nodehoogte van alle nodes in een rij. */
  private getRowMaxHeight(row: number): number {
    const heights = this.nodes.filter(n => n.row === row).map(n => this.getNodeHeight(n));
    return heights.length > 0 ? Math.max(...heights) : 100;
  }

  /** Midden-Y van een rij, gemeten van de bovenkant van de SVG (top-down). */
  private getRowCenterY(row: number): number {
    let y = this.PADDING_TOP;
    for (const r of this.sortedRows) {
      const rh = this.getRowMaxHeight(r);
      if (r === row) return y + rh / 2;
      y += rh + this.ROW_GAP;
    }
    return y;
  }

  // ── Tekstwrap ──────────────────────────────────────────────────────────────
  /** Splits tekst in regels die passen binnen de node breedte. */
  getDescriptionLines(text: string): string[] {
    const MAX_CHARS = 27; // ~(NODE_WIDTH - 20px padding) / 5.5px per karakter
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > MAX_CHARS && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // ── Node hoogte (dynamisch op basis van tekst + groepsgrootte) ─────────────
  getNodeHeight(node: StoryNode): number {
    const descLines = this.getDescriptionLines(node.description).length;
    const dotRows   = Math.ceil(node.characters.length / this.DOTS_PER_ROW);
    const DOT_STEP  = this.DOT_R * 2 + this.DOT_GAP;
    return 30 + descLines * 14 + 10 + dotRows * DOT_STEP + 14;
  }

  // ── Positie berekeningen ───────────────────────────────────────────────────
  getNodeX(node: StoryNode): number {
    return this.PADDING_X + node.col * this.COL_SPACING;
  }

  getNodeY(node: StoryNode): number {
    return this.getRowCenterY(node.row) - this.getNodeHeight(node) / 2;
  }

  getNodeCenterX(node: StoryNode): number {
    return this.getNodeX(node) + this.NODE_WIDTH / 2;
  }

  getRowLabelY(row: number): number {
    return this.getRowCenterY(row);
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

  getDotR(index: number): number {
    return index === 0 ? this.DOT_R_LEADER : this.DOT_R;
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

    if (edge.type === 'character-move') {
      return this.getCharMovePath(from, to);
    }

    const x1 = this.getNodeCenterX(from);
    const y1 = this.getNodeY(from) + this.getNodeHeight(from);  // onderkant van 'from'
    const x2 = this.getNodeCenterX(to);
    const y2 = this.getNodeY(to);                                // bovenkant van 'to'
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }

  /** Gebogen boog tussen twee nodes op dezelfde rij — gaat omhoog tussen de kolommen. */
  private getCharMovePath(from: StoryNode, to: StoryNode): string {
    const x1 = this.getNodeCenterX(from);
    const y1 = this.getNodeY(from);
    const x2 = this.getNodeCenterX(to);
    const y2 = this.getNodeY(to);
    const arcTop = Math.min(y1, y2) - 70;
    return `M ${x1} ${y1} C ${x1} ${arcTop}, ${x2} ${arcTop}, ${x2} ${y2}`;
  }

  getEdgeColor(edge: StoryEdge): string {
    if (edge.type === 'character-move' && edge.charId) {
      return this.getCharacter(edge.charId)?.color ?? '#aaaaaa';
    }
    // Verhaalpijl: kleur van het leidende personage van de bronnode
    const from = this.nodes.find(n => n.id === edge.from);
    const leadId = from?.characters[0];
    return leadId ? (this.getCharacter(leadId)?.color ?? '#5a8aaa') : '#5a8aaa';
  }

  getEdgeDash(edge: StoryEdge): string {
    return edge.type === 'character-move' ? '4,3' : 'none';
  }

  getEdgeWidth(edge: StoryEdge): number {
    return edge.type === 'character-move' ? 1.5 : 2.5;
  }

  // ── Leaf nodes = actieve groepen (geen uitgaande verhaal-edges) ───────────
  /** Verhaal-edges: alles behalve character-move */
  private storyEdges(): StoryEdge[] {
    return this.edges.filter(e => e.type !== 'character-move');
  }

  isLeafNode(node: StoryNode): boolean {
    return !this.storyEdges().some(e => e.from === node.id);
  }

  get leafNodes(): StoryNode[] {
    return this.nodes.filter(n => this.isLeafNode(n));
  }

  // ── Picker ─────────────────────────────────────────────────────────────────
  openPicker(nodeId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.charPicker          = null;
    this.edgePicker          = null;
    this.pickerParentId      = nodeId;
    this.nodePickerEventType = 'event';

    const activeChars = new Set<string>();
    this.leafNodes.forEach(n => n.characters.forEach(c => activeChars.add(c)));
    this.availableChars  = this.characters.filter(c => !activeChars.has(c.id));
    this.mergeableGroups = this.leafNodes.filter(n => n.id !== nodeId);
  }

  confirmNodeEvent(nameInput: HTMLInputElement): void {
    if (!this.pickerParentId) return;
    this.eventAppended.emit({
      nodeId: this.pickerParentId,
      name:   nameInput.value.trim(),
      type:   this.nodePickerEventType,
    });
    this.pickerParentId = null;
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

  // ── Karakter-dot interactie ───────────────────────────────────────────────
  /** Dot is klikbaar als de groep meer dan 1 lid heeft, geen start-node is,
   *  én de node een leaf is (geen verdere verhaalstap). */
  isDotInteractive(node: StoryNode): boolean {
    return node.type !== 'start' && node.characters.length > 1 && this.isLeafNode(node);
  }

  openCharPicker(nodeId: string, charId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.pickerParentId = null; // sluit '+' picker
    this.charPicker = { nodeId, charId };
    this.charPickerMoveTargets = this.leafNodes.filter(n => n.id !== nodeId);
  }

  confirmLeave(): void {
    if (!this.charPicker) return;
    this.characterLeft.emit({ fromNodeId: this.charPicker.nodeId, charId: this.charPicker.charId });
    this.charPicker = null;
  }

  confirmMove(toNodeId: string): void {
    if (!this.charPicker) return;
    this.characterMoved.emit({ fromNodeId: this.charPicker.nodeId, charId: this.charPicker.charId, toNodeId });
    this.charPicker = null;
  }

  // ── Edge picker ────────────────────────────────────────────────────────────
  getEdgeMidX(edge: StoryEdge): number {
    const from = this.nodes.find(n => n.id === edge.from)!;
    const to   = this.nodes.find(n => n.id === edge.to)!;
    return (this.getNodeCenterX(from) + this.getNodeCenterX(to)) / 2;
  }

  getEdgeMidY(edge: StoryEdge): number {
    const from = this.nodes.find(n => n.id === edge.from)!;
    const to   = this.nodes.find(n => n.id === edge.to)!;
    return (this.getNodeY(from) + this.getNodeHeight(from) + this.getNodeY(to)) / 2;
  }

  openEdgePicker(edgeId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.pickerParentId = null;
    this.charPicker = null;
    this.edgePicker = edgeId;
    this.edgePickerName = '';
    this.edgePickerType = 'event';
  }

  confirmEvent(nameInput: HTMLInputElement): void {
    if (!this.edgePicker) return;
    this.eventInserted.emit({
      edgeId: this.edgePicker,
      name: nameInput.value.trim(),
      type: this.edgePickerType,
    });
    this.edgePicker = null;
    this.edgePickerName = '';
  }

  closeAllPickers(): void {
    this.pickerParentId = null;
    this.charPicker = null;
    this.edgePicker = null;
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