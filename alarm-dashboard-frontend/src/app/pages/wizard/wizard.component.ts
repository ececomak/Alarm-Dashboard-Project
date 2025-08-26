import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

type Sev = 'Critical' | 'Warning' | 'Info';
type TicketStatus = 'Scheduled' | 'Active' | 'Done' | 'Canceled';

type MaintTicket = {
  id: string;
  device: string;
  severity: Sev;
  title: string;
  description: string;
  assignee: string;
  startAt: string;   // ISO
  endAt: string;     // ISO
  status: TicketStatus;
  createdAt: string; // ISO
};

const TICKETS_KEY = 'maint-tickets-v1';
const SCHEDULED_MUTES_KEY = 'overlay-scheduled-mutes'; // [{devicePattern,startAt,endAt,ticketId}]

@Component({
  selector: 'app-wizard',
  standalone: false,
  templateUrl: './wizard.html',
  styleUrls: ['./wizard.css'],
})
export class WizardComponent {
  constructor(private fb: FormBuilder) {}

  // STEP 1
  deviceForm = this.fb.group({
    device: ['', [Validators.required, Validators.maxLength(40)]],
    severity: ['Critical' as Sev, Validators.required],
  });

  // STEP 2 (+ duration)
  detailForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    durationMin: [60, [Validators.required]],   // NEW: bakım süresi
  });

  // STEP 3
  confirmForm = this.fb.group({
    assignee: ['Ops Team', Validators.required],
  });

  get d() { return this.deviceForm.controls; }
  get t() { return this.detailForm.controls; }
  get c() { return this.confirmForm.controls; }

  submitted = false;
  result: MaintTicket | null = null;

  // ---- helpers (localStorage) ----
  private read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : fallback;
    } catch { return fallback; }
  }
  private write(key: string, val: any) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  private nowIso() { return new Date().toISOString(); }
  private addMinutes(d: Date, min: number) { return new Date(d.getTime() + min * 60_000); }

  finish() {
    this.submitted = true;
    if (this.deviceForm.invalid || this.detailForm.invalid || this.confirmForm.invalid) return;

    const start = new Date();
    const end = this.addMinutes(start, this.detailForm.value.durationMin || 60);

    const ticket: MaintTicket = {
      id: 'T' + Date.now().toString(36),
      device: this.deviceForm.value.device!.trim(),
      severity: this.deviceForm.value.severity as Sev,
      title: this.detailForm.value.title!.trim(),
      description: this.detailForm.value.description!.trim(),
      assignee: this.confirmForm.value.assignee!,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      status: 'Active', // now..end arası aktif
      createdAt: this.nowIso(),
    };

    // 1) ticket’ı persist et
    const list = this.read<MaintTicket[]>(TICKETS_KEY, []);
    list.unshift(ticket);
    this.write(TICKETS_KEY, list);

    // 2) scheduled mute (Overlays ile ortak)
    const mutes = this.read<any[]>(SCHEDULED_MUTES_KEY, []);
    mutes.push({
      devicePattern: ticket.device, // (substring match)
      startAt: ticket.startAt,
      endAt: ticket.endAt,
      ticketId: ticket.id,
    });
    this.write(SCHEDULED_MUTES_KEY, mutes);

    this.result = ticket;
  }

  markDone() {
    if (!this.result) return;
    this.updateTicketStatus(this.result.id, 'Done');
    this.removeScheduledMute(this.result.id);
    this.result = { ...this.result, status: 'Done' };
  }
  cancelTicket() {
    if (!this.result) return;
    this.updateTicketStatus(this.result.id, 'Canceled');
    this.removeScheduledMute(this.result.id);
    this.result = { ...this.result, status: 'Canceled' };
  }

  private updateTicketStatus(id: string, status: TicketStatus) {
    const list = this.read<MaintTicket[]>(TICKETS_KEY, []);
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], status }; this.write(TICKETS_KEY, list); }
  }
  private removeScheduledMute(ticketId: string) {
    const m = this.read<any[]>(SCHEDULED_MUTES_KEY, []);
    this.write(SCHEDULED_MUTES_KEY, m.filter(x => x.ticketId !== ticketId));
  }
}