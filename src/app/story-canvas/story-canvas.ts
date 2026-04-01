import { Component, Input } from '@angular/core';
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

  readonly NODE_WIDTH = 190;
  readonly NODE_HEIGHT = 80;
  readonly COL_SPACING = 250;
  readonly ROW_SPACING = 260;
  readonly PADDING_X = 75;
  readonly PADDING_BOTTOM = 55;
  readonly SVG_HEIGHT = 580;

  get svgWidth(): number {
    const maxCol = this.nodes.reduce((max, n) => Math.max(max, n.col), 0);
    return Math.max(500, this.PADDING_X * 2 + (maxCol + 1) * this.COL_SPACING);
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
    const offsetInSlot = (this.ROW_SPACING - this.NODE_HEIGHT) / 2;
    return this.SVG_HEIGHT - this.PADDING_BOTTOM - (node.row + 1) * this.ROW_SPACING + offsetInSlot;
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