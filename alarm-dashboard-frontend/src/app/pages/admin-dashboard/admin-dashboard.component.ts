import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmSocketService } from '../../core/realtime/alarm-socket.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';
import { AlarmSnapshotService } from '../../core/realtime/alarm-snapshot.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  email = localStorage.getItem('email') || '';

  stats = [
    { title: 'Active Alarms', value: 42, icon: 'alert-triangle-outline' },
    { title: 'Last 60 min',   value: 9,  icon: 'clock-outline' },
    { title: 'Critical',      value: 5,  icon: 'flash-outline' },
    { title: 'Warning',       value: 21, icon: 'alert-circle-outline' },
  ];

  @ViewChild('trendEl',  { static: true }) trendEl!: ElementRef<HTMLDivElement>;
  @ViewChild('pieEl',    { static: true }) pieEl!: ElementRef<HTMLDivElement>;
  @ViewChild('barEl',    { static: true }) barEl!: ElementRef<HTMLDivElement>;
  @ViewChild('gaugeEl',  { static: true }) gaugeEl!: ElementRef<HTMLDivElement>;

  totalActive$!: Observable<number>;
  recent$!: Observable<AlarmEvent[]>;

  private trendChart?: echarts.ECharts;
  private pieChart?: echarts.ECharts;
  private barChart?: echarts.ECharts;
  private gaugeChart?: echarts.ECharts;

  private charts: echarts.ECharts[] = [];
  private subs: Subscription[] = [];

  /** Dinamik rozet: '10m' | '1h' | '—' */
  sevPieLabel: string = '—';

  constructor(
    private alarmStore: AlarmStoreService,
    private alarmSocket: AlarmSocketService,
    private snapshot: AlarmSnapshotService
  ) {}

  ngOnInit(): void {
    this.totalActive$ = this.alarmStore.totalActive$;
    this.recent$ = this.alarmStore.recent$;

    this.alarmSocket.connect();

    this.snapshot
      .loadRecentAndHydrate(evts => this.alarmStore.hydrate(evts), 10)
      .catch(err => console.warn('[SNAPSHOT recent] failed', err));

    this.snapshot
      .loadMonthSinceFirstDay(evts => this.alarmStore.hydrate(evts))
      .catch(err => console.warn('[SNAPSHOT month] failed', err));
  }

  ngAfterViewInit(): void {
    this.trendChart = echarts.init(this.trendEl.nativeElement);
    this.trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 28, right: 12, top: 24, bottom: 24 },
      xAxis: { type: 'category', data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      yAxis: { type: 'value' },
      series: [
        { type: 'line', smooth: true, areaStyle: {}, symbolSize: 6, data: [120, 280, 150, 80, 70, 220, 180] },
        { type: 'line', smooth: true, symbolSize: 6, data: [60, 130, 90, 40, 50, 110, 95] },
      ],
    });

    this.pieChart = echarts.init(this.pieEl.nativeElement);
    this.pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        name: 'Severity',
        type: 'pie',
        radius: ['40%','70%'],
        avoidLabelOverlap: true,
        data: [
          { value: 0, name: 'Critical' },
          { value: 0, name: 'Warning'  },
          { value: 0, name: 'Info'     },
        ],
      }],
    });

    this.barChart = echarts.init(this.barEl.nativeElement);
    this.barChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 28, right: 12, top: 24, bottom: 24 },
      xAxis: { type: 'category', data: this.lastNHoursLabels(12) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', barMaxWidth: 24, data: new Array(12).fill(0) }],
    });

    this.gaugeChart = echarts.init(this.gaugeEl.nativeElement);
    this.gaugeChart.setOption({
      series: [{
        type: 'gauge',
        min: 0, max: 100,
        detail: { formatter: '{value}%' },
        data: [{ value: 97, name: 'Uptime' }],
      }],
    });

    this.charts.push(this.trendChart, this.pieChart, this.barChart, this.gaugeChart);
    window.addEventListener('resize', this.handleResize);

    // --- Pie (10m -> boşsa 1h) + dinamik rozet ---
    this.subs.push(
      combineLatest([this.alarmStore.bySeverity10m$, this.alarmStore.bySeverity1h$])
        .subscribe(([sev10, sev1h]) => {
          const sum10 = sev10.CRITICAL + sev10.WARN + sev10.INFO;
          const sum1h = sev1h.CRITICAL + sev1h.WARN + sev1h.INFO;

          const use = sum10 > 0 ? sev10 : sev1h;
          this.sevPieLabel = sum10 > 0 ? '10m' : (sum1h > 0 ? '1h' : '—');

          if (!this.pieChart) return;
          this.pieChart.setOption({
            series: [{
              data: [
                { value: use.CRITICAL, name: 'Critical' },
                { value: use.WARN,     name: 'Warning'  },
                { value: use.INFO,     name: 'Info'     },
              ],
            }],
          });
        })
    );

    // --- Bar (12h toplam) ---
    this.subs.push(
      this.alarmStore.hourly12$.subscribe(({ labels, counts }) => {
        if (!this.barChart) return;
        this.barChart.setOption({
          xAxis: { data: labels },
          series: [{ type: 'bar', barMaxWidth: 24, data: counts }],
        });
      })
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.subs.forEach(s => s.unsubscribe());
    this.alarmSocket.disconnect();
    this.charts.forEach(c => c.dispose());
  }

  private handleResize = () => this.charts.forEach(c => c.resize());

  private lastNHoursLabels(n: number): string[] {
    const out: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hh = d.getHours().toString().padStart(2, '0');
      out.push(`${hh}:00`);
    }
    return out;
  }
}