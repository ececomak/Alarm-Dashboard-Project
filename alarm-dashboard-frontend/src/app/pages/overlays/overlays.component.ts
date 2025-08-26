import { Component, TemplateRef, ViewChild } from '@angular/core';
import {
  NbDialogService, NbToastrService, NbGlobalPhysicalPosition, NbDialogRef
} from '@nebular/theme';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { Observable, map } from 'rxjs';
import { AlarmEvent } from '../../core/realtime/alarm-event';

const SNOOZE_KEY = 'overlay-snooze-until';          // number (ms)
const MUTES_KEY = 'overlay-muted-patterns';         // string[]
const SCHED_MUTES_KEY = 'overlay-scheduled-mutes';  // {devicePattern,startAt,endAt,ticketId}[]
const BUFFER_KEY = 'alarm-buffer-v1';

@Component({
  selector: 'app-overlays',
  standalone: false,
  templateUrl: './overlays.html',
  styleUrls: ['./overlays.css'],
})
export class OverlaysComponent {
  @ViewChild('confirmTpl', { static: true }) confirmTpl!: TemplateRef<any>;
  @ViewChild('previewTpl', { static: true }) previewTpl!: TemplateRef<any>;
  private dialogRef?: NbDialogRef<any>;

  recentCriticals$: Observable<AlarmEvent[]>;

  constructor(
    private dialog: NbDialogService,
    private toastr: NbToastrService,
    private store: AlarmStoreService,
  ) {
    this.recentCriticals$ = this.store.recent$.pipe(
      map(list => list.filter(e => (e.level ?? '').toUpperCase() === 'CRITICAL').slice(0, 12))
    );
  }

  // ---------------- Dialogs ----------------
  openConfirm() {
    const ref = this.dialog.open(this.confirmTpl, {
      closeOnBackdropClick: false,
      autoFocus: false,
    });
    ref.onClose.subscribe((ok: boolean) => {
      if (ok) this.toastr.success('Action confirmed.', 'Success');
      else this.toastr.info('Operation cancelled.', 'Cancelled');
    });
  }
  close(result?: boolean) { this.dialogRef?.close(result); }

  openPreviewCriticals() {
    this.dialog.open(this.previewTpl, { autoFocus: false });
  }

  // ---------------- Toastr demo ----------------
  showSuccess() {
    this.toastr.success('Operation completed successfully.', 'Success', {
      position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 3000,
    });
  }
  showWarning() {
    this.toastr.warning('Check configuration and try again.', 'Warning', {
      position: NbGlobalPhysicalPosition.BOTTOM_RIGHT, duration: 3500,
    });
  }
  showError() {
    this.toastr.danger('Something went wrong.', 'Error', {
      position: NbGlobalPhysicalPosition.TOP_LEFT, duration: 4000,
    });
  }

  // ---------------- Live controls ----------------
  snooze30m() {
    const until = Date.now() + 30 * 60_000;
    localStorage.setItem(SNOOZE_KEY, String(until));
    this.toastr.info(`Toasts muted until ${new Date(until).toLocaleTimeString()}`, 'Snoozed');
  }
  clearSnooze() {
    localStorage.removeItem(SNOOZE_KEY);
    this.toastr.success('Snooze cleared.', 'OK');
  }

  addMutePattern(input: HTMLInputElement) {
    const q = (input.value || '').trim().toLowerCase();
    if (!q) return;
    const list: string[] = this.read(MUTES_KEY, []);
    if (!list.includes(q)) { list.push(q); this.write(MUTES_KEY, list); }
    input.value = '';
    this.toastr.success(`Muted pattern: "${q}"`, 'Added');
  }

  // ---------------- Preview helpers ----------------
  labelFor(e: AlarmEvent): string | null {
    // 1) full snooze?
    const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || '0');
    if (Date.now() < snoozeUntil) return 'Muted (snooze)';

    // 2) ticket-based scheduled mute?
    const sched = this.read<any[]>(SCHED_MUTES_KEY, []);
    const hitSched = sched.find(x => this.inWindow(x) && this.matches(e, x.devicePattern));
    if (hitSched) return `Muted by ticket ${hitSched.ticketId}`;

    // 3) pattern mute?
    const mutes: string[] = this.read(MUTES_KEY, []);
    const hit = mutes.find(q => this.matches(e, q));
    if (hit) return 'Muted (pattern)';

    return null;
  }

  private inWindow(x: any): boolean {
    const now = Date.now();
    const s = new Date(x.startAt).getTime();
    const e = new Date(x.endAt).getTime();
    return now >= s && now <= e;
  }

  private matches(e: AlarmEvent, q: string): boolean {
    if (!q) return false;
    const blob = [
      e.system ?? '', e.device ?? '', e.point ?? '', e.location ?? '', e.message ?? ''
    ].join(' ').toLowerCase();
    return blob.includes(q.toLowerCase());
  }

  // ---------------- storage utils ----------------
  private read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : fallback;
    } catch { return fallback; }
  }
  private write(key: string, val: any) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  clearLocal() {
    try {
      localStorage.removeItem(BUFFER_KEY);
      localStorage.removeItem(SCHED_MUTES_KEY);
      this.toastr.warning('Local 35d buffer & scheduled mutes cleared.', 'Cleared', {
        position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 2500,
      });
    } catch {
      this.toastr.danger('Could not access localStorage.', 'Error');
    }
  }
}