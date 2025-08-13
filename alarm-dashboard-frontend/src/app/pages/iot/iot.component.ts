import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as echarts from 'echarts';

type Device = { name: string; status: 'Online'|'Offline'|'Degraded'; temp: number; humidity: number; };

@Component({
  selector: 'app-iot',
  standalone: false,
  templateUrl: './iot.html',
  styleUrls: ['./iot.css'],
})
export class IotComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gaugeEl', { static: true }) gaugeEl!: ElementRef<HTMLDivElement>;
  @ViewChild('trendEl', { static: true }) trendEl!: ElementRef<HTMLDivElement>;

  private charts: echarts.ECharts[] = [];
  private tick?: any;

  private trendData: number[] = Array.from({ length: 20 }, () => 20 + Math.round(Math.random() * 10));

  devices: Device[] = [
    { name: 'Tunnel-1',  status: 'Online',  temp: 31, humidity: 48 },
    { name: 'Gateway-2', status: 'Degraded',temp: 43, humidity: 35 },
    { name: 'Pump-4',    status: 'Online',  temp: 28, humidity: 54 },
    { name: 'Sensor-7',  status: 'Offline', temp: 0,  humidity: 0  },
  ];

  ngAfterViewInit(): void {
    const gauge = echarts.init(this.gaugeEl.nativeElement);
    gauge.setOption({
      series: [{
        type: 'gauge',
        min: 0, max: 100,
        detail: { formatter: '{value}%' },
        data: [{ value: 86, name: 'Uptime' }],
      }],
    });

    const trend = echarts.init(this.trendEl.nativeElement);
    const init = Array.from({ length: 20 }, () => 20 + Math.round(Math.random()*10));
    trend.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 28, right: 12, top: 24, bottom: 24 },
      xAxis: { type: 'category', data: Array.from({length: 20}, (_,i)=>i) },
      yAxis: { type: 'value', min: 0, max: 100 },
      series: [{ type: 'line', smooth: true, symbol: 'none', data: init }],
    });

    this.charts.push(gauge, trend);
    window.addEventListener('resize', this.resize);

    // canlı simülasyon
    this.tick = setInterval(() => {
      const last = this.trendData[this.trendData.length - 1] ?? 50;
      const next = Math.max(0, Math.min(100, last + (Math.random() * 10 - 5)));
      this.trendData.push(Math.round(next));
      if (this.trendData.length > 20) this.trendData.shift();
      trend.setOption({ series: [{ data: this.trendData }] }, false);
    }, 1200);
  }

  ngOnDestroy(): void {
    clearInterval(this.tick);
    window.removeEventListener('resize', this.resize);
    this.charts.forEach(c => c.dispose());
  }

  private resize = () => this.charts.forEach(c => c.resize());

  statusClass(s: Device['status']) {
    return s.toLowerCase();
  }
}