import { Component, TemplateRef, ViewChild } from '@angular/core';
import {
  NbDialogService, NbToastrService, NbGlobalPhysicalPosition, NbDialogRef
} from '@nebular/theme';

@Component({
  selector: 'app-overlays',
  standalone: false,
  templateUrl: './overlays.html',
  styleUrls: ['./overlays.css'],
})
export class OverlaysComponent {
  @ViewChild('confirmTpl', { static: true }) confirmTpl!: TemplateRef<any>;
  private dialogRef?: NbDialogRef<any>;

  constructor(private dialog: NbDialogService, private toastr: NbToastrService) {}

openConfirm() {
  const ref = this.dialog.open(this.confirmTpl, {
    closeOnBackdropClick: false,
    autoFocus: false,            
  });

  ref.onClose.subscribe((ok: boolean) => {
    if (ok) this.toastr.success('Action confirmed.', 'Success');
    else this.toastr.info('Operation cancelled.', 'Cancelled');
  });
}

  close(result?: boolean) {
    this.dialogRef?.close(result);
  }

  showSuccess() {
    this.toastr.success('Operation completed successfully.', 'Success', {
      position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 3000,
    });
  }
  showWarning() {
    this.toastr.warning('Check configuration and try again.', 'Warning', {
      position: NbGlobalPhysicalPosition.BOTTOM_RIGHT, duration: 3500,
    });
  }
  showError() {
    this.toastr.danger('Something went wrong.', 'Error', {
      position: NbGlobalPhysicalPosition.TOP_LEFT, duration: 4000,
    });
  }
}