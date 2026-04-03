import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Character, StoryEdge, StoryNode } from '../story.types';

// ── Lane-layout hulptype ──────────────────────────────────────────────────────
/** Elke lane is een groep van nodes die in dezelfde verticale kolom thuishoren. */
interface Lane { id: number; avgCol: number; nodeIds: string[]; }

@Component({
  selector: 'app-story-canvas',
  templateUrl: './story-canvas.html',
  styleUrl: './story-canvas.css',
  standalone: true,
})
export class StoryCanvas implements OnChanges, AfterViewInit, OnDestroy {

  constructor(
    private readonly el:  ElementRef,
    private readonly zone: NgZone,
    private readonly cdr:  ChangeDetectorRef,
  ) {}

  private wheelListener!: (e: WheelEvent) => void;

  ngAfterViewInit(): void {
    // Niet-passieve wheel listener zodat preventDefault() werkt voor zoom
    this.wheelListener = (e: WheelEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      e.preventDefault();
      const host = this.el.nativeElement as HTMLElement;
      const rect = host.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      this.zone.run(() => this.applyZoom(this.zoom * factor, mx, my));
    };
    (this.el.nativeElement as HTMLElement).addEventListener('wheel', this.wheelListener, { passive: false });
  }

  ngOnDestroy(): void {
    (this.el.nativeElement as HTMLElement).removeEventListener('wheel', this.wheelListener);
  }

  /** Effectieve kolom per node-id na lane-conflict-oplossing. */
  effectiveCols: Map<string, number> = new Map();

