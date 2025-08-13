import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective {
  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private auth: AuthService,
  ) {}

  @Input() set appHasRole(role: 'ADMIN' | 'USER') {
    this.vcr.clear();
    if (this.auth.hasRole(role)) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}