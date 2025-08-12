import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import * as L from 'leaflet';

type Severity = 'Critical' | 'Warning' | 'Info' | 'Normal';

@Component({
  selector: 'app-maps',
  standalone: false,
  templateUrl: './maps.html',
  styleUrls: ['./maps.css'],
})
export class MapsComponent implements AfterViewInit, OnDestroy {
  constructor(private theme: NbThemeService) {}

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private base?: L.TileLayer;

  devices = [
    { name: 'Tunnel-1',  lat: 41.036, lng: 29.010, severity: 'Critical' as Severity, msg: 'Overheat' },
    { name: 'Gateway-2', lat: 41.041, lng: 29.020, severity: 'Warning'  as Severity, msg: 'Packet loss' },
    { name: 'Pump-4',    lat: 41.028, lng: 29.000, severity: 'Info'     as Severity, msg: 'Maintenance due' },
    { name: 'Sensor-7',  lat: 41.032, lng: 29.030, severity: 'Normal'   as Severity, msg: 'OK' },
  ];

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true, attributionControl: false })
      .setView([41.036, 29.01], 12);

    this.applyBaseLayer(this.currentTheme());

    const group: L.Layer[] = [];
    for (const d of this.devices) {
      const icon = L.divIcon({
        className: `marker marker-${d.severity.toLowerCase()}`,
        html: `<div class="dot"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const m = L.marker([d.lat, d.lng], { icon })
        .bindPopup(
          `<b>${d.name}</b><br/><small>${d.msg}</small><br/><span class="tag tag-${d.severity.toLowerCase()}">${d.severity}</span>`
        );
      m.addTo(this.map);
      group.push(m);
    }

    const bounds = L.featureGroup(group as any).getBounds();
    if (bounds.isValid()) this.map.fitBounds(bounds.pad(0.2));

    this.theme.onThemeChange().subscribe(t => this.applyBaseLayer(t.name));
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private currentTheme(): string {
    return localStorage.getItem('theme') || 'default';
  }

  private applyBaseLayer(themeName: string) {
    const light = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const dark  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const url = themeName === 'dark' ? dark : light;

    if (this.base) this.base.removeFrom(this.map!);
    this.base = L.tileLayer(url, { maxZoom: 19 });
    this.base.addTo(this.map!);
  }
}