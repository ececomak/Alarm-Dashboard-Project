import { Component } from '@angular/core';

@Component({
  selector: 'app-misc',
  standalone: false,
  templateUrl: './misc.html',
  styleUrls: ['./misc.css'],
})
export class MiscComponent {
  loading = false;
  percent = 30;

  simulate() {
    if (this.loading) return;
    this.loading = true;
    const timer = setInterval(() => {
      this.percent += 10;
      if (this.percent >= 100) {
        this.percent = 100;
        this.loading = false;
        clearInterval(timer);
      }
    }, 500);
  }
}