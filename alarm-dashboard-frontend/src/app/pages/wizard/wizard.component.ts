import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-wizard',
  standalone: false,
  templateUrl: './wizard.html',
  styleUrls: ['./wizard.css'],
})
export class WizardComponent {
  constructor(private fb: FormBuilder) {}

  deviceForm = this.fb.group({
    device: ['', [Validators.required, Validators.maxLength(40)]],
    severity: ['Critical', Validators.required],
  });

  detailForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  confirmForm = this.fb.group({
    assignee: ['Ops Team', Validators.required],
  });

  get d() { return this.deviceForm.controls; }
  get t() { return this.detailForm.controls; }
  get c() { return this.confirmForm.controls; }

  submitted = false;
  result: any = null;

  finish() {
    this.submitted = true;
    if (this.deviceForm.invalid || this.detailForm.invalid || this.confirmForm.invalid) return;

    this.result = {
      ...this.deviceForm.value,
      ...this.detailForm.value,
      ...this.confirmForm.value,
      createdAt: new Date().toISOString(),
    };
  }
}