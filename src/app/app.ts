import { Component } from '@angular/core';
import { SettingsSidebar } from './settings-sidebar/settings-sidebar';
import { StoryCanvas } from './story-canvas/story-canvas';
import { Character, StoryEdge, StoryNode } from './story.types';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  imports: [SettingsSidebar, StoryCanvas],
})
export class App {
  settingsOpen = false;
  selectedStarters = new Set<string>(['jouke', 'thijs', 'ilva', 'douwe']);

  readonly characters: Character[] = [
    { id: 'jouke',    name: 'Jouke',    color: '#4fc3f7' },
    { id: 'thijs',    name: 'Thijs',    color: '#81c784' },
    { id: 'berber',   name: 'Berber',   color: '#f06292' },
    { id: 'diederik', name: 'Diederik', color: '#ffb74d' },
    { id: 'niels',    name: 'Niels',    color: '#4db6ac' },
    { id: 'dieuwke',  name: 'Dieuwke',  color: '#ce93d8' },
    { id: 'rik',      name: 'Rik',      color: '#ef5350' },
    { id: 'lisa',     name: 'Lisa',     color: '#fff176' },
    { id: 'doetie',   name: 'Doetie',   color: '#80cbc4' },
    { id: 'boyd',     name: 'Boyd',     color: '#a5d6a7' },
    { id: 'ilva',     name: 'Ilva',     color: '#ff8a65' },
    { id: 'helga',    name: 'Helga',    color: '#b39ddb' },
    { id: 'dietie',   name: 'Dietie',   color: '#80deea' },
    { id: 'janne',    name: 'Janne',    color: '#ffcc02' },
    { id: 'pascal',   name: 'Pascal',   color: '#f48fb1' },
    { id: 'douwe',    name: 'Douwe',    color: '#90caf9' },
  ];

  extraNodes: StoryNode[] = [];
  extraEdges: StoryEdge[] = [];