  /** IDs van zojuist toegevoegde nodes — krijgen de verschijn-animatie. */
  newNodeIds = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] || changes['edges']) {
      this.effectiveCols = this.computeEffectiveCols();
    }
    if (!changes['nodes']) return;

    const prev: StoryNode[] = changes['nodes'].previousValue ?? [];
    const curr: StoryNode[] = changes['nodes'].currentValue ?? [];
    const added = curr.filter(n => !prev.some(p => p.id === n.id));

    // Animatie alleen voor nieuw toegevoegde nodes (niet bij laden / undo)
    if (added.length > 0 && prev.length > 0) {
      added.forEach(n => this.newNodeIds.add(n.id));
      // Verwijder na afloop animatie zodat undo/redo niet herstart
      setTimeout(() => added.forEach(n => this.newNodeIds.delete(n.id)), 2700);
    }

    // Alleen panen bij interactieve toevoeging
    if (prev.length === 0) return;
    if (added.length === 0 || added.length > 3) return;
    this.panToNode(added[added.length - 1]);
  }

  /**
   * Groepeert nodes in "lanes": nodes verbonden via story-edges met gelijke col
   * vormen één lane. Lanes worden gesorteerd op gewenste positie en minstens
   * 1 kolomunit uit elkaar geplaatst zodat ze nooit visueel overlappen.
   */
  private computeEffectiveCols(): Map<string, number> {
    const MIN_GAP = 1.0;
    const result  = new Map<string, number>(this.nodes.map(n => [n.id, n.col]));
    const storyEdges = this.edges.filter(e => e.type !== 'character-move');

    // ── Stap 1: groepeer nodes in lanes via BFS ──────────────────────────────
    const laneOf  = new Map<string, number>(); // nodeId → laneId
    const lanes   = new Map<number, Lane>();
    let   nextId  = 0;

    // Start nodes eerst zodat hun lane-id laag is (prioriteit bij sorteren)
    const ordered = [...this.nodes].sort((a, b) =>
      (a.type === 'start' ? 0 : 1) - (b.type === 'start' ? 0 : 1) || a.col - b.col
    );

    for (const node of ordered) {
      if (laneOf.has(node.id)) continue;
      const laneId = nextId++;
      const lane: Lane = { id: laneId, avgCol: 0, nodeIds: [] };
      lanes.set(laneId, lane);

      const queue = [node.id];
      while (queue.length) {
        const id = queue.shift()!;
        if (laneOf.has(id)) continue;
        laneOf.set(id, laneId);
        lane.nodeIds.push(id);

        const curr = this.nodes.find(n => n.id === id);
        if (!curr) continue;
        storyEdges
          .filter(e => e.from === id || e.to === id)
          .map(e => e.from === id ? e.to : e.from)
          .forEach(connId => {
            if (laneOf.has(connId)) return;
            const conn = this.nodes.find(n => n.id === connId);
            if (conn && Math.abs(conn.col - curr.col) < 0.001) queue.push(connId);
          });
      }
    }

    // ── Stap 2: gemiddelde col per lane ──────────────────────────────────────
    for (const [laneId, lane] of lanes) {
      const sum = lane.nodeIds.reduce((s, id) => s + (result.get(id) ?? 0), 0);
      lane.avgCol = sum / lane.nodeIds.length;
    }

    // ── Stap 3: sorteer lanes en schuif ze uit elkaar ─────────────────────────
    const sorted = [...lanes.values()].sort((a, b) => a.avgCol - b.avgCol || a.id - b.id);
    let prevEffCol = -Infinity;
    for (const lane of sorted) {
      const effCol = Math.max(lane.avgCol, prevEffCol + MIN_GAP);
      lane.nodeIds.forEach(id => result.set(id, effCol));
      prevEffCol = effCol;
    }

    return result;
  }

  private panToNode(node: StoryNode): void {
    const host = this.el.nativeElement as HTMLElement;
    const cx = host.clientWidth  / 2;
    const cy = host.clientHeight / 2;
    const targetX = cx - this.getNodeCenterX(node) * this.zoom;
    const targetY = cy - (this.getNodeY(node) + this.getNodeHeight(node) / 2) * this.zoom;
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
  @Input() nodeOverrides: Record<string, { x: number; y: number }> = {};

  @Output() encounterAdded   = new EventEmitter<{ parentId: string; charId: string }>();
  @Output() eventInserted    = new EventEmitter<{ edgeId: string; name: string; type: 'dungeon' | 'event' | 'split' }>();
  @Output() eventAppended    = new EventEmitter<{ nodeId: string; name: string; type: 'dungeon' | 'event' | 'split' }>();
  @Output() mergeRequested   = new EventEmitter<{ parentId: string; mergeWithId: string }>();
  @Output() nodeRemoved      = new EventEmitter<string>();
  @Output() characterLeft    = new EventEmitter<{ fromNodeId: string; charId: string }>();
  @Output() characterMoved   = new EventEmitter<{ fromNodeId: string; charId: string; toNodeId: string }>();
  @Output() nodePositioned   = new EventEmitter<{ nodeId: string; x: number; y: number }>();
  @Output() groupSplit       = new EventEmitter<{ fromNodeId: string; groups: string[][] }>();

  // ── Layout constanten ──────────────────────────────────────────────────────
  readonly NODE_WIDTH  = 190;
  readonly COL_SPACING = 420;
  readonly ROW_GAP     = 120;  // minimale ruimte tussen rijen
  readonly PADDING_X   = 80;
  readonly PADDING_TOP = 60;   // ruimte boven de eerste rij

  readonly DOTS_PER_ROW  = 6;
  readonly CHAR_SIZE     = 22;   // breedte/hoogte van het avatar-vierkant
  readonly CHAR_GAP      = 5;    // ruimte tussen vierkanten
  readonly CHAR_NAME_H   = 11;   // ruimte voor naam onder vierkant
  readonly JOIN_ARROW_W  = 26;   // breedte van het pijl-gebied tussen groepen

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
    if (target.closest('foreignObject, .picker-overlay, .zoom-controls')) return;
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

  // ── Zoom state ─────────────────────────────────────────────────────────────
  zoom = 1.0;
  readonly ZOOM_MIN = 0.2;
  readonly ZOOM_MAX = 3.0;

  get zoomLabel(): string {
    return Math.round(this.zoom * 100) + '%';
  }

  zoomIn(): void {
    const host = this.el.nativeElement as HTMLElement;
    this.applyZoom(this.zoom * 1.25, host.clientWidth / 2, host.clientHeight / 2);
  }

  zoomOut(): void {
    const host = this.el.nativeElement as HTMLElement;
    this.applyZoom(this.zoom / 1.25, host.clientWidth / 2, host.clientHeight / 2);
  }

  zoomReset(): void {
    const host = this.el.nativeElement as HTMLElement;
    this.applyZoom(1.0, host.clientWidth / 2, host.clientHeight / 2);
  }

  private applyZoom(newZoom: number, pivotX: number, pivotY: number): void {
    const clamped = Math.max(this.ZOOM_MIN, Math.min(this.ZOOM_MAX, newZoom));
    // Houd het punt onder de cursor (pivot) op dezelfde scherm-positie
    this.panX = pivotX - (pivotX - this.panX) * (clamped / this.zoom);
    this.panY = pivotY - (pivotY - this.panY) * (clamped / this.zoom);
    this.zoom = clamped;
  }

  onCanvasClick(): void {
    if (!this.didPan) this.closeAllPickers();
  }

  // ── Node-drag state ───────────────────────────────────────────────────────
  draggingNodeId: string | null = null;
  private dragX        = 0;
  private dragY        = 0;
  private dragOffsetX  = 0;
  private dragOffsetY  = 0;
  private didDragNode  = false;
  private boundDragMove: ((e: MouseEvent) => void) | null = null;
  private boundDragEnd:  ((e: MouseEvent) => void) | null = null;

  onNodeDragStart(node: StoryNode, event: MouseEvent): void {
    // Niet slepen via knoppen of karakter-dots
    const target = event.target as Element;
    if (target.closest('foreignObject') || target.closest('.dot-interactive')) return;
    event.stopPropagation(); // voorkom canvas-pan
    event.preventDefault();

    const svgEl  = (this.el.nativeElement as HTMLElement).querySelector('svg')!;
    const rect   = svgEl.getBoundingClientRect();
    // Cursor-positie omzetten naar wereld-coördinaten (corrigeer voor zoom)
    const cx     = (event.clientX - rect.left - this.panX) / this.zoom;
    const cy     = (event.clientY - rect.top  - this.panY) / this.zoom;

    // Huidige positie ophalen VOOR draggingNodeId wordt gezet
    // (anders leest getNodeX dragX=0 terug als initiële waarde)
    const startX = this.getNodeX(node);
    const startY = this.getNodeY(node);

    this.dragX          = startX;
    this.dragY          = startY;
    this.draggingNodeId = node.id;
    this.dragOffsetX    = cx - this.dragX;
    this.dragOffsetY    = cy - this.dragY;
    this.didDragNode    = false;

    this.boundDragMove = (e: MouseEvent) => {
      const r  = svgEl.getBoundingClientRect();
      const nx = (e.clientX - r.left - this.panX) / this.zoom - this.dragOffsetX;
      const ny = (e.clientY - r.top  - this.panY) / this.zoom - this.dragOffsetY;
      if (Math.abs(nx - this.dragX) > 2 || Math.abs(ny - this.dragY) > 2) this.didDragNode = true;
      this.dragX = nx;
      this.dragY = ny;
      this.cdr.detectChanges();
    };

    this.boundDragEnd = () => {
      if (this.didDragNode && this.draggingNodeId) {
        this.nodePositioned.emit({ nodeId: this.draggingNodeId, x: this.dragX, y: this.dragY });
      }
      this.draggingNodeId = null;
      this.didDragNode    = false;
      if (this.boundDragMove) document.removeEventListener('mousemove', this.boundDragMove);
      if (this.boundDragEnd)  document.removeEventListener('mouseup',   this.boundDragEnd);
      this.boundDragMove = null;
      this.boundDragEnd  = null;
      this.cdr.detectChanges();
    };

    document.addEventListener('mousemove', this.boundDragMove);
    document.addEventListener('mouseup',   this.boundDragEnd);
  }

  // ── Node menu state ───────────────────────────────────────────────────────
  nodeMenuId: string | null   = null;
  availableChars: Character[] = [];
  mergeableGroups: StoryNode[] = [];

  // ── Split mode state ──────────────────────────────────────────────────────
  splitMode: { nodeId: string; groups: string[][] } | null = null;
  private splitDragCharId: string | null = null;
  private splitDragFromGroup = -1;

  get splitModeNode(): StoryNode | undefined {
    return this.nodes.find(n => n.id === this.splitMode?.nodeId);
  }

  openSplitMode(): void {
    if (!this.nodeMenuId) return;
    const node = this.nodeMenuNode;
    if (!node || node.characters.length < 2) return;
    this.splitMode = {
      nodeId: this.nodeMenuId,
      groups: [[node.characters[0]], [...node.characters.slice(1)]],
    };
    this.nodeMenuId = null;
  }

  addSplitGroup(): void {
    if (!this.splitMode) return;
    this.splitMode = { ...this.splitMode, groups: [...this.splitMode.groups, []] };
  }

  removeSplitGroup(gi: number): void {
    if (!this.splitMode || this.splitMode.groups.length <= 2) return;
    if (this.splitMode.groups[gi].length > 0) return; // eerst leegmaken
    this.splitMode = { ...this.splitMode, groups: this.splitMode.groups.filter((_, i) => i !== gi) };
  }

  onSplitDragStart(charId: string, fromGroup: number): void {
    this.splitDragCharId   = charId;
    this.splitDragFromGroup = fromGroup;
  }

  onSplitDrop(toGroup: number): void {
    if (!this.splitMode || this.splitDragCharId === null || this.splitDragFromGroup === toGroup) return;
    const newGroups = this.splitMode.groups.map(g => [...g]);
    newGroups[this.splitDragFromGroup] = newGroups[this.splitDragFromGroup].filter(id => id !== this.splitDragCharId);
    newGroups[toGroup] = [...newGroups[toGroup], this.splitDragCharId!];
    this.splitMode = { ...this.splitMode, groups: newGroups };
    this.splitDragCharId    = null;
    this.splitDragFromGroup = -1;
  }

  get splitValid(): boolean {
    if (!this.splitMode) return false;
    return this.splitMode.groups.filter(g => g.length > 0).length >= 2;
  }

  confirmSplit(): void {
    if (!this.splitMode || !this.splitValid) return;
    const groups = this.splitMode.groups.filter(g => g.length > 0);
    this.groupSplit.emit({ fromNodeId: this.splitMode.nodeId, groups });
    this.splitMode = null;
  }

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
    const colXValues = this.nodes.map(n => this.getNodeX(n));
    const maxX = colXValues.length ? Math.max(...colXValues) : 0;
    return Math.max(500, maxX + this.NODE_WIDTH + this.PADDING_X);
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

  // ── Join-layout helpers ────────────────────────────────────────────────────
  /** True als de node een speciale joiner→groep weergave krijgt. */
  hasJoinLayout(node: StoryNode): boolean {
    return (node.type === 'encounter') &&
           !!node.joiners?.length &&
           node.joiners.length < node.characters.length;
  }

  getJoinerIds(node: StoryNode): string[] {
    return node.joiners ?? [];
  }

  getReceiverIds(node: StoryNode): string[] {
    const j = new Set(node.joiners ?? []);
    return node.characters.filter(id => !j.has(id));
  }

  /** Startpunt X van de complete join-rij (links uitgelijnd). */
  private joinRowStartX(node: StoryNode): number {
    const j = this.getJoinerIds(node).length;
    const r = this.getReceiverIds(node).length;
    const w = j * (this.CHAR_SIZE + this.CHAR_GAP) - this.CHAR_GAP
            + this.JOIN_ARROW_W
            + r * (this.CHAR_SIZE + this.CHAR_GAP) - this.CHAR_GAP;
    return this.NODE_WIDTH / 2 - w / 2;
  }

  /** Midden-X van een joiner-slot (0-gebaseerde index). */
  getJoinerCx(node: StoryNode, i: number): number {
    return this.joinRowStartX(node) + i * (this.CHAR_SIZE + this.CHAR_GAP) + this.CHAR_SIZE / 2;
  }

  /** Midden-X van een receiver-slot (0-gebaseerde index). */
  getReceiverCx(node: StoryNode, i: number): number {
    const jW = this.getJoinerIds(node).length * (this.CHAR_SIZE + this.CHAR_GAP) - this.CHAR_GAP;
    return this.joinRowStartX(node) + jW + this.JOIN_ARROW_W + i * (this.CHAR_SIZE + this.CHAR_GAP) + this.CHAR_SIZE / 2;
  }

  /** X-midden van de pijl tussen joiners en receivers. */
  getJoinArrowCx(node: StoryNode): number {
    const jW = this.getJoinerIds(node).length * (this.CHAR_SIZE + this.CHAR_GAP) - this.CHAR_GAP;
    return this.joinRowStartX(node) + jW + this.JOIN_ARROW_W / 2;
  }

  /** Top-Y van de join-rij. */
  getJoinRowY(node: StoryNode): number {
    return this.getNodeHeight(node) - 16 - this.CHAR_SIZE;
  }

  // ── Node hoogte (dynamisch op basis van tekst + groepsgrootte) ─────────────
  getNodeHeight(node: StoryNode): number {
    const descLines = this.getDescriptionLines(node.description).length;
    const rowStep   = this.CHAR_SIZE + this.CHAR_GAP + this.CHAR_NAME_H;
    // Join-layout gebruikt altijd 1 rij; normaal grid berekent aantal rijen
    const charRows  = this.hasJoinLayout(node)
      ? 1
      : Math.ceil(node.characters.length / this.DOTS_PER_ROW);
    return 38 + descLines * 14 + 10 + charRows * rowStep + 16;
  }

  // ── Positie berekeningen ───────────────────────────────────────────────────
  getNodeX(node: StoryNode): number {
    if (this.draggingNodeId === node.id) return this.dragX;
    const ov = this.nodeOverrides[node.id];
    if (ov !== undefined) return ov.x;
    const col = this.effectiveCols.get(node.id) ?? node.col;
    return this.PADDING_X + col * this.COL_SPACING;
  }

  getNodeY(node: StoryNode): number {
    if (this.draggingNodeId === node.id) return this.dragY;
    const ov = this.nodeOverrides[node.id];
    if (ov !== undefined) return ov.y;
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

  // ── Avatar-vierkant posities ───────────────────────────────────────────────
  /** Geeft het midden-X van het avatar-vierkant terug. */
  getDotCx(index: number, total: number): number {
    const col        = index % this.DOTS_PER_ROW;
    const rowIndex   = Math.floor(index / this.DOTS_PER_ROW);
    const totalRows  = Math.ceil(total / this.DOTS_PER_ROW);
    const charsInRow = rowIndex === totalRows - 1
      ? total - rowIndex * this.DOTS_PER_ROW
      : this.DOTS_PER_ROW;
    const rowWidth   = charsInRow * this.CHAR_SIZE + (charsInRow - 1) * this.CHAR_GAP;
    return this.NODE_WIDTH / 2 - rowWidth / 2 + this.CHAR_SIZE / 2 + col * (this.CHAR_SIZE + this.CHAR_GAP);
  }

  /** Geeft de top-Y van het avatar-vierkant terug. */
  getDotCy(index: number, total: number, node: StoryNode): number {
    const rowIndex  = Math.floor(index / this.DOTS_PER_ROW);
    const totalRows = Math.ceil(total / this.DOTS_PER_ROW);
    const h         = this.getNodeHeight(node);
    const rowStep   = this.CHAR_SIZE + this.CHAR_GAP + this.CHAR_NAME_H;
    // Rijen van onder naar boven: rij 0 = onderste rij
    return h - 16 - (totalRows - 1 - rowIndex) * rowStep - this.CHAR_SIZE;
  }

  /** Uniek id voor SVG clipPath per karakter-slot. */
  getClipId(nodeId: string, index: number): string {
    return 'ac-' + nodeId.replace(/[^a-zA-Z0-9]/g, '') + '-' + index;
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


  // ── Node menu ──────────────────────────────────────────────────────────────
  openNodeMenu(nodeId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.charPicker          = null;
    this.edgePicker          = null;
    this.splitMode           = null;
    this.nodeMenuId          = nodeId;
    this.nodePickerEventType = 'event';

    const activeChars = new Set<string>();
    this.leafNodes.forEach(n => n.characters.forEach(c => activeChars.add(c)));
    this.availableChars  = this.characters.filter(c => !activeChars.has(c.id));
    this.mergeableGroups = this.leafNodes.filter(n => n.id !== nodeId);
  }

  get nodeMenuNode(): StoryNode | undefined {
    return this.nodes.find(n => n.id === this.nodeMenuId);
  }

  deleteNodeFromMenu(): void {
    if (!this.nodeMenuId) return;
    this.nodeRemoved.emit(this.nodeMenuId);
    this.nodeMenuId = null;
  }

  confirmNodeEvent(nameInput: HTMLInputElement): void {
    if (!this.nodeMenuId) return;
    this.eventAppended.emit({
      nodeId: this.nodeMenuId,
      name:   nameInput.value.trim(),
      type:   this.nodePickerEventType,
    });
    this.nodeMenuId = null;
  }

  selectCharacter(charId: string): void {
    if (!this.nodeMenuId) return;
    this.encounterAdded.emit({ parentId: this.nodeMenuId, charId });
    this.nodeMenuId = null;
  }

  selectMerge(mergeWithId: string): void {
    if (!this.nodeMenuId) return;
    this.mergeRequested.emit({ parentId: this.nodeMenuId, mergeWithId });
    this.nodeMenuId = null;
  }

  // ── Karakter-dot interactie ───────────────────────────────────────────────
  /** Dot is klikbaar als de groep meer dan 1 lid heeft, geen start-node is,
   *  én de node een leaf is (geen verdere verhaalstap). */
  isDotInteractive(node: StoryNode): boolean {
    return node.type !== 'start' && node.characters.length > 1 && this.isLeafNode(node);
  }

  openCharPicker(nodeId: string, charId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.nodeMenuId = null;
    this.splitMode  = null;
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
    this.nodeMenuId = null;
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
    this.nodeMenuId = null;
    this.charPicker = null;
    this.edgePicker = null;
    this.splitMode  = null;
  }

  // ── Kleur hulpfuncties ─────────────────────────────────────────────────────
  getCharacter(id: string): Character | undefined {
    return this.characters.find(c => c.id === id);
  }

  getGroupLabel(node: { characters: string[] }): string {
    return node.characters.map(id => this.getCharacter(id)?.name ?? id).join(', ');
  }

  /** Beschrijving op basis van actuele karakternamen (voor auto-gegenereerde nodes). */
  getNodeDescription(node: StoryNode): string {
    const party = (ids: string[]): string => {
      const ns = ids.map(id => this.getCharacter(id)?.name ?? id);
      if (ns.length === 1) return ns[0];
      if (ns.length === 2) return `${ns[0]} en ${ns[1]}`;
      return `${ns.slice(0, -1).join(', ')} en ${ns.at(-1)}`;
    };

    switch (node.type) {
      case 'encounter': {
        const joiners   = node.joiners ?? [];
        const receivers = node.characters.filter(id => !joiners.includes(id));
        if (!joiners.length || !receivers.length) return node.description;
        if (node.label === 'Samenvoeging') {
          const verb = joiners.length === 1 ? 'sluit zich aan bij' : 'sluiten zich aan bij';
          return `${party(joiners)} ${verb} ${party(receivers)}`;
        }
        const verb = receivers.length === 1 ? 'ontmoet' : 'ontmoeten';
        return `${party(receivers)} ${verb} ${party(joiners)}`;
      }
      case 'event': {
        if (node.label === 'Vertrek' && node.joiners?.length) {
          const verb = node.joiners.length === 1 ? 'verlaat' : 'verlaten';
          return `${party(node.joiners)} ${verb} ${party(node.characters)}`;
        }
        return node.description;
      }
      default:
        return node.description;
    }
  }

  /** Kleur van de verhaallijns leidende personage — gebruikt voor node-achtergrond en -rand. */
  getNodeStoryColor(node: StoryNode): string {
    const leadId = node.characters[0];
    return leadId ? (this.getCharacter(leadId)?.color ?? '#8a7060') : '#8a7060';
  }

  getNodeTypeIcon(type: string): string {
    const map: Record<string, string> = {
      start:     'fa-flag',
      encounter: 'fa-users',
      dungeon:   'fa-dungeon',
      event:     'fa-scroll',
      split:     'fa-code-branch',
    };
    return map[type] ?? 'fa-circle';
  }

  getTypeLabelColor(type: string): string {
    const map: Record<string, string> = {
      start:     '#f5c858',
      encounter: '#c090e0',
      dungeon:   '#f0704a',
      event:     '#70c890',
      split:     '#f0a840',
    };
    return map[type] ?? '#c0966a';
  }
}