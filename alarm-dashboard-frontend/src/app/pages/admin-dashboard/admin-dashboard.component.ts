import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent implements AfterViewInit, OnDestroy {
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

  private charts: echarts.ECharts[] = [];

  ngAfterViewInit(): void {
    const trend = echarts.init(this.trendEl.nativeElement);
    trend.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 28, right: 12, top: 24, bottom: 24 },
      xAxis: { type: 'category', data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      yAxis: { type: 'value' },
      series: [
        { type: 'line', smooth: true, areaStyle: {}, symbolSize: 6, data: [120, 280, 150, 80, 70, 220, 180] },
        { type: 'line', smooth: true, symbolSize: 6, data: [60, 130, 90, 40, 50, 110, 95] },
      ],
    });

    const pie = echarts.init(this.pieEl.nativeElement);
    pie.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        name: 'Severity',
        type: 'pie',
        radius: ['40%','70%'],
        avoidLabelOverlap: true,
        data: [
          { value: 5,  name: 'Critical' },
          { value: 21, name: 'Warning'  },
          { value: 16, name: 'Info'     },
        ],
      }],
    });

    const bar = echarts.init(this.barEl.nativeElement);
    bar.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 28, right: 12, top: 24, bottom: 24 },
      xAxis: { type: 'category', data: Array.from({length: 12}, (_,i)=> `${i*2}:00`) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', barMaxWidth: 24, data: [3,6,4,5,2,7,8,6,4,9,5,3] }],
    });

    const gauge = echarts.init(this.gaugeEl.nativeElement);
    gauge.setOption({
      series: [{
        type: 'gauge',
        min: 0, max: 100,
        detail: { formatter: '{value}%' },
        data: [{ value: 97, name: 'Uptime' }],
      }],
    });

    this.charts.push(trend, pie, bar, gauge);
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.charts.forEach(c => c.dispose());
  }

  private handleResize = () => this.charts.forEach(c => c.resize());
}