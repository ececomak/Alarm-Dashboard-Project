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

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'user-dashboard', component: UserDashboardComponent },
  { path: 'charts', component: ChartsComponent },
  { path: 'tables', component: TablesComponent },
  { path: 'overlays', component: OverlaysComponent },
  { path: 'ui', component: UiFeaturesComponent },
  { path: 'forms', component: FormsFeatureComponent },
  { path: 'wizard', component: WizardComponent },
  { path: 'layout', component: LayoutDemoComponent },
  { path: 'editors', component: EditorsComponent },
  { path: 'maps', component: MapsComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
