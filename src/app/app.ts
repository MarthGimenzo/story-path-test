import { Component } from '@angular/core';

export interface Character {
  id: string;
  name: string;
  color: string;
}

export interface StoryNode {
  id: string;
  characters: string[];
  label: string;
  description: string;
  col: number;
  row: number;
  type: 'start' | 'encounter' | 'dungeon' | 'event' | 'split';
}

export interface StoryEdge {
  id: string;
  from: string;
  to: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly NODE_WIDTH = 190;
  readonly NODE_HEIGHT = 80;
  readonly COL_SPACING = 250;
  readonly ROW_SPACING = 260;
  readonly PADDING_X = 75;
  readonly PADDING_BOTTOM = 55;
  readonly SVG_HEIGHT = 580;

  selectedStarters = new Set<string>(['jouke', 'thijs', 'ilva', 'douwe']);
  settingsOpen = false;

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

  private readonly allNodes: StoryNode[] = [
    // Row 0 — Startpunten (één per karakter, dynamisch in/uit)
    { id: 'start-jouke',    characters: ['jouke'],    label: 'Jouke',    description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-thijs',    characters: ['thijs'],    label: 'Thijs',    description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-berber',   characters: ['berber'],   label: 'Berber',   description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-diederik', characters: ['diederik'], label: 'Diederik', description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-niels',    characters: ['niels'],    label: 'Niels',    description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-dieuwke',  characters: ['dieuwke'],  label: 'Dieuwke',  description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-rik',      characters: ['rik'],      label: 'Rik',      description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-lisa',     characters: ['lisa'],     label: 'Lisa',     description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-doetie',   characters: ['doetie'],   label: 'Doetie',   description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-boyd',     characters: ['boyd'],     label: 'Boyd',     description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-ilva',     characters: ['ilva'],     label: 'Ilva',     description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-helga',    characters: ['helga'],    label: 'Helga',    description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-dietie',   characters: ['dietie'],   label: 'Dietie',   description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-janne',    characters: ['janne'],    label: 'Janne',    description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-pascal',   characters: ['pascal'],   label: 'Pascal',   description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-douwe',    characters: ['douwe'],    label: 'Douwe',    description: 'Startpunt', col: 0, row: 0, type: 'start' },

    // Row 1 — Eerste ontmoetingen
    { id: 'enc-jouke-rik',    characters: ['jouke', 'rik'],    label: 'Ontmoeting', description: 'Jouke vindt Rik',    col: 0, row: 1, type: 'encounter' },
    { id: 'solo-thijs',       characters: ['thijs'],           label: 'Soloreis',   description: 'Thijs trekt verder', col: 0, row: 1, type: 'event'     },
    { id: 'enc-ilva-berber',  characters: ['ilva', 'berber'],  label: 'Ontmoeting', description: 'Ilva vindt Berber',  col: 0, row: 1, type: 'encounter' },
    { id: 'enc-douwe-pascal', characters: ['douwe', 'pascal'], label: 'Ontmoeting', description: 'Douwe vindt Pascal', col: 0, row: 1, type: 'encounter' },
  ];

  private readonly allEdges: StoryEdge[] = [
    { id: 'e1', from: 'start-jouke', to: 'enc-jouke-rik'    },
    { id: 'e2', from: 'start-thijs', to: 'solo-thijs'       },
    { id: 'e3', from: 'start-ilva',  to: 'enc-ilva-berber'  },
    { id: 'e4', from: 'start-douwe', to: 'enc-douwe-pascal' },
  ];

  toggleStarter(charId: string): void {
    const next = new Set(this.selectedStarters);
    if (next.has(charId)) {
      next.delete(charId);
    } else {
      next.add(charId);
    }
    this.selectedStarters = next;
  }

  get nodes(): StoryNode[] {
    // Wijs kolommen dynamisch toe op basis van volgorde in characters[]
    const startNodes: StoryNode[] = [];
    let col = 0;

    for (const char of this.characters) {
      if (this.selectedStarters.has(char.id)) {
        const node = this.allNodes.find(n => n.type === 'start' && n.characters[0] === char.id);
        if (node) {
          startNodes.push({ ...node, col: col++ });
        }
      }
    }

    // Encounter-nodes: alleen tonen als hun start-node actief is;
    // neem de kolom over van die start-node
    const activeStartIds = new Set(startNodes.map(n => n.id));
    const encounterNodes: StoryNode[] = [];

    for (const edge of this.allEdges) {
      if (activeStartIds.has(edge.from)) {
        const encNode = this.allNodes.find(n => n.id === edge.to);
        if (encNode) {
          const parentCol = startNodes.find(n => n.id === edge.from)!.col;
          encounterNodes.push({ ...encNode, col: parentCol });
        }
      }
    }

    return [...startNodes, ...encounterNodes];
  }

  get edges(): StoryEdge[] {
    const activeIds = new Set(this.nodes.map(n => n.id));
    return this.allEdges.filter(e => activeIds.has(e.from) && activeIds.has(e.to));
  }

  get svgWidth(): number {
    return Math.max(500, this.PADDING_X * 2 + this.selectedStarters.size * this.COL_SPACING);
  }

  getRowLabelY(row: number): number {
    const node = this.nodes.find(n => n.row === row);
    return node ? this.getNodeY(node) + this.NODE_HEIGHT / 2 + 5 : -100;
  }

  getCharacter(id: string): Character | undefined {
    return this.characters.find(c => c.id === id);
  }

  getNodeX(node: StoryNode): number {
    return this.PADDING_X + node.col * this.COL_SPACING;
  }

  getNodeY(node: StoryNode): number {
    const slotHeight = this.ROW_SPACING;
    const offsetInSlot = (slotHeight - this.NODE_HEIGHT) / 2;
    return this.SVG_HEIGHT - this.PADDING_BOTTOM - (node.row + 1) * slotHeight + offsetInSlot;
  }

  getNodeCenterX(node: StoryNode): number {
    return this.getNodeX(node) + this.NODE_WIDTH / 2;
  }

  getEdgePath(edge: StoryEdge): string {
    const from = this.nodes.find(n => n.id === edge.from)!;
    const to   = this.nodes.find(n => n.id === edge.to)!;

    const x1 = this.getNodeCenterX(from);
    const y1 = this.getNodeY(from);
    const x2 = this.getNodeCenterX(to);
    const y2 = this.getNodeY(to) + this.NODE_HEIGHT - 2;

    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
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

  getDotX(index: number, total: number): number {
    const DOT_DIAMETER = 20;
    const GAP = 5;
    const totalWidth = total * DOT_DIAMETER + (total - 1) * GAP;
    const startX = this.NODE_WIDTH / 2 - totalWidth / 2 + DOT_DIAMETER / 2;
    return startX + index * (DOT_DIAMETER + GAP);
  }

  getDotY(): number {
    return this.NODE_HEIGHT - 20;
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