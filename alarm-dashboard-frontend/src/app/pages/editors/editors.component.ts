import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-editors',
  standalone: false,
  templateUrl: './editors.html',
  styleUrls: ['./editors.css'],
})
export class EditorsComponent implements OnInit {
  note = '';
  savedAt: string | null = null;
  private storageKey = 'maintenance-note';

  ngOnInit(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.note = parsed.note || '';
      this.savedAt = parsed.savedAt || null;
    }
  }

  save() {
    const payload = { note: this.note, savedAt: new Date().toLocaleString() };
    localStorage.setItem(this.storageKey, JSON.stringify(payload));
    this.savedAt = payload.savedAt;
  }

  clear() {
    this.note = '';
  }
}