import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-ecommerce',
  standalone: false,
  templateUrl: './ecommerce.html',
  styleUrls: ['./ecommerce.css'],
})
export class EcommerceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('salesEl', { static: true }) salesEl!: ElementRef<HTMLDivElement>;
  @ViewChild('revenueEl', { static: true }) revenueEl!: ElementRef<HTMLDivElement>;

  private charts: echarts.ECharts[] = [];
  kpis = [
    { icon: 'shopping-bag-outline', title: 'Orders Today', value: 128, status: 'primary' },
    { icon: 'credit-card-outline',  title: 'Revenue',      value: '$8.2k', status: 'success' },
    { icon: 'people-outline',       title: 'Customers',    value: 57,  status: 'info' },
    { icon: 'pie-chart-outline',    title: 'Conv. Rate',   value: '3.4%', status: 'warning' },
  ];

  products = [
    { name: 'Gateway Pro', sku: 'GW-001', price: 399, sold: 38 },
    { name: 'Sensor Max',  sku: 'SN-210', price: 129, sold: 74 },
    { name: 'Edge Unit X', sku: 'EU-550', price: 899, sold: 15 },
    { name: 'Camera S',    sku: 'CM-031', price: 249, sold: 42 },
  ];

  ngAfterViewInit(): void {
    const sales = echarts.init(this.salesEl.nativeElement);
    sales.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 28, right: 12, top: 24, bottom: 24 },
      xAxis: { type: 'category', data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', smooth: true, symbolSize: 6, areaStyle: {}, data: [52,68,75,81,69,92,108] }],
    });

    const revenue = echarts.init(this.revenueEl.nativeElement);
    revenue.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['45%','70%'],
        data: [
          { value: 4200, name: 'Subscriptions' },
          { value: 2300, name: 'Hardware' },
          { value: 1700, name: 'Services' },
        ],
      }],
    });

    this.charts.push(sales, revenue);
    window.addEventListener('resize', this.resize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resize);
    this.charts.forEach(c => c.dispose());
  }

  private resize = () => this.charts.forEach(c => c.resize());
}