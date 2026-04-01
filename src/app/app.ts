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
    next.has(charId) ? next.delete(charId) : next.add(charId);
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
          description: 'Startpunt',
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

  /** Eén nieuw karakter ontmoet de groep → volledige groep + nieuw karakter. */
  onEncounterAdded(event: { parentId: string; charId: string }): void {
    const parent = this.nodes.find(n => n.id === event.parentId)!;
    const char   = this.characters.find(c => c.id === event.charId)!;

    const newNode: StoryNode = {
      id: `enc-${Date.now()}`,
      characters: [...parent.characters, char.id],
      label: 'Ontmoeting',
      description: `${char.name} sluit aan`,
      col: parent.col,
      row: parent.row + 1,
      type: 'encounter',
    };

    this.extraNodes = [...this.extraNodes, newNode];
    this.extraEdges = [...this.extraEdges, { id: `e-${newNode.id}`, from: event.parentId, to: newNode.id }];
  }

  /** Twee groepen smelten samen → gecombineerde groep. */
  onMergeRequested(event: { parentId: string; mergeWithId: string }): void {
    const a = this.nodes.find(n => n.id === event.parentId)!;
    const b = this.nodes.find(n => n.id === event.mergeWithId)!;

    const mergedChars = [...new Set([...a.characters, ...b.characters])];
    const mergedCol   = (a.col + b.col) / 2;
    const mergedRow   = Math.max(a.row, b.row) + 1;

    const newNode: StoryNode = {
      id: `merge-${Date.now()}`,
      characters: mergedChars,
      label: 'Samenvoeging',
      description: 'Groepen komen samen',
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