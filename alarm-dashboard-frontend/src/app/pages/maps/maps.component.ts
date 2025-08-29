import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';

type Sev = 'CRITICAL' | 'WARN' | 'INFO';
type BubbleClass = 'critical' | 'warning' | 'info' | 'normal' | 'mixed';
type Counts = { critical: number; warn: number; info: number; total: number; lastTs?: number };
type Tunnel = { key: string; label: string; lat: number; lng: number };

@Component({
  selector: 'app-maps',
  standalone: false,
  templateUrl: './maps.html',
  styleUrls: ['./maps.css'],
})
export class MapsComponent implements AfterViewInit, OnDestroy {
  constructor(private theme: NbThemeService, private store: AlarmStoreService) {}

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private base?: L.TileLayer;
  private sub?: Subscription;

  private tunnels: Tunnel[] = [
    { key: 'Sarsap',       label: 'Sarsap Tüneli',       lat: 38.8880, lng: 37.9000 },
    { key: 'Karakısık 1',  label: 'Karakısık 1',         lat: 38.8220, lng: 37.9990 },
    { key: 'Karakısık 2',  label: 'Karakısık 2',         lat: 38.8120, lng: 38.0070 },
    { key: 'Hasan Çelebi',  label: 'Hasan Çelebi',       lat: 38.8620, lng: 37.9190 },
    { key: 'T1',           label: 'T1 Tüneli',           lat: 38.8475, lng: 37.9540 },
    { key: 'T2',           label: 'T2 Tüneli',           lat: 38.8460, lng: 37.9690 },
    { key: 'T3',           label: 'T3 Tüneli',           lat: 38.8440, lng: 37.9830 },
    { key: 'AKM',          label: 'AKM',                 lat: 38.8300, lng: 37.9400 },
  ];

  private markers = new Map<string, L.Marker>();
  private lastSeen = new Map<string, number>();

  private norm(s: unknown): string {
    let v = (s ?? '').toString().trim();
    if (!v) return '';
    v = v.toLocaleLowerCase('tr');                  
    v = v.normalize('NFD').replace(/\u0307/g, '');  
    v = v.replace(/ı/g, 'i');                        
    v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); 
    v = v.replace(/\s+/g, ' ');                     
    return v;
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true, attributionControl: false })
      .setView([38.845, 37.965], 12);

    this.applyBaseLayer(this.currentTheme());
    this.theme.onThemeChange().subscribe(t => this.applyBaseLayer(t.name));

    const group: L.Layer[] = [];
    for (const t of this.tunnels) {
      const m = L.marker([t.lat, t.lng], {
        icon: this.icon('normal', false, 0),
        zIndexOffset: 0,
      }).bindTooltip(
        this.tooltipHtml(t.label, { critical: 0, warn: 0, info: 0, total: 0 }),
        { direction: 'top', sticky: true },
      );

      m.addTo(this.map!);
      this.markers.set(this.norm(t.key), m);   
      group.push(m);
    }
    const bounds = L.featureGroup(group as any).getBounds();
    if (bounds.isValid()) this.map.fitBounds(bounds.pad(0.2));

    this.sub = this.store.recent$.subscribe(recent => this.render(recent));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.map?.remove();
  }

  private render(recent: AlarmEvent[]) {
    const now = Date.now();
    const counts = new Map<string, Counts>();

    for (const e of recent) {
      const locKey = this.norm(e.location);   
      if (!locKey) continue;
      const ts = this.getMs(e);

      const bucket = counts.get(locKey) ?? { critical: 0, warn: 0, info: 0, total: 0, lastTs: 0 };
      const lvl = (e.level ?? '').toString().toUpperCase() as Sev;

      if (lvl === 'CRITICAL') bucket.critical++;
      else if (lvl === 'WARN') bucket.warn++;
      else bucket.info++;

      bucket.total++;
      bucket.lastTs = Math.max(bucket.lastTs ?? 0, ts);
      counts.set(locKey, bucket);
    }

    for (const t of this.tunnels) {
      const key = this.norm(t.key);           
      const m = this.markers.get(key)!;

      const c: Counts = counts.get(key) ?? { critical: 0, warn: 0, info: 0, total: 0, lastTs: 0 };
      const bubbleClass = this.pickClass(c.critical, c.warn, c.info);

      const prev = this.lastSeen.get(key) ?? 0;
      const isFresh = (c.lastTs ?? 0) > prev && now - (c.lastTs ?? 0) < 60_000;
      if ((c.lastTs ?? 0) > 0) this.lastSeen.set(key, c.lastTs!);

      m.setIcon(this.icon(bubbleClass, isFresh, c.total, c));
      m.setTooltipContent(this.tooltipHtml(t.label, c));
      m.setZIndexOffset(c.total > 0 ? 1500 : 0);
    }
  }

  private pickClass(crit: number, warn: number, info: number): BubbleClass {
    const nonZero = [crit > 0, warn > 0, info > 0].filter(Boolean).length;
    if (nonZero > 1) return 'mixed';
    if (crit > 0) return 'critical';
    if (warn > 0) return 'warning';
    if (info > 0) return 'info';
    return 'normal';
  }

  private tooltipHtml(title: string, c: { critical: number; warn: number; info: number; total: number }) {
    return `
      <div><b>${title}</b></div>
      <div style="font-size:12px;opacity:.8">Last 10 min</div>
      <div style="font-size:12px;margin-top:2px">
        Critical: <b>${c.critical}</b> &nbsp;|&nbsp;
        Warn: <b>${c.warn}</b> &nbsp;|&nbsp;
        Info: <b>${c.info}</b> &nbsp;|&nbsp;
        Total: <b>${c.total}</b>
      </div>
    `;
  }

  private icon(cls: BubbleClass, pulse: boolean, total: number, c?: Counts): L.DivIcon {
    const count = Number.isFinite(total) ? total : 0;
    const style = cls === 'mixed' && c ? this.mixStyle(c) : '';
    return L.divIcon({
      className: 'marker',
      html: `<div class="blip ${cls}${pulse ? ' pulse' : ''}" style="${style}"><span>${count}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  private mixStyle(c: Counts): string {
    const total = Math.max(1, c.critical + c.warn + c.info);
    const slices: Array<[number, string]> = [];
    if (c.critical > 0) slices.push([c.critical / total, '#ef3b2d']);
    if (c.warn     > 0) slices.push([c.warn     / total, '#f7b928']);
    if (c.info     > 0) slices.push([c.info     / total, '#3da5ff']);

    let acc = 0;
    const stops: string[] = [];
    for (const [ratio, color] of slices) {
      const from = acc * 100;
      acc += ratio;
      const to = acc * 100;
      stops.push(`${color} ${from.toFixed(1)}% ${to.toFixed(1)}%`);
    }
    return `background: conic-gradient(${stops.join(', ')});`;
  }

  private getMs(e: AlarmEvent): number {
    return new Date(e.arrivedAt ?? e.createdAt ?? e.timestamp ?? Date.now()).getTime();
  }

  private currentTheme(): string { return localStorage.getItem('theme') || 'default'; }

  private applyBaseLayer(themeName: string) {
    const light = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const dark  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const url = themeName === 'dark' ? dark : light;
    if (this.base) this.base.removeFrom(this.map!);
    this.base = L.tileLayer(url, { maxZoom: 19 });
    this.base.addTo(this.map!);
  }
}