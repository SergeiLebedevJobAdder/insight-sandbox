import {NgModule} from '@angular/core';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {ChartComponent} from "./components/chart/chart.component";
import {NzPopoverModule} from "ng-zorro-antd/popover";
import {NzToolTipModule} from "ng-zorro-antd/tooltip";
import {NzButtonModule} from "ng-zorro-antd/button";


@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    ChartComponent,
    NzPopoverModule,
    NzToolTipModule,
    NzButtonModule
  ],
  exports: [
    DashboardComponent
  ]
})
export class InsightModule {
}
