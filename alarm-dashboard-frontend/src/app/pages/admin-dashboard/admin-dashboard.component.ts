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

  @ViewChild('chartEl', { static: true }) chartEl!: ElementRef<HTMLDivElement>;
  private chart?: echarts.ECharts;

  ngAfterViewInit(): void {
    this.chart = echarts.init(this.chartEl.nativeElement);
    this.chart.setOption({
      tooltip: {},
      grid: { left: 30, right: 10, top: 20, bottom: 25 },
      xAxis: { type: 'category', data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      yAxis: { type: 'value' },
      series: [
        { type: 'line', smooth: true, areaStyle: {}, data: [120, 280, 150, 80, 70, 220, 180] },
        { type: 'line', smooth: true, data: [60, 130, 90, 40, 50, 110, 95] },
      ],
    });

    // responsive
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.chart?.dispose();
  }

  private handleResize = () => {
    this.chart?.resize();
  };
}