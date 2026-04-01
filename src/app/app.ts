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

  private readonly allNodes: StoryNode[] = [
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
    next.has(charId) ? next.delete(charId) : next.add(charId);
    this.selectedStarters = next;
  }

  get nodes(): StoryNode[] {
    const startNodes: StoryNode[] = [];
    let col = 0;

    for (const char of this.characters) {
      if (this.selectedStarters.has(char.id)) {
        const node = this.allNodes.find(n => n.type === 'start' && n.characters[0] === char.id);
        if (node) startNodes.push({ ...node, col: col++ });
      }
    }

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
}