import { Component, OnInit } from '@angular/core';
import { NbToastrService, NbGlobalPhysicalPosition } from '@nebular/theme';

type NbStatus = 'primary' | 'success' | 'info' | 'warning' | 'danger';
type AlertRow = { id: number; status: NbStatus; text: string; visible: boolean };

@Component({
  selector: 'app-misc',
  standalone: false,
  templateUrl: './misc.html',
  styleUrls: ['./misc.css'],
})
export class MiscComponent implements OnInit {
  alerts: AlertRow[] = [];
  loading = false;
  percent = 30;
  private timer: any;

  liveUpdates = false;
  notifications = true;

  private K_LIVE = 'misc-live-updates';
  private K_NOTI = 'misc-notifications';

  constructor(private toastSvc: NbToastrService) {}

  ngOnInit(): void {
    this.restoreDemo();
    this.liveUpdates = localStorage.getItem(this.K_LIVE) === '1';
    this.notifications = localStorage.getItem(this.K_NOTI) !== '0';
  }

  simulate() {
    if (this.loading) return;
    this.loading = true;
    this.timer = setInterval(() => {
      this.percent += 8 + Math.floor(Math.random() * 7);
      if (this.percent >= 100) {
        this.percent = 100;
        this.loading = false;
        clearInterval(this.timer);
        this.timer = null;
        this.toast('Completed', 'Process finished successfully.', 'success');
      }
    }, 450);
  }

  cancel() {
    if (!this.loading) return;
    this.loading = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.toast('Cancelled', 'Simulation cancelled.', 'warning');
  }

  reset() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.loading = false;
    this.percent = 0;
  }

  dismiss(a: AlertRow) {
    a.visible = false;
  }

  clearAll() {
    this.alerts.forEach(a => a.visible = false);
  }

  restoreDemo() {
    this.alerts = [
      { id: 1, status: 'info',    text: 'System maintenance tonight.', visible: true },
      { id: 2, status: 'warning', text: 'Network latency increased.',  visible: true },
      { id: 3, status: 'danger',  text: 'Critical threshold reached.', visible: true },
    ];
  }

  badge(tag: string) {
    this.toast(tag, `Badge clicked: ${tag}`, 'primary');
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(tag).catch(() => {});
    }
  }

  onToggleLive(v: boolean) {
    this.liveUpdates = v;
    localStorage.setItem(this.K_LIVE, v ? '1' : '0');
    this.toast('Live updates', v ? 'Turned on.' : 'Turned off.', 'info');
  }

  onToggleNoti(v: boolean) {
    this.notifications = v;
    localStorage.setItem(this.K_NOTI, v ? '1' : '0');
    this.toast('Notifications', v ? 'Enabled.' : 'Disabled.', v ? 'success' : 'warning');
  }

  private toast(title: string, msg: string, status: NbStatus) {
    if (!this.notifications && title !== 'Notifications') return;
    this.toastSvc.show(msg, title, {
      status,
      duration: 2200,
      position: NbGlobalPhysicalPosition.TOP_RIGHT,
    });
  }
}