  toggleStarter(charId: string): void {
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

  /** Eén nieuw karakter ontmoet de groep → volledige groep + nieuw karakter. */
  onEncounterAdded(event: { parentId: string; charId: string }): void {
    const parent = this.nodes.find(n => n.id === event.parentId)!;
    const char   = this.characters.find(c => c.id === event.charId)!;

    const newChars = [...parent.characters, char.id];

    const newNode: StoryNode = {
      id: `enc-${Date.now()}`,
      characters: newChars,
      label: 'Ontmoeting',
      description: `${this.party(parent.characters)} ${this.meetVerb(parent.characters.length)} ${char.name}`,
      col: parent.col,
      row: parent.row + 1,
      type: 'encounter',
    };

    this.extraNodes = [...this.extraNodes, newNode];
    this.extraEdges = [...this.extraEdges, { id: `e-${newNode.id}`, from: event.parentId, to: newNode.id }];
  }

  /** Verwijder een node + alle opvolgers (cascade). */
  onNodeRemoved(nodeId: string): void {
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
    const node = this.nodes.find(n => n.id === event.nodeId)!;
    const insertRow = node.row + 1;

    this.extraNodes = this.extraNodes.map(n =>
      n.row >= insertRow ? { ...n, row: n.row + 1 } : n
    );

    const defaultLabels: Record<string, string> = {
      dungeon: 'Dungeon', event: 'Verhaaltwist', split: 'Gebeurtenis',
    };
    const label = event.name || defaultLabels[event.type];

    const eventNode: StoryNode = {
      id: `evt-${Date.now()}`,
      characters: [...node.characters],
      label,
      description: event.name || label,
      col: node.col,
      row: insertRow,
      type: event.type,
    };

    this.extraNodes = [...this.extraNodes, eventNode];
    this.extraEdges = [...this.extraEdges, { id: `e-${eventNode.id}`, from: event.nodeId, to: eventNode.id }];
  }

  /** Voeg een gebeurtenis-node in op een bestaande pijl. */
  onEventInserted(event: { edgeId: string; name: string; type: 'dungeon' | 'event' | 'split' }): void {
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
    const label = event.name || defaultLabels[event.type];

    const eventNode: StoryNode = {
      id: `evt-${Date.now()}`,
      characters: [...fromNode.characters],
      label,
      description: event.name || label,
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
    const fromNode  = this.nodes.find(n => n.id === fromNodeId)!;
    const remaining = fromNode.characters.filter(c => c !== charId);
    const char      = this.characters.find(c => c.id === charId)!;
    const newLeader = this.characters.find(c => c.id === remaining[0])!;

    const newNode: StoryNode = {
      id: `leave-${Date.now()}`,
      characters: remaining,
      label: 'Vertrek',
      description: `${char.name} verlaat ${this.party(remaining)}`,
      col: fromNode.col,
      row: fromNode.row + 1,
      type: 'event',
    };

    this.extraNodes = [...this.extraNodes, newNode];
    this.extraEdges = [...this.extraEdges, { id: `e-${newNode.id}`, from: fromNodeId, to: newNode.id }];
  }

  /** Karakter stapt over naar een andere groep. */
  onCharacterMoved({ fromNodeId, charId, toNodeId }: { fromNodeId: string; charId: string; toNodeId: string }): void {
    const fromNode  = this.nodes.find(n => n.id === fromNodeId)!;
    const toNode    = this.nodes.find(n => n.id === toNodeId)!;
    const char      = this.characters.find(c => c.id === charId)!;
    const remaining = fromNode.characters.filter(c => c !== charId);
    const newChars  = [...toNode.characters, charId];
    const newRow    = Math.max(fromNode.row, toNode.row) + 1;
    const fromLeader = this.characters.find(c => c.id === remaining[0])!;
    const toLeader   = this.characters.find(c => c.id === toNode.characters[0])!;

    const departNode: StoryNode = {
      id: `depart-${Date.now()}`,
      characters: remaining,
      label: 'Vertrek',
      description: `${char.name} verlaat ${this.party(remaining)}`,
      col: fromNode.col,
      row: newRow,
      type: 'event',
    };

    const arriveNode: StoryNode = {
      id: `arrive-${Date.now()}`,
      characters: newChars,
      label: 'Aankomst',
      description: `${this.party(toNode.characters)} ${this.meetVerb(toNode.characters.length)} ${char.name}`,
      col: toNode.col,
      row: newRow,
      type: 'encounter',
    };

    this.extraNodes = [...this.extraNodes, departNode, arriveNode];
    this.extraEdges = [
      ...this.extraEdges,
      { id: `e-${departNode.id}`,  from: fromNodeId,    to: departNode.id },
      { id: `e-${arriveNode.id}`,  from: toNodeId,      to: arriveNode.id },
      { id: `e-move-${Date.now()}`, from: departNode.id, to: arriveNode.id, type: 'character-move', charId },
    ];
  }

  /** Twee groepen smelten samen → gecombineerde groep. */
  onMergeRequested(event: { parentId: string; mergeWithId: string }): void {
    const a = this.nodes.find(n => n.id === event.parentId)!;
    const b = this.nodes.find(n => n.id === event.mergeWithId)!;

    const mergedChars = [...new Set([...a.characters, ...b.characters])];
    const mergedCol   = (a.col + b.col) / 2;
    const mergedRow   = Math.max(a.row, b.row) + 1;

    const leaderA = this.characters.find(c => c.id === a.characters[0])!;
    const leaderB = this.characters.find(c => c.id === b.characters[0])!;

    const newNode: StoryNode = {
      id: `merge-${Date.now()}`,
      characters: mergedChars,
      label: 'Samenvoeging',
      description: `${this.party(a.characters)} sluiten zich aaneen met ${this.party(b.characters)}`,
      col: mergedCol,
      row: mergedRow,
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