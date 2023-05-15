import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
// @ts-ignore
import * as d3 from 'd3';
import {ChartDataContainer, ChartPoint, CommonEnums, DataSeries, ExtendedChartOptions} from '../chart/chart';
import {ChartBuilder} from '../chart/chart-builder';
import ChartType = CommonEnums.ChartType;

@Component({
  selector: 'insight-random-chart',
  templateUrl: './random-chart.component.html',
  styleUrls: ['./random-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class RandomChartComponent implements OnInit, AfterViewInit, OnDestroy {
  chart: ChartDataContainer = new ChartDataContainer();
  @Output() callback = new EventEmitter();
  private svgChart: ElementRef | null = null;
  private svgLegend: ElementRef | null = null;
  private chartBuilder: ChartBuilder = new ChartBuilder();

  private theInterval: number = 0;

  constructor(public chartElem: ElementRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.svgChart = d3.select(this.chartElem.nativeElement).select('.line-chart').append('svg').attr('height', 300);
    this.svgLegend = d3.select(this.chartElem.nativeElement).select('.line-chart-legend').append('svg');
    this.drawTask();
    this.theInterval = setInterval(() => {
      this.drawTask();
    }, 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.theInterval);
  }

  drawTask() {
    this.chart = this.createUpdateChart();
    if (this.chart.options) {
      this.draw();
    } else {
      this.drawChart();
    }
  }

  createUpdateChart() {
    // chart apperance
    const options = new ExtendedChartOptions();
    options.drawName = true;
    options.name = `Chart`;
    do {
      options.drawLine = this.getRandomBoolean();
      options.drawDots = this.getRandomBoolean();
      options.drawBar = this.getRandomBoolean();
    } while (!options.drawLine && !options.drawDots && !options.drawBar);

    if (options.drawLine) {
      options.lineType = this.getRandomNumber(4);
      options.lineColor = this.getRandomColor();
      options.lineAnimationTime = 500 + this.getRandomNumber(3000);
      options.lineWidth = `${this.getRandomNumber(3)}px`;
    }
    if (options.drawBar) {
      options.barBorderWidth = 1;
      options.barAnimationTime = 500 + this.getRandomNumber(3000);
      options.barColor = this.getRandomColor();
      options.barOpacity = `${this.getRandomNumber()}`;
    }
    if (options.drawDots) {
      options.dotType = this.getRandomNumber(3);
      options.dotAnimationTime = 500 + this.getRandomNumber(3000);
      options.dotBorderRadius = this.getRandomNumber(10);
      options.dotBorderWidth = this.getRandomNumber(6);
      options.dotColor = this.getRandomColor();
      options.dotOpacity = `${this.getRandomNumber()}`;
      options.dotBorderSquareSideLength = this.getRandomNumber(14);
      options.dotCrossLength = this.getRandomNumber(6);
    }
    options.drawMin = this.getRandomBoolean();
    options.drawMax = options.drawMin;
    options.textMinMaxColor = this.getRandomColor();
    options.drawLegend = true;
    options.legendTextColor = this.getRandomColor();
    options.drawGrid = this.getRandomBoolean();
    options.drawXAxisTitle = true;
    options.drawYAxisTitle = options.drawXAxisTitle;
    options.drawYTicks = true;
    options.drawXTicks = options.drawYTicks;
    options.axisesTextColor = this.getRandomColor();
    options.axisesColor = this.getRandomColor();
    options.drawAllPoints = true;
    options.cssStyle = { 'min-height': '100%', 'min-width': '250px' };
    options.nameOfTitleField = CommonEnums.NamesOfTitleField.pointXY;

    // chart data
    const chartDataPoints = [];
    for (let index = 0; index < Math.ceil(5 + Math.random() * 10); index++) {
      chartDataPoints.push(
        new ChartPoint(
          new Date(),// this.getRandomNumber(this.getRandomNumber(1000)),
          this.getRandomNumber(this.getRandomNumber(1000))
        )
      );
    }

    const chart = new ChartDataContainer(`Change Points`, ChartType.LineChart, options);
    chart.dataArray.push(new DataSeries(chartDataPoints, ChartType.LineChart, 'legend'));
    chart.prepareData();
    chart.loading = false;
    return chart;
  }

  getRandomBoolean() {
    return Math.random() < 0.5;
  }

  getRandomColor(): string {
    return `rgb(${this.getRandomNumber(255)}, ${this.getRandomNumber(255)}, ${this.getRandomNumber(255)})`;
  }

  getRandomNumber(limit: number = 1) {
    return Math.ceil(Math.random() * limit);
  }

  private drawChart() {
    switch (this.chart.type) {
      case CommonEnums.ChartType.LineChart:
        this.drawLineChart();
        break;
      case CommonEnums.ChartType.BarChart:
        this.drawBarsChart();
        break;
      case CommonEnums.ChartType.CrossDotChart:
        this.drawCrossDotChart();
        break;
      case CommonEnums.ChartType.SquareDotChart:
        this.drawSquareDotsChart();
        break;
      case CommonEnums.ChartType.CircleDotChart:
        this.drawCircleDotsChart();
        break;
      case CommonEnums.ChartType.MixedChart:
        this.drawAllChart();
        break;
    }
  }

  private drawLineChart() {
    const options = new ExtendedChartOptions();
    options.drawName = false;
    options.name = this.chart.name;
    options.drawLine = true;
    options.lineType = CommonEnums.LineType.CurveLinear;
    options.drawDots = true;
    options.dotType = CommonEnums.DotType.CIRCLE;
    options.drawMin = true;
    options.drawMax = true;
    options.drawLegend = true;
    options.drawXAxisTitle = false;
    options.drawYAxisTitle = false;

    this.draw(options);
  }

  private drawCrossDotChart() {
    const options = new ExtendedChartOptions();
    options.drawName = false;
    options.name = this.chart.name;
    options.drawDots = true;
    options.dotType = CommonEnums.DotType.CROSS;
    options.dotBorderWidth = 3;
    options.drawMin = true;
    options.drawMax = true;
    options.textMinMaxColor = '#000000';
    options.drawLegend = true;
    options.drawXAxisTitle = false;
    options.drawYAxisTitle = true;
    options.dotAnimationTime = 2000;
    options.drawAllPoints = false;

    this.draw(options);
  }

  private drawSquareDotsChart() {
    const options = new ExtendedChartOptions();
    options.drawName = false;
    options.name = this.chart.name;
    options.drawDots = true;
    options.dotType = CommonEnums.DotType.SQUARE;
    options.drawMin = true;
    options.drawMax = true;
    options.drawLegend = true;
    options.drawXAxisTitle = false;
    options.drawYAxisTitle = false;

    this.draw(options);
  }

  private drawCircleDotsChart() {
    const options = new ExtendedChartOptions();
    options.drawName = false;
    options.name = this.chart.name;
    options.drawDots = true;
    options.dotType = CommonEnums.DotType.CIRCLE;
    options.drawMin = true;
    options.drawMax = true;
    options.drawLegend = true;
    options.drawXAxisTitle = false;
    options.drawYAxisTitle = false;

    this.draw(options);
  }

  private drawBarsChart() {
    const options = new ExtendedChartOptions();
    options.drawName = false;
    options.name = this.chart.name;
    options.drawBar = true;
    options.barBorderWidth = 1;
    options.drawMin = true;
    options.drawMax = true;
    options.textMinMaxColor = '#000000';
    options.drawLegend = false;
    options.drawGrid = false;
    options.drawXAxisTitle = false;
    options.drawYAxisTitle = false;
    options.drawAllPoints = false;

    this.draw(options);
  }

  private drawAllChart() {
    const options = new ExtendedChartOptions();
    options.drawName = true;
    options.name = this.chart.name;
    options.drawLine = true;
    options.lineType = CommonEnums.LineType.StraightPath;
    options.lineColor = options.colors[this.chart.chartId % 10];
    options.drawDots = true;
    options.dotType = CommonEnums.DotType.CROSS;
    options.dotColor = options.colors[1 + (this.chart.chartId % 10)];
    options.drawBar = true;
    options.barWidth = 5;
    options.barColor = options.colors[2 + (this.chart.chartId % 10)];
    options.drawMin = true;
    options.drawMax = true;
    options.drawLegend = true;

    this.draw(options);
  }

  draw(options: any = null) {
    if (options && !this.chart.options) {
      this.chart.options = options;
    }

    const self = this;
    this.chartBuilder = new ChartBuilder((element: any, action: any) => {
      self.callback.emit({ object: element.object, action: action });
    });
    this.chartBuilder.drawChart(this.chart, this.svgChart, this.svgLegend);
  }

  getDefaultCSSStyle() {
    const options = new ExtendedChartOptions();
    return options.cssStyle;
  }

  public onMouseEnter(element: string) {
    this.chartBuilder.onMouseOver(element);
  }

  public onMouseLeave(element: string) {
    this.chartBuilder.onMouseOut(element);
  }
}
