import { Component, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-ui-features',
  standalone: false,
  templateUrl: './ui-features.html',
  styleUrls: ['./ui-features.css'],
})
export class UiFeaturesComponent implements OnDestroy {
  alerts = [
    { status: 'success', text: 'All systems nominal.' },
    { status: 'warning', text: 'Latency increased in Zone B.' },
    { status: 'danger',  text: 'Critical alarm threshold reached.' },
    { status: 'info',    text: 'Maintenance window tonight 02:00.' },
  ];

  progress = 12;
  private timer?: any;

  constructor() {
    this.timer = setInterval(() => {
      this.progress = (this.progress + Math.floor(Math.random() * 7) + 3);
      if (this.progress > 100) this.progress = 100;
    }, 1200);
  }

  get progressStatus(): 'primary' | 'warning' | 'success' | 'danger' {
    if (this.progress < 50) return 'primary';  
    if (this.progress < 85) return 'warning';   
    if (this.progress < 100) return 'primary';
    return 'success';                            
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}