import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CharacterPanel } from './character-panel/character-panel';
import { CharacterSheet } from './character-panel/character-sheet';
import { ElementDef } from './elements';
import { ElementsPanel } from './elements-panel/elements-panel';
import { SettingsSidebar } from './settings-sidebar/settings-sidebar';
import { StoryCanvas } from './story-canvas/story-canvas';
import { Chapter, Character, StoryEdge, StoryNode } from './story.types';
import { WeaponDef } from './weapons';
import { WeaponsPanel } from './weapons-panel/weapons-panel';

type NodeOverrides = Record<string, { x: number; y: number }>;

interface Snapshot {
  starters:    string[];
  nodes:       StoryNode[];
  edges:       StoryEdge[];
  overrides:   NodeOverrides;
}

interface ProjectData extends Snapshot {
  characters:     Character[];
  chapters:       Chapter[];
  customElements?: ElementDef[];
  customWeapons?:  WeaponDef[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  imports: [SettingsSidebar, StoryCanvas, CharacterPanel, CharacterSheet, ElementsPanel, WeaponsPanel, FormsModule],
})
export class App implements OnInit {
  settingsOpen    = false;
  charactersOpen  = false;
  elementsOpen    = false;
  weaponsOpen     = false;
  editingCharacter: Character | null = null;
  customElements: ElementDef[] = [];
  customWeapons: WeaponDef[] = [];
  nodeOverrides: NodeOverrides = {};
  selectedStarters = new Set<string>();
  characters: Character[] = [];
  chapters: Chapter[] = [{ label: 'Begin', height: 220 }];

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  private history: Snapshot[] = [];
  private future:  Snapshot[] = [];
  private readonly MAX_HISTORY = 20;

  get canUndo(): boolean { return this.history.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }

  private snapshot(): void {
    this.history = [
      ...this.history.slice(-(this.MAX_HISTORY - 1)),
      { starters: [...this.selectedStarters], nodes: [...this.extraNodes], edges: [...this.extraEdges], overrides: { ...this.nodeOverrides } },
    ];
    this.future = [];
  }

  undo(): void {
    const prev = this.history.pop();
    if (!prev) return;
    this.future = [
      ...this.future.slice(-(this.MAX_HISTORY - 1)),
      { starters: [...this.selectedStarters], nodes: [...this.extraNodes], edges: [...this.extraEdges], overrides: { ...this.nodeOverrides } },
    ];
    this.selectedStarters = new Set(prev.starters);
    this.extraNodes  = prev.nodes;
    this.extraEdges  = prev.edges;
    this.nodeOverrides = prev.overrides ?? {};
  }

  redo(): void {
    const next = this.future.pop();
    if (!next) return;
    this.history = [
      ...this.history.slice(-(this.MAX_HISTORY - 1)),
      { starters: [...this.selectedStarters], nodes: [...this.extraNodes], edges: [...this.extraEdges], overrides: { ...this.nodeOverrides } },
    ];
    this.selectedStarters = new Set(next.starters);
    this.extraNodes  = next.nodes;
    this.extraEdges  = next.edges;
    this.nodeOverrides = next.overrides ?? {};
  }

  // ── Projectbeheer (localStorage) ─────────────────────────────────────────
  private readonly PROJECTS_KEY = 'story-path-projects';
  private readonly CURRENT_KEY  = 'story-path-current';

  currentProject = 'Mijn verhaal';
  projectsOpen   = false;
  projectList: string[] = [];
  saveLabel = 'Opslaan';
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private getAllProjects(): Record<string, ProjectData> {
    try { return JSON.parse(localStorage.getItem(this.PROJECTS_KEY) ?? '{}'); }
    catch { return {}; }
  }

  private refreshProjectList(): void {
    this.projectList = Object.keys(this.getAllProjects());
  }

  ngOnInit(): void {
    // Migreer oud enkelvoudig opslagformaat
    const legacy = localStorage.getItem('story-path-save');
    if (legacy) {
      try {
        const d = JSON.parse(legacy) as Snapshot;
        if (Array.isArray(d.starters)) {
          const all = this.getAllProjects();
          all['Mijn verhaal'] = { ...d, characters: [], chapters: [{ label: 'Begin', height: 220 }] };
          localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(all));
          localStorage.removeItem('story-path-save');
        }
      } catch {}
    }

