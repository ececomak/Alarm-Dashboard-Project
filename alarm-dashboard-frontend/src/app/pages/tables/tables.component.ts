import { Component, OnInit } from '@angular/core';
import { AlarmHistoryService, AlarmRowDTO } from '../../core/realtime/alarm-history.service';

type Row = {
  idx: number;                 // görüntü için sıra no
  device: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  time: string;                // localized kısa format
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
        time: new Date(d.createdAt).toLocaleString(), // istersen pipe ile formatlayabilirsin
      }));
    });
  }

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

  get paged(): Row[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  pages(total = this.filtered.length): number[] {
    const n = Math.max(1, Math.ceil(total / this.pageSize));
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  setSort(k: keyof Row) {
    if (this.sortKey === k) this.sortDir = this.sortDir === 1 ? -1 : 1;
    else { this.sortKey = k; this.sortDir = 1; }
  }

  max(a: number, b: number) { return Math.max(a, b); }
  min(a: number, b: number) { return Math.min(a, b); }
}