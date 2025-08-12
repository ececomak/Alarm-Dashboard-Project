import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as echarts from 'echarts';

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

  ngAfterViewInit(): void {
    // 1) Stacked Area
    const area = echarts.init(this.areaEl.nativeElement);
    area.setOption({
      tooltip: { trigger: 'axis' },
      legend: { top: 0 },
      grid: { left: 28, right: 12, top: 40, bottom: 24 },
      xAxis: { type: 'category', data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      yAxis: { type: 'value' },
      series: [
        { name:'Errors',   type:'line', stack:'total', areaStyle:{}, smooth:true, data:[20,32,11,34,90,30,10] },
        { name:'Warnings', type:'line', stack:'total', areaStyle:{}, smooth:true, data:[50,12,21,54,19,30,40] },
        { name:'Info',     type:'line', stack:'total', areaStyle:{}, smooth:true, data:[15,22,31,14,29,20,25] },
      ],
    });

    // 2) Rose / Donut Pie
    const rose = echarts.init(this.roseEl.nativeElement);
    rose.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        name: 'Categories',
        type: 'pie',
        roseType: 'area',
        radius: ['30%','70%'],
        data: [
          { value: 18, name: 'Device' },
          { value: 26, name: 'Network' },
          { value: 16, name: 'System' },
          { value: 12, name: 'Security' },
          { value: 8,  name: 'Other' },
        ],
      }],
    });

    // 3) Calendar Heatmap
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
    const year  = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const calData = Array.from({ length: daysInMonth }, (_, i) => {
      const d = `${year}-${pad(month)}-${pad(i + 1)}`;
      return [d, Math.floor(Math.random() * 30)]; // demo
    });

    const calendar = echarts.init(this.calendarEl.nativeElement);
    calendar.setOption({
      tooltip: { position: 'top' },
      visualMap: { min: 0, max: 30, orient: 'horizontal', left: 'center', bottom: 0 },
      calendar: {
        top: 20, left: 20, right: 20,
        cellSize: [20, 20],
        range: `${year}-${pad(month)}`,
        dayLabel: { firstDay: 1 },
      },
      series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: calData }],
    });

    // 4) Radar
    const radar = echarts.init(this.radarEl.nativeElement);
    radar.setOption({
      tooltip: {},
      radar: { indicator: [
        { name: 'CPU',  max: 100 },
        { name: 'RAM',  max: 100 },
        { name: 'Disk', max: 100 },
        { name: 'NW',   max: 100 },
        { name: 'IO',   max: 100 },
      ]},
      series: [{ type: 'radar', data: [{ value: [72, 65, 58, 80, 61], name: 'Score' }] }],
    });

    this.charts.push(area, rose, calendar, radar);
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.charts.forEach(c => c.dispose());
  }

  private handleResize = () => this.charts.forEach(c => c.resize());
}