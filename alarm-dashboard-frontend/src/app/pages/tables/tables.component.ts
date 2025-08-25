import { Component, OnInit } from '@angular/core';
import { AlarmHistoryService } from '../../core/realtime/alarm-history.service';

type Row = {
  idx: number;
  device: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  time: string;
};

@Component({
  selector: 'app-tables',
  standalone: false,
  templateUrl: './tables.html',
  styleUrls: ['./tables.css'],
})
export class TablesComponent implements OnInit {
  rows: Row[] = [];

  q = '';
  sortKey: keyof Row | '' = '';
  sortDir: 1 | -1 = 1;

  page = 1;
  pageSize = 5;

  constructor(private api: AlarmHistoryService) {}

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.api.recent(200).subscribe(list => {
      this.rows = list.map((d, i) => ({
        idx: i + 1,
        device: d.device || 'Unknown',
        severity: d.level === 'CRITICAL' ? 'Critical'
               : d.level === 'WARN'    ? 'Warning'
               : 'Info',
        message: d.message ?? '',
        time: new Date(d.createdAt).toLocaleString(),
      }));
    });
  }

  // -------- derivations --------
  get filtered(): Row[] {
    const q = this.q.trim().toLowerCase();
    let data = !q
      ? this.rows
      : this.rows.filter(r =>
          [r.device, r.severity, r.message, r.time, String(r.idx)]
            .join(' ')
            .toLowerCase()
            .includes(q)
        );

    if (this.sortKey) {
      const k = this.sortKey;
      const d = this.sortDir;
      data = [...data].sort((a, b) => (a[k] > b[k] ? d : a[k] < b[k] ? -d : 0));
    }
    return data;
  }

  get totalItems(): number {
    return this.filtered.length;
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get paged(): Row[] {
    if (this.page > this.totalPages) this.page = this.totalPages;
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  // -------- pager helpers --------
  goPrev() { if (this.page > 1) this.page--; }
  goNext() { if (this.page < this.totalPages) this.page++; }
  goto(p: number | '…') {
    if (p === '…') return;
    this.page = p;
  }

  onPageSizeChange(ps: number) {
    this.pageSize = ps;
    this.page = 1;
  }

  visiblePages(): Array<number | '…'> {
    const total = this.totalPages;
    const curr  = this.page;

    if (total <= 9) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const set = new Set<number>();
    set.add(1);
    set.add(2);
    set.add(total - 1);
    set.add(total);

    const around = 2;
    for (let p = curr - around; p <= curr + around; p++) {
      if (p >= 1 && p <= total) set.add(p);
    }

    const sorted = Array.from(set).sort((a, b) => a - b);

    const out: Array<number | '…'> = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { out.push(sorted[i]); continue; }
      const prev = sorted[i - 1];
      const cur  = sorted[i];
      if (cur - prev === 1) out.push(cur);
      else out.push('…', cur);
    }
    return out;
  }

  // -------- UI helpers --------
  setSort(k: keyof Row) {
    if (this.sortKey === k) this.sortDir = this.sortDir === 1 ? -1 : 1;
    else { this.sortKey = k; this.sortDir = 1; }
    this.page = 1;
  }

  trackByIdx(_: number, r: Row) { return r.idx; }
}