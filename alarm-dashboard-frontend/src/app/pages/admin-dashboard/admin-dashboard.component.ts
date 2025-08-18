import {
  Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, OnInit,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import * as echarts from 'echarts';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,   // ✅
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  email = localStorage.getItem('email') || '';

  // başlangıçları 0 tut
  stats = [
    { title: 'Active Alarms', value: 0, icon: 'alert-triangle-outline' },
    { title: 'Last 60 min',   value: 0, icon: 'clock-outline' },
    { title: 'Critical',      value: 0, icon: 'flash-outline' },
    { title: 'Warning',       value: 0, icon: 'alert-circle-outline' },
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

  /** Rozet: '10m' | '1h' | '—' */
  sevPieLabel: string = '—';

  constructor(
    private alarmStore: AlarmStoreService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.totalActive$ = this.alarmStore.totalActive$;
    this.recent$ = this.alarmStore.recent$;
  }

  ngAfterViewInit(): void {
    // ---- chart init'leri
    this.trendChart = echarts.init(this.trendEl.nativeElement);
    this.trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 28, right: 12, top: 24, bottom: 24 },
      xAxis: { type: 'category', data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      yAxis: { type: 'value' },
      series: [
        { type: 'line', smooth: true, areaStyle: {}, symbolSize: 6, data: [0,0,0,0,0,0,0] },
        { type: 'line', smooth: true,                     symbolSize: 6, data: [0,0,0,0,0,0,0] },
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

    // ---- PIE: 10m doluysa onu, değilse 1h'ı göster
    this.subs.push(
      combineLatest([this.alarmStore.bySeverity10m$, this.alarmStore.bySeverity1h$])
        .subscribe(([sev10, sev1h]) => {
          const sum10 = sev10.CRITICAL + sev10.WARN + sev10.INFO;
          const sum1h = sev1h.CRITICAL + sev1h.WARN + sev1h.INFO;
          const use = sum10 > 0 ? sev10 : sev1h;
          const nextLabel = sum10 > 0 ? '10m' : (sum1h > 0 ? '1h' : '—');

          queueMicrotask(() => {
            this.sevPieLabel = nextLabel;
            this.cdr.markForCheck();
          });

          this.pieChart?.setOption({
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

    // ---- BAR: 12 saat toplam
    this.subs.push(
      this.alarmStore.hourly12$.subscribe(({ labels, counts }) => {
        this.barChart?.setOption({ xAxis: { data: labels }, series: [{ type: 'bar', barMaxWidth: 24, data: counts }] });
      })
    );

    // ---- KPI'lar
    this.subs.push(
      this.alarmStore.totalActive$.subscribe(v => {
        queueMicrotask(() => { this.stats[0].value = v ?? 0; this.cdr.markForCheck(); });
      }),
      (this.alarmStore as any).last60m$?.subscribe?.((v: number) => {
        queueMicrotask(() => { this.stats[1].value = v ?? 0; this.cdr.markForCheck(); });
      }),
      this.alarmStore.bySeverity10m$.subscribe(sev => {
        queueMicrotask(() => {
          this.stats[2].value = sev.CRITICAL ?? 0;
          this.stats[3].value = sev.WARN ?? 0;
          this.cdr.markForCheck();
        });
      }),
    );

    // ---- Weekly (7 gün)
    this.subs.push(
      (this.alarmStore as any).weekly7$?.subscribe?.(({ labels, totals }: any) => {
        this.trendChart?.setOption({
          xAxis: { data: labels },
          series: [
            { type: 'line', smooth: true, areaStyle: {}, symbolSize: 6, data: totals },
            { type: 'line', smooth: true,                     symbolSize: 6, data: totals },
          ],
        });
      })
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.subs.forEach(s => s.unsubscribe());
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