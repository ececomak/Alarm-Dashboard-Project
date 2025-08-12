import { Component } from '@angular/core';

type Row = {
  id: number;
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
export class TablesComponent {
  rows: Row[] = [
    { id: 101, device: 'Tunnel-1', severity: 'Critical', message: 'Overheat', time: '09:12' },
    { id: 102, device: 'Gateway-2', severity: 'Warning', message: 'Packet loss', time: '08:47' },
    { id: 103, device: 'Pump-4', severity: 'Info', message: 'Maintenance due', time: 'Yesterday' },
    { id: 104, device: 'Tunnel-3', severity: 'Warning', message: 'Voltage drop', time: '07:20' },
    { id: 105, device: 'Sensor-7', severity: 'Critical', message: 'No signal', time: '06:55' },
    { id: 106, device: 'Node-5', severity: 'Info', message: 'Rebooted', time: 'Mon' },
    { id: 107, device: 'Bridge-1', severity: 'Warning', message: 'Delay high', time: 'Sun' },
    { id: 108, device: 'Camera-9', severity: 'Info', message: 'Firmware ok', time: 'Sat' },
    { id: 109, device: 'Fan-2', severity: 'Critical', message: 'Stopped', time: 'Fri' },
    { id: 110, device: 'Valve-6', severity: 'Warning', message: 'Pressure low', time: 'Thu' },
  ];

  q = '';
  sortKey: keyof Row | '' = '';
  sortDir: 1 | -1 = 1;

  page = 1;
  pageSize = 5;

  get filtered(): Row[] {
    const q = this.q.trim().toLowerCase();
    let data = !q
      ? this.rows
      : this.rows.filter(r =>
          [r.device, r.severity, r.message, r.time, String(r.id)]
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