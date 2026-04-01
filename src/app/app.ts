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
  readonly SVG_WIDTH = 1120;
  readonly SVG_HEIGHT = 580;
  readonly NODE_WIDTH = 190;
  readonly NODE_HEIGHT = 80;
  readonly COL_SPACING = 250;
  readonly ROW_SPACING = 260;
  readonly PADDING_X = 75;
  readonly PADDING_BOTTOM = 55;

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

  readonly nodes: StoryNode[] = [
    // Row 0 — Startpunten
    { id: 'start-jouke', characters: ['jouke'],  label: 'Jouke',  description: 'Startpunt', col: 0, row: 0, type: 'start' },
    { id: 'start-thijs', characters: ['thijs'],  label: 'Thijs',  description: 'Startpunt', col: 1, row: 0, type: 'start' },
    { id: 'start-ilva',  characters: ['ilva'],   label: 'Ilva',   description: 'Startpunt', col: 2, row: 0, type: 'start' },
    { id: 'start-douwe', characters: ['douwe'],  label: 'Douwe',  description: 'Startpunt', col: 3, row: 0, type: 'start' },

    // Row 1 — Eerste ontmoetingen
    { id: 'enc-jouke-rik',    characters: ['jouke', 'rik'],    label: 'Ontmoeting',  description: 'Jouke vindt Rik',    col: 0, row: 1, type: 'encounter' },
    { id: 'solo-thijs',       characters: ['thijs'],           label: 'Soloreis',    description: 'Thijs trekt verder', col: 1, row: 1, type: 'event'     },
    { id: 'enc-ilva-berber',  characters: ['ilva', 'berber'],  label: 'Ontmoeting',  description: 'Ilva vindt Berber',  col: 2, row: 1, type: 'encounter' },
    { id: 'enc-douwe-pascal', characters: ['douwe', 'pascal'], label: 'Ontmoeting',  description: 'Douwe vindt Pascal', col: 3, row: 1, type: 'encounter' },
  ];

  readonly edges: StoryEdge[] = [
    { id: 'e1', from: 'start-jouke', to: 'enc-jouke-rik'    },
    { id: 'e2', from: 'start-thijs', to: 'solo-thijs'       },
    { id: 'e3', from: 'start-ilva',  to: 'enc-ilva-berber'  },
    { id: 'e4', from: 'start-douwe', to: 'enc-douwe-pascal' },
  ];

  getCharacter(id: string): Character | undefined {
    return this.characters.find(c => c.id === id);
  }

  getNodeX(node: StoryNode): number {
    return this.PADDING_X + node.col * this.COL_SPACING;
  }

  /** Row 0 = onderaan, hogere rows gaan omhoog (kleinere y in SVG). */
  getNodeY(node: StoryNode): number {
    const slotHeight = this.ROW_SPACING;
    const offsetInSlot = (slotHeight - this.NODE_HEIGHT) / 2;
    return this.SVG_HEIGHT - this.PADDING_BOTTOM - (node.row + 1) * slotHeight + offsetInSlot;
  }

  getNodeCenterX(node: StoryNode): number {
    return this.getNodeX(node) + this.NODE_WIDTH / 2;
  }

  /** Gebogen bezier-pad van bovenkant van-node naar onderkant naar-node. */
  getEdgePath(edge: StoryEdge): string {
    const from = this.nodes.find(n => n.id === edge.from)!;
    const to   = this.nodes.find(n => n.id === edge.to)!;

    const x1 = this.getNodeCenterX(from);
    const y1 = this.getNodeY(from);                      // bovenkant from-node
    const x2 = this.getNodeCenterX(to);
    const y2 = this.getNodeY(to) + this.NODE_HEIGHT - 2; // onderkant to-node

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

  /** Voor start-nodes: gebruik de kleur van het enige karakter als border. */
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

  /** Bereken x-positie voor een karakter-dot in een node (gecentreerd). */
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

  /** Label (type badge) kleur */
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