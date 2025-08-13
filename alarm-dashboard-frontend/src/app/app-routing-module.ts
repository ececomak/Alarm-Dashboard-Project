import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { ChartsComponent } from './pages/charts/charts.component';
import { TablesComponent } from './pages/tables/tables.component';
import { OverlaysComponent } from './pages/overlays/overlays.component';
import { UiFeaturesComponent } from './pages/ui/ui-features.component';
import { FormsFeatureComponent } from './pages/forms/forms-feature.component';
import { WizardComponent } from './pages/wizard/wizard.component';
import { LayoutDemoComponent } from './pages/layout/layout-demo.component';
import { EditorsComponent } from './pages/editors/editors.component';
import { MapsComponent } from './pages/maps/maps.component';
import { AuthDemoComponent } from './pages/auth/auth-demo.component';
import { MiscComponent } from './pages/misc/misc.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { EcommerceComponent } from './pages/ecommerce/ecommerce.component';
import { IotComponent } from './pages/iot/iot.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'user-dashboard', component: UserDashboardComponent, canActivate: [AuthGuard] },
  { path: 'charts', component: ChartsComponent, canActivate: [AuthGuard] },
  { path: 'tables', component: TablesComponent, canActivate: [AuthGuard] },
  { path: 'overlays', component: OverlaysComponent, canActivate: [AuthGuard] },
  { path: 'ui', component: UiFeaturesComponent, canActivate: [AuthGuard] },
  { path: 'forms', component: FormsFeatureComponent, canActivate: [AuthGuard] },
  { path: 'wizard', component: WizardComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'layout', component: LayoutDemoComponent, canActivate: [AuthGuard] },
  { path: 'editors', component: EditorsComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'maps', component: MapsComponent, canActivate: [AuthGuard] },
  { path: 'auth', component: AuthDemoComponent, canActivate: [AuthGuard] },
  { path: 'misc', component: MiscComponent, canActivate: [AuthGuard] },
  { path: 'ecommerce', component: EcommerceComponent, canActivate: [AuthGuard] },
  { path: 'iot',       component: IotComponent,       canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
