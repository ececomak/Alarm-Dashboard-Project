import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';

type TicketStatus = 'Scheduled' | 'Active' | 'Done' | 'Canceled';
type MaintTicket = {
  id: string;
  device: string;
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  description: string;
  assignee: string;
  startAt: string;   // ISO
  endAt: string;     // ISO
  status: TicketStatus;
  createdAt: string; // ISO
};

const NOTE_KEY = 'maintenance-note';
const TICKETS_KEY = 'maint-tickets-v1'; // Wizard ile ortak
@Component({
  selector: 'app-editors',
  standalone: false,
  templateUrl: './editors.html',
  styleUrls: ['./editors.css'],
})
export class EditorsComponent implements OnInit, OnDestroy {
  @ViewChild('ta', { static: true }) ta!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInp', { static: false }) fileInp?: ElementRef<HTMLInputElement>;

  note = '';
  savedAt: string | null = null;

  // sayaçlar
  get charCount() { return this.note.length; }
  get wordCount() { return this.note.trim() ? this.note.trim().split(/\s+/).length : 0; }
  get lineCount() { return this.note ? this.note.split(/\n/).length : 0; }

  private autosaveTimer?: any;
  private autosaveDelay = 1500; // ms

  constructor(private store: AlarmStoreService) {}

  // ---------- lifecycle ----------
  ngOnInit(): void {
    try {
      const saved = localStorage.getItem(NOTE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.note = parsed.note || '';
        this.savedAt = parsed.savedAt || null;
      }
    } catch {}
  }
  ngOnDestroy(): void {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
  }

  // ---------- autosave & manual save ----------
  onNoteChange(v: string) {
    this.note = v;
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => this.saveDraft(), this.autosaveDelay);
  }
  private saveDraft() {
    const payload = { note: this.note, savedAt: new Date().toLocaleString() };
    try { localStorage.setItem(NOTE_KEY, JSON.stringify(payload)); } catch {}
    this.savedAt = payload.savedAt;
  }
  save() { this.saveDraft(); }

  clear() {
    if (!confirm('Clear the note? This cannot be undone.')) return;
    this.note = '';
    this.saveDraft();
  }

  // ---------- keyboard shortcuts ----------
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && k === 's') { e.preventDefault(); this.save(); }
    else if (mod && k === 'b') { e.preventDefault(); this.bullet(); }
    else if (mod && e.shiftKey && k === 'c') { e.preventDefault(); this.checklist(); }
    else if (mod && k === 't') { e.preventDefault(); this.insertTimestamp(); }
  }

  // ---------- edit helpers ----------
  private insert(text: string) {
    const el = this.ta.nativeElement;
    const start = el.selectionStart ?? this.note.length;
    const end   = el.selectionEnd   ?? this.note.length;
    this.note = this.note.slice(0, start) + text + this.note.slice(end);
    // caret after insert
    setTimeout(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
    this.onNoteChange(this.note);
  }

  bullet() {
    const prefix = (this.note && !this.note.endsWith('\n')) ? '\n' : '';
    this.insert(prefix + '• ');
  }
  checklist() {
    const prefix = (this.note && !this.note.endsWith('\n')) ? '\n' : '';
    this.insert(prefix + '- [ ] ');
  }
  insertTimestamp() {
    const ts = new Date().toLocaleString();
    const prefix = (this.note && !this.note.endsWith('\n')) ? '\n' : '';
    this.insert(prefix + `@ ${ts}\n`);
  }
  clean() {
    let v = this.note;
    v = v.replace(/<[^>]+>/g, '');   // HTML kırpma
    v = v.replace(/\r\n/g, '\n');
    v = v.replace(/[ \t]+\n/g, '\n'); // satır sonu boşlukları
    v = v.replace(/\n{3,}/g, '\n\n'); // çoklu boş satır
    this.onNoteChange(v.trim());
  }

  // ---------- templates ----------
  addRcaTemplate() {
    const t =
`# RCA

**Overview**
- 

**Impact**
- 

**Root Cause**
- 

**Remediation**
- 

**Action Items**
- [ ] 
`;
    const prefix = this.note ? '\n\n' : '';
    this.insert(prefix + t);
  }
  addMaintTemplate() {
    const t =
`# Maintenance Log

**When:** ${new Date().toLocaleString()}
**Where:** 
**What:** 
**Result:** 
`;
    const prefix = this.note ? '\n\n' : '';
    this.insert(prefix + t);
  }

  // ---------- file import/export ----------
  export() {
    const blob = new Blob([this.note], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `maintenance_note_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  triggerImport() { this.fileInp?.nativeElement.click(); }
  async onImport(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    this.onNoteChange(text);
    input.value = '';
  }

  // ---------- context insertions ----------
  attachActiveTicket() {
    const t = this.getActiveTicket();
    if (!t) { alert('No active maintenance ticket window found.'); return; }
    const head =
`Ticket: ${t.id} — Status: ${t.status}
Device: ${t.device} (${t.severity})
Window: ${new Date(t.startAt).toLocaleString()} → ${new Date(t.endAt).toLocaleString()}
Assignee: ${t.assignee}
---
`;
    const prefix = this.note ? '\n\n' : '';
    this.insert(prefix + head);
  }
  private getActiveTicket(): MaintTicket | null {
    try {
      const raw = localStorage.getItem(TICKETS_KEY);
      const list: MaintTicket[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const actives = list.filter(t =>
        t.status === 'Active' &&
        new Date(t.startAt).getTime() <= now &&
        new Date(t.endAt).getTime() >= now
      );
      actives.sort((a,b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
      return actives[0] || null;
    } catch { return null; }
  }

  async insertRecent10m() {
    const rec = await firstValueFrom(this.store.recent$);
    const lines = rec.slice(0, 10).map(e => this.alarmLine(e)).join('\n');
    const prefix = this.note ? '\n' : '';
    this.insert(prefix + lines + '\n');
  }

  async insertLast60mFromBuffer() {
    const buf = await firstValueFrom(this.store.buffer$);
    const now = Date.now();
    const last60 = buf.filter(e => {
      const t = new Date(e.arrivedAt ?? e.createdAt ?? e.timestamp).getTime();
      return !isNaN(t) && now - t <= 60 * 60 * 1000;
    });
    const lines = last60.slice(0, 20).map(e => this.alarmLine(e)).join('\n');
    const prefix = this.note ? '\n' : '';
    this.insert(prefix + lines + '\n');
  }

  private alarmLine(e: AlarmEvent) {
    const t = new Date(e.arrivedAt ?? e.createdAt ?? e.timestamp);
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    const src = e.device || e.point || e.system || e.location || '—';
    const lvl = (e.level || '').toString().toUpperCase();
    return `[${hh}:${mm}] ${src} — ${lvl} — ${e.message ?? ''}`.trim();
  }
}