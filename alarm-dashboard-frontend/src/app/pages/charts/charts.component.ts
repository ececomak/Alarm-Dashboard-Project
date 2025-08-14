import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as echarts from 'echarts';
import { Subscription, combineLatest } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';

@Component({
  selector: 'app-charts',
  standalone: false,
  templateUrl: './charts.html',
  styleUrls: ['./charts.css'],
})
export class ChartsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('areaEl',     { static: true }) areaEl!: ElementRef<HTMLDivElement>;
  @ViewChild('roseEl',     { static: true }) roseEl!: ElementRef<HTMLDivElement>;
  @ViewChild('calendarEl', { static: true }) calendarEl!: ElementRef<HTMLDivElement>;
  @ViewChild('radarEl',    { static: true }) radarEl!: ElementRef<HTMLDivElement>;

  private charts: echarts.ECharts[] = [];
  private subs: Subscription[] = [];

  constructor(private store: AlarmStoreService) {}

  ngAfterViewInit(): void {
    // 1) Traffic (Stacked Area) — 12h by severity
    const area = echarts.init(this.areaEl.nativeElement);
    area.setOption({
      tooltip: { trigger: 'axis' },
      legend: { top: 0, data: ['Critical','Warnings','Info'] },
      grid: { left: 28, right: 12, top: 40, bottom: 24 },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [
        { name:'Critical', type:'line', stack:'total', areaStyle:{}, smooth:true, data: [] },
        { name:'Warnings', type:'line', stack:'total', areaStyle:{}, smooth:true, data: [] },
        { name:'Info',     type:'line', stack:'total', areaStyle:{}, smooth:true, data: [] },
      ],
    });

    this.subs.push(
      this.store.hourly12BySeverity$.subscribe(({ labels, critical, warn, info }) => {
        area.setOption({
          xAxis: { data: labels },
          series: [
            { name:'Critical', data: critical },
            { name:'Warnings', data: warn },
            { name:'Info',     data: info },
          ],
        });
      })
    );

    // 2) Rose / Donut Pie — SON 1 SAAT kategori
    const rose = echarts.init(this.roseEl.nativeElement);
    rose.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        name: 'Categories',
        type: 'pie',
        roseType: 'area',
        radius: ['30%','70%'],
        data: [],
      }],
    });
    this.subs.push(
      this.store.byCategory1h$.subscribe(data => {
        rose.setOption({ series: [{ data }] });
      })
    );

    // 3) Calendar Heatmap — bu ay
    const calendar = echarts.init(this.calendarEl.nativeElement);
    calendar.setOption({
      tooltip: { position: 'top' },
      visualMap: { min: 0, max: 50, orient: 'horizontal', left: 'center', bottom: 0 },
      calendar: {
        top: 20, left: 20, right: 20,
        cellSize: [20, 18],
        range: `${new Date().getFullYear()}-${(new Date().getMonth()+1).toString().padStart(2,'0')}`,
        splitLine: { show: true },
        itemStyle: { borderWidth: 0.5 },
      },
      series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: [] }],
    });
    this.subs.push(
      this.store.calendarMonth$.subscribe(data => {
        calendar.setOption({ series: [{ data }] });
      })
    );

    // 4) Radar — son 10 dk: sev + kategori/konum çeşitliliği
    const radar = echarts.init(this.radarEl.nativeElement);
    radar.setOption({
      radar: {
        indicator: [
          { name:'Critical', max: 20 },
          { name:'Warnings', max: 20 },
          { name:'Info',     max: 20 },
          { name:'Categories', max: 10 },
          { name:'Locations',  max: 10 },
        ]
      },
      series: [{ type:'radar', data: [{ value:[0,0,0,0,0], name:'Score' }] }],
    });

    this.subs.push(
      combineLatest([
        this.store.bySeverity10m$,
        this.store.byCategory10m$,
        this.store.recent$,
      ]).subscribe(([sev, cats, recent]) => {
        const locCount = new Set(recent.map((e: AlarmEvent) => e.location)).size;
        const value = [sev.CRITICAL, sev.WARN, sev.INFO, cats.length, locCount];
        radar.setOption({ series: [{ data: [{ value, name:'Score' }] }] });
      })
    );

    this.charts.push(area, rose, calendar, radar);
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    window.removeEventListener('resize', this.handleResize);
    this.charts.forEach(c => c.dispose());
  }

  private handleResize = () => this.charts.forEach(c => c.resize());
}