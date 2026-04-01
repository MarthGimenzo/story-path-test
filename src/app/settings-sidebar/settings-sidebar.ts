import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Character } from '../story.types';

@Component({
  selector: 'app-settings-sidebar',
  templateUrl: './settings-sidebar.html',
  styleUrl: './settings-sidebar.css',
  standalone: true,
})
export class SettingsSidebar {
  @Input() characters: Character[] = [];
  @Input() selectedStarters: Set<string> = new Set();
  @Input() open = false;

  @Output() toggled = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();
}