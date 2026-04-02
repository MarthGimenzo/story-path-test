export interface Character {
  id: string;
  name: string;
  color: string;
  avatar?: string;       // base64 data-URL
  description?: string;
}

export interface StoryNode {
  id: string;
  characters: string[];
  label: string;
  description: string;
  col: number;
  row: number;
  type: 'start' | 'encounter' | 'dungeon' | 'event' | 'split';
  /** IDs van de karakters die zich aansluiten bij de bestaande groep (voor visuele pijl). */
  joiners?: string[];
}

export interface StoryEdge {
  id: string;
  from: string;
  to: string;
  type?: 'story' | 'character-move';
  charId?: string;  // alleen bij type='character-move'
}