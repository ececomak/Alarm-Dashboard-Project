import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

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

import {
  NbThemeModule,
  NbLayoutModule,
  NbSidebarModule,
  NbMenuModule,
  NbIconModule,
  NbActionsModule,
  NbUserModule,
  NbSelectModule,
  NbCardModule,
  NbTabsetModule,
  NbAccordionModule,
  NbAlertModule,
  NbProgressBarModule,
  NbTooltipModule,
  NbButtonModule,
  NbInputModule,
  NbToastrModule,
  NbDialogModule,
  NbToggleModule,
  NbCheckboxModule,
  NbStepperModule,
  NbListModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    AdminDashboardComponent,
    UserDashboardComponent,
    ChartsComponent, 
    TablesComponent,
    OverlaysComponent,
    UiFeaturesComponent,
    FormsFeatureComponent,
    WizardComponent, 
    LayoutDemoComponent,
    EditorsComponent,
    MapsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,

    AppRoutingModule,

    NbThemeModule.forRoot({ name: 'default' }),
    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDialogModule.forRoot(),
    NbToastrModule.forRoot(),

    NbLayoutModule,
    NbIconModule,
    NbActionsModule,
    NbUserModule,
    NbSelectModule,
    NbCardModule,
    NbEvaIconsModule,
    NbButtonModule,
    NbInputModule,
    NbTabsetModule,
    NbAccordionModule,
    NbAlertModule,
    NbProgressBarModule,
    NbTooltipModule,
    NbToggleModule,
    NbCheckboxModule,
    ReactiveFormsModule,
    NbStepperModule,  
    NbListModule,
  ],
  providers: [],
  bootstrap: [App],
})
export class AppModule {}