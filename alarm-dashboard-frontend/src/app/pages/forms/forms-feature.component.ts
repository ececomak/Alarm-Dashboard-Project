import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

type Severity = 'Critical' | 'Warning' | 'Info';

@Component({
  selector: 'app-forms-feature',
  standalone: false,
  templateUrl: './forms-feature.html',
  styleUrls: ['./forms-feature.css'],
})
export class FormsFeatureComponent {
  constructor(private fb: FormBuilder) {}

  severities: Severity[] = ['Critical', 'Warning', 'Info'];

  form = this.fb.group({
    device: ['',
      [Validators.maxLength(40)]],
    severity: ['' as '' | Severity],
    from: [''],
    to: [''],
    live: [true],
    ackOnly: [false],
  });

  get f() { return this.form.controls; }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // şimdilik sadece console’a, sonra API
    console.log('FILTER:', this.form.value);
    this.lastSubmitted = {
      ...this.form.value,
      from: this.form.value.from || '—',
      to: this.form.value.to || '—',
      severity: this.form.value.severity || 'Any',
      device: this.form.value.device || 'Any',
    };
  }

  lastSubmitted: any = null;
}