    const all  = this.getAllProjects();
    const last = localStorage.getItem(this.CURRENT_KEY);
    const name = (last && all[last]) ? last : Object.keys(all)[0];
    if (name && all[name]) {
      this.currentProject = name;
      const snap = all[name];
      this.characters      = snap.characters ?? [];
      this.chapters        = snap.chapters ?? [{ label: 'Begin', height: 220 }];
      this.customElements  = snap.customElements ?? [];
      this.customWeapons   = snap.customWeapons ?? [];
      this.selectedStarters = new Set(snap.starters ?? []);
      this.extraNodes    = snap.nodes ?? [];
      this.extraEdges    = snap.edges ?? [];
      this.nodeOverrides = snap.overrides ?? {};
    }
    this.refreshProjectList();
  }

  save(): void {
    const all = this.getAllProjects();
    all[this.currentProject] = {
      characters:     this.characters,
      chapters:       this.chapters,
      customElements: this.customElements,
      customWeapons:  this.customWeapons,
      starters:       [...this.selectedStarters],
      nodes:          this.extraNodes,
      edges:          this.extraEdges,
      overrides:      this.nodeOverrides,
    };
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(all));
    localStorage.setItem(this.CURRENT_KEY, this.currentProject);
    this.refreshProjectList();
    this.saveLabel = 'Opgeslagen!';
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveLabel = 'Opslaan', 2000);
  }

  loadProject(name: string): void {
    const snap = this.getAllProjects()[name];
    if (!snap) return;
    this.currentProject   = name;
    this.characters       = snap.characters ?? [];
    this.chapters         = snap.chapters ?? [{ label: 'Begin', height: 220 }];
    this.customElements   = snap.customElements ?? [];
    this.customWeapons    = snap.customWeapons ?? [];
    this.selectedStarters = new Set(snap.starters ?? []);
    this.extraNodes       = snap.nodes ?? [];
    this.extraEdges       = snap.edges ?? [];
    this.nodeOverrides    = snap.overrides ?? {};
    this.history = [];
    this.future  = [];
    localStorage.setItem(this.CURRENT_KEY, name);
    this.projectsOpen = false;
  }

  deleteProject(name: string, event: MouseEvent): void {
    event.stopPropagation();
    const all = this.getAllProjects();
    delete all[name];
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(all));
    this.refreshProjectList();
    if (this.currentProject === name) {
      const remaining = Object.keys(all);
      if (remaining.length > 0) this.loadProject(remaining[0]);
      else this.newProject();
    }
  }

  newProject(): void {
    this.currentProject   = 'Nieuw verhaal';
    this.characters       = [];
    this.chapters         = [{ label: 'Begin', height: 220 }];
    this.customElements   = [];
    this.customWeapons    = [];
    this.selectedStarters = new Set();
    this.extraNodes       = [];
    this.extraEdges       = [];
    this.nodeOverrides    = {};
    this.history          = [];
    this.future           = [];
    this.projectsOpen     = false;
  }

  onCharactersChanged(chars: Character[]): void {
    this.characters = chars;
    // Verwijder starters die niet meer bestaan
    this.selectedStarters = new Set(
      [...this.selectedStarters].filter(id => chars.some(c => c.id === id))
    );
  }

  onEditCharacter(char: Character): void {
    this.editingCharacter = char;
  }

  onCharacterSheetSaved(updated: Character): void {
    this.characters = this.characters.map(c => c.id === updated.id ? updated : c);
    this.editingCharacter = null;
  }

  onCharacterSheetClosed(): void {
    this.editingCharacter = null;
  }

  onCustomElementsChanged(elements: ElementDef[]): void {
    this.customElements = elements;
  }

  onCustomWeaponsChanged(weapons: WeaponDef[]): void {
    this.customWeapons = weapons;
  }

  onChaptersChanged(chapters: Chapter[]): void {
    this.chapters = chapters;
  }

  onNodePositioned(event: { nodeId: string; x: number; y: number }): void {
    this.snapshot();
    this.nodeOverrides = { ...this.nodeOverrides, [event.nodeId]: { x: event.x, y: event.y } };
  }


  extraNodes: StoryNode[] = [];
  extraEdges: StoryEdge[] = [];

  toggleStarter(charId: string): void {
    this.snapshot();
    const next = new Set(this.selectedStarters);
    if (next.has(charId)) {
      next.delete(charId);
      // Ruim alle afstammende nodes op van dit startpunt
      this.onNodeRemoved(`start-${charId}`);
    } else {
      next.add(charId);
    }
    this.selectedStarters = next;
  }

  get startNodes(): StoryNode[] {
    const result: StoryNode[] = [];
    let col = 0;
    for (const char of this.characters) {
      if (this.selectedStarters.has(char.id)) {
        result.push({
          id: `start-${char.id}`,
          characters: [char.id],
          label: char.name,
          description: 'Solo · 0 bondgenoten',
          col: col++,
          row: 0,
          type: 'start',
        });
      }
    }
    return result;
  }

  get nodes(): StoryNode[] {
    return [...this.startNodes, ...this.extraNodes];
  }

  get edges(): StoryEdge[] {
    return [...this.extraEdges];
  }

  // ── Vertelende beschrijvingen ─────────────────────────────────────────────

  /** "Jouke", "Jouke en Rik", "Jouke, Rik en Thijs" */
  private party(charIds: string[]): string {
    const names = charIds.map(id => this.characters.find(c => c.id === id)?.name ?? id);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} en ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} en ${names.at(-1)}`;
  }

  /** "ontmoet" (enkelvoud) of "ontmoeten" (meervoud) */
  private meetVerb(count: number): string {
    return count === 1 ? 'ontmoet' : 'ontmoeten';
  }

  /** "sluit zich aan bij" (enkelvoud) of "sluiten zich aan bij" (meervoud) */
  private joinVerb(count: number): string {
    return count === 1 ? 'sluit zich aan bij' : 'sluiten zich aan bij';
  }

  /** Eén nieuw karakter ontmoet de groep → volledige groep + nieuw karakter. */
  onEncounterAdded(event: { parentId: string; charId: string }): void {
    this.snapshot();
    const parent    = this.nodes.find(n => n.id === event.parentId)!;
    const char      = this.characters.find(c => c.id === event.charId)!;
    const insertRow = parent.row + 1;

    this.extraNodes = this.extraNodes.map(n =>
      n.row >= insertRow ? { ...n, row: n.row + 1 } : n
    );

    const newNode: StoryNode = {
      id: `enc-${Date.now()}`,
      characters: [...parent.characters, char.id],
      joiners: [char.id],
      label: 'Ontmoeting',
      description: `${this.party(parent.characters)} ${this.meetVerb(parent.characters.length)} ${char.name}`,
      col: parent.col,
      row: insertRow,
      type: 'encounter',
    };

    this.extraNodes = [...this.extraNodes, newNode];
    this.extraEdges = [...this.extraEdges, { id: `e-${newNode.id}`, from: event.parentId, to: newNode.id }];
  }

  /** Verwijder een node + alle opvolgers (cascade). */
  onNodeRemoved(nodeId: string): void {
    this.snapshot();
    const toRemove = new Set<string>();
    const queue = [nodeId];
    while (queue.length) {
      const current = queue.shift()!;
      toRemove.add(current);
      this.extraEdges.filter(e => e.from === current).forEach(e => queue.push(e.to));
    }
    this.extraNodes = this.extraNodes.filter(n => !toRemove.has(n.id));
    this.extraEdges = this.extraEdges.filter(e => !toRemove.has(e.from) && !toRemove.has(e.to));
  }

  /** Voeg een gebeurtenis-node toe als volgende stap na een leaf node. */
  onEventAppended(event: { nodeId: string; name: string; type: 'dungeon' | 'event' | 'split' }): void {
    this.snapshot();
    const node = this.nodes.find(n => n.id === event.nodeId)!;
    const insertRow = node.row + 1;

    this.extraNodes = this.extraNodes.map(n =>
      n.row >= insertRow ? { ...n, row: n.row + 1 } : n
    );

    const defaultLabels: Record<string, string> = {
      dungeon: 'Dungeon', event: 'Verhaaltwist', split: 'Gebeurtenis',
    };
    const label = defaultLabels[event.type];

    const eventNode: StoryNode = {
      id: `evt-${Date.now()}`,
      characters: [...node.characters],
      label,
      description: event.name,
      col: node.col,
      row: insertRow,
      type: event.type,
    };

    this.extraNodes = [...this.extraNodes, eventNode];
    this.extraEdges = [...this.extraEdges, { id: `e-${eventNode.id}`, from: event.nodeId, to: eventNode.id }];
  }

  /** Voeg een gebeurtenis-node in op een bestaande pijl. */
  onEventInserted(event: { edgeId: string; name: string; type: 'dungeon' | 'event' | 'split' }): void {
    this.snapshot();
    const edge = this.extraEdges.find(e => e.id === event.edgeId);
    if (!edge) return;

    const fromNode = this.nodes.find(n => n.id === edge.from)!;

    const insertRow = fromNode.row + 1;

    // Schuif alle nodes vanaf insertRow één rij omhoog zodat er ruimte ontstaat
    this.extraNodes = this.extraNodes.map(n =>
      n.row >= insertRow ? { ...n, row: n.row + 1 } : n
    );

    const defaultLabels: Record<string, string> = {
      dungeon: 'Dungeon',
      event:   'Verhaaltwist',
      split:   'Gebeurtenis',
    };
    const label = defaultLabels[event.type];

    const eventNode: StoryNode = {
      id: `evt-${Date.now()}`,
      characters: [...fromNode.characters],
      label,
      description: event.name,
      col: fromNode.col,
      row: insertRow,
      type: event.type,
    };

    this.extraEdges = this.extraEdges.filter(e => e.id !== event.edgeId);
    this.extraNodes = [...this.extraNodes, eventNode];
    this.extraEdges = [
      ...this.extraEdges,
      { id: `e-${eventNode.id}-in`,  from: edge.from,    to: eventNode.id },
      { id: `e-${eventNode.id}-out`, from: eventNode.id, to: edge.to      },
    ];
  }

  /** Karakter verlaat groep → groep gaat verder zonder hem/haar. */
  onCharacterLeft({ fromNodeId, charId }: { fromNodeId: string; charId: string }): void {
    this.snapshot();
    const fromNode  = this.nodes.find(n => n.id === fromNodeId)!;
    const remaining = fromNode.characters.filter(c => c !== charId);
    const char      = this.characters.find(c => c.id === charId)!;
    const insertRow = fromNode.row + 1;

    this.extraNodes = this.extraNodes.map(n =>
      n.row >= insertRow ? { ...n, row: n.row + 1 } : n
    );

    const newNode: StoryNode = {
      id: `leave-${Date.now()}`,
      characters: remaining,
      joiners: [charId],
      label: 'Vertrek',
      description: `${char.name} verlaat ${this.party(remaining)}`,
      col: fromNode.col,
      row: insertRow,
      type: 'event',
    };

    this.extraNodes = [...this.extraNodes, newNode];
    this.extraEdges = [...this.extraEdges, { id: `e-${newNode.id}`, from: fromNodeId, to: newNode.id }];
  }

  /** Karakter stapt over naar een andere groep. */
  onCharacterMoved({ fromNodeId, charId, toNodeId }: { fromNodeId: string; charId: string; toNodeId: string }): void {
    this.snapshot();
    const fromNode  = this.nodes.find(n => n.id === fromNodeId)!;
    const toNode    = this.nodes.find(n => n.id === toNodeId)!;
    const char      = this.characters.find(c => c.id === charId)!;
    const remaining = fromNode.characters.filter(c => c !== charId);
    const newChars  = [...toNode.characters, charId];
    const insertRow = Math.max(fromNode.row, toNode.row) + 1;

    this.extraNodes = this.extraNodes.map(n =>
      n.row >= insertRow ? { ...n, row: n.row + 1 } : n
    );

    const ts = Date.now();
    const departNode: StoryNode = {
      id: `depart-${ts}`,
      characters: remaining,
      joiners: [charId],
      label: 'Vertrek',
      description: `${char.name} verlaat ${this.party(remaining)}`,
      col: fromNode.col,
      row: insertRow,
      type: 'event',
    };

    const arriveNode: StoryNode = {
      id: `arrive-${ts}`,
      characters: newChars,
      joiners: [charId],
      label: 'Aankomst',
      description: `${this.party(toNode.characters)} ${this.meetVerb(toNode.characters.length)} ${char.name}`,
      col: toNode.col,
      row: insertRow,
      type: 'encounter',
    };

    this.extraNodes = [...this.extraNodes, departNode, arriveNode];
    this.extraEdges = [
      ...this.extraEdges,
      { id: `e-${departNode.id}`,  from: fromNodeId,    to: departNode.id },
      { id: `e-${arriveNode.id}`,  from: toNodeId,      to: arriveNode.id },
      { id: `e-move-${ts}`,        from: departNode.id, to: arriveNode.id, type: 'character-move', charId },
    ];
  }

  /** Groep splitst op in meerdere subgroepen die elk verder gaan. */
  onGroupSplit(event: { fromNodeId: string; groups: string[][] }): void {
    this.snapshot();
    const fromNode    = this.nodes.find(n => n.id === event.fromNodeId)!;
    const validGroups = event.groups.filter(g => g.length > 0);
    const insertRow   = fromNode.row + 1;

    this.extraNodes = this.extraNodes.map(n =>
      n.row >= insertRow ? { ...n, row: n.row + 1 } : n
    );

    const ts       = Date.now();
    const spread   = (validGroups.length - 1) * 0.45;
    const startCol = fromNode.col - spread / 2;

    for (let i = 0; i < validGroups.length; i++) {
      const group = validGroups[i];
      const col   = startCol + i * (spread / Math.max(validGroups.length - 1, 1));

      const splitNode: StoryNode = {
        id:          `split-${ts}-${i}`,
        characters:  group,
        label:       'Opsplitsing',
        description: group.length === 1 ? 'Gaat alleen verder' : 'Gaan samen verder',
        col,
        row:         insertRow,
        type:        'split',
      };

      this.extraNodes = [...this.extraNodes, splitNode];
      this.extraEdges = [...this.extraEdges, {
        id:   `e-split-${ts}-${i}`,
        from: event.fromNodeId,
        to:   splitNode.id,
      }];
    }
  }

  /** Twee groepen smelten samen → gecombineerde groep. */
  onMergeRequested(event: { parentId: string; mergeWithId: string }): void {
    this.snapshot();
    const a = this.nodes.find(n => n.id === event.parentId)!;
    const b = this.nodes.find(n => n.id === event.mergeWithId)!;

    const mergedChars = [...new Set([...a.characters, ...b.characters])];
    const mergedCol   = (a.col + b.col) / 2;
    const insertRow   = Math.max(a.row, b.row) + 1;

    this.extraNodes = this.extraNodes.map(n =>
      n.row >= insertRow ? { ...n, row: n.row + 1 } : n
    );

    const newNode: StoryNode = {
      id: `merge-${Date.now()}`,
      characters: mergedChars,
      joiners: a.characters,
      label: 'Samenvoeging',
      description: `${this.party(a.characters)} ${this.joinVerb(a.characters.length)} ${this.party(b.characters)}`,
      col: mergedCol,
      row: insertRow,
      type: 'encounter',
    };

    this.extraNodes = [...this.extraNodes, newNode];
    this.extraEdges = [
      ...this.extraEdges,
      { id: `e-a-${newNode.id}`, from: event.parentId,   to: newNode.id },
      { id: `e-b-${newNode.id}`, from: event.mergeWithId, to: newNode.id },
    ];
  }
}