import { Component, ChangeDetectionStrategy } from '@angular/core';
import {NzToolTipModule} from "ng-zorro-antd/tooltip";
import {NzButtonModule} from "ng-zorro-antd/button";
import {NzPopoverModule} from "ng-zorro-antd/popover";
import {RandomChartComponent} from "../random-chart/random-chart.component";

@Component({
  selector: 'insight-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NzToolTipModule,
    NzButtonModule,
    NzPopoverModule,
    RandomChartComponent
  ]
})
export class ChartComponent {
  showPopover: boolean = false;

  resetPopover(visible: boolean): void {
    if (!visible) {
      this._resetComponentStatus();
    }
  }

  private _resetComponentStatus(): void {
    this.showPopover = false;
  }
}
