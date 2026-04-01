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