import ChartType = CommonEnums.ChartType;

export class ChartMargin {
  top = 0;
  right = 0;
  left = 0;
  bottom = 0;

  constructor(margin?: { top: number; right: number; bottom: number; left: number; }) {
    if (margin) {
      Object.assign(this, margin);
    }
  }
}

export class ChartDataSet {
  name: string;
  xColumn: Array<Date>;
  yColumn: Array<number>;

  constructor(name: string, xColumn: Array<Date>, yColumn: Array<number>) {
    this.name = name;
    this.xColumn = xColumn;
    this.yColumn = yColumn;
  }
}

export class ChartDataContainer {
  private static counter = 0;
  loading: boolean;
  chartId = 0;
  name: string;
  type: CommonEnums.ChartType;
  dataArray: Array<DataSeries> = [];
  yMax: any = null;
  yMin: any = null;
  xMax: any = null;
  // initialPoint: Date | number;
  xColumn:any = null;
  yColumn:any = null;
  xPointType = CommonEnums.PointType.Date;
  yPointType = CommonEnums.PointType.Number;
  xPointName: string = "";
  yPointName: string = "";
  xAccuracy = 0;
  yAccuracy = 0;
  extendedYAccuracy = 0;
  dateFormatter = '%d-%b-%y';
  resize = false;
  fullName = false;
  options: ExtendedChartOptions;

  constructor(name = "Empty Chart", type: CommonEnums.ChartType = ChartType.LineChart, options = new ExtendedChartOptions(), chartId = null) {
    this.chartId = chartId ? chartId : ++ChartDataContainer.counter;
    this.name = name;
    this.loading = this.dataArray.length === 0;
    this.options = options;
    this.type = type;
  }

  public prepareData() {
    if (this.dataArray.length === 0) {
      return;
    }

    // sort, calculating min-max values
    this.dataArray.forEach((dataSeries) => {
      const xMax = dataSeries.findXMaxFomChartData();
      if (this.xMax) {
        this.xMax = this.xMax > xMax ? this.xMax : xMax;
      } else {
        this.xMax = xMax;
      }

      const yMax = dataSeries.findYMaxFomChartData();
      if (this.yMax) {
        this.yMax = this.yMax.yMax > yMax.yMax ? this.yMax : yMax;
      } else {
        this.yMax = yMax;
      }

      const yMin = dataSeries.findYMinFomChartData();
      if (this.yMin) {
        this.yMin = this.yMin.yMin < yMin.yMin ? this.yMin : yMin;
      } else {
        this.yMin = yMin;
      }
    });

    // searching of values for scale of axise X
    const xColumn: Date[] = [];
    this.dataArray.forEach((dataSeries) => {
      if (dataSeries.xPointType === CommonEnums.PointType.Date) {
        dataSeries.dataSeriesPoints.forEach((point) => {
          const time = (point.xPoint as Date).getTime();
          if (xColumn.findIndex((item) => item.getTime() === time) === -1) {
            xColumn.push(point.xPoint);
          }
        });
      } else if (dataSeries.xPointType === CommonEnums.PointType.Number) {
        dataSeries.dataSeriesPoints.forEach((point) => {
          if (!xColumn.includes(point.xPoint)) {
            xColumn.push(point.xPoint);
          }
        });
      }
    });
    if (this.dataArray.length > 1) {
      xColumn.sort((a, b) => {
        return (a.getTime() as number) - (b.getTime() as number);
      });
    }

    this.xPointName = this.dataArray[0].xPointName;
    this.xPointType = this.dataArray[0].xPointType;
    // we do not use initial point because we turn to use scaleBand() function of d3 library,
    // but if we need use scaleLinear() or scaleTime() we need to add initial point to data for beauty
    // if (this.xPointType === PointType.Number) {
    //     if (xColumn.length > 1) {
    //         this.initialPoint = 2 * (xColumn[0] as number) - (xColumn[1] as number);
    //     }
    // } else if (this.xPointType === PointType.Date) {
    //     let initialPoint = new Date(xColumn[0] as Date);
    //     initialPoint.setMonth(initialPoint.getMonth() - 1);
    //     if (xColumn.length > 1) {
    //         initialPoint = new Date(2 * (xColumn[0] as number) - (xColumn[1] as number));
    //     }
    //     xColumn.unshift(initialPoint);
    //     this.xColumn = xColumn;
    //     this.initialPoint = initialPoint;
    // }
    this.xColumn = xColumn;

    // searching of values for scale of axise Y
    this.yPointName = this.dataArray[0].yPointName;
    this.yPointType = this.dataArray[0].yPointType;
    if (this.yPointType === CommonEnums.PointType.Date) {
      const yColumn: number[] = [];
      this.dataArray.forEach((dataSeries) => {
        dataSeries.dataSeriesPoints.forEach((point) => {
          // const time = (point.xPoint as Date).getTime();
          if (yColumn.findIndex((item) => item === point.yPoint) === -1) {
            yColumn.push(point.yPoint);
          }
        });
      });
      yColumn.sort((a, b) => {
        return (a as number) - (b as number);
      });
      this.yColumn = yColumn;
    }

    // for xMax formating
    if (this.xPointType === CommonEnums.PointType.Number) {
      if (this.xMax <= 1 && this.xMax > 0) {
        this.xAccuracy = Math.ceil(Math.log10(4 / this.xMax));
      }
    }

    // for yMax formating
    if (this.yPointType === CommonEnums.PointType.Number) {
      if (this.yMax.yMax <= 1 && this.yMax.yMax > 0) {
        this.yAccuracy = Math.ceil(Math.log10(4 / this.yMax.yMax));
      }
      this.yAccuracy = this.yAccuracy + this.extendedYAccuracy;
    }
  }
}

export class DataSeries {
  private static counter = 0;
  chartId = 0;
  legendName: string;
  type: CommonEnums.ChartType;
  dataSeriesPoints: Array<ChartPoint> = [];
  xPointType = CommonEnums.PointType.Date;
  yPointType = CommonEnums.PointType.Number;
  xPointName: string;
  yPointName: string;
  private yMax: any;
  private yMin: any;
  groupType = CommonEnums.GroupType.Left;
  private sorted = false;

  constructor(
    dataSeriesPoints: Array<ChartPoint>,
    type: CommonEnums.ChartType = ChartType.LineChart,
    legendName = '',
    xPointName = '',
    yPointName = ''
  ) {
    this.chartId = ++DataSeries.counter;
    this.legendName = legendName;
    this.xPointName = xPointName;
    this.yPointName = yPointName;
    this.initDataSeriesPoints(dataSeriesPoints);
    this.type = type;
  }

  initDataSeriesPoints(dataSeriesPoints: Array<ChartPoint>) {
    this.dataSeriesPoints = dataSeriesPoints;

    if (this.dataSeriesPoints.length > 0) {
      const point = this.dataSeriesPoints[0];
      if (typeof point.xPoint === 'number') {
        this.xPointType = CommonEnums.PointType.Number;
      } else {
        this.xPointType = CommonEnums.PointType.Date;
      }
      if (typeof point.yPoint === 'number') {
        this.yPointType = CommonEnums.PointType.Number;
      } else {
        this.yPointType = CommonEnums.PointType.Date;
      }
    }
  }

  findYMaxFomChartData() {
    if (this.yMax) {
      return this.yMax;
    } else {
      let dataSet = this.dataSeriesPoints.filter((point) => point.drawPoint);
      if (dataSet.length === 0) {
        dataSet = this.dataSeriesPoints;
      }
      if (dataSet.length > 0) {
        let yMax = dataSet[0].yPoint;
        let xPoint = dataSet[0].xPoint;
        dataSet.forEach((point) => {
          if (point.drawPoint) {
            xPoint = yMax < point.yPoint ? point.xPoint : xPoint;
            yMax = yMax < point.yPoint ? point.yPoint : yMax;
          }
        });
        this.yMax = { yMax, xPoint };
        return { yMax, xPoint };
      } else {
        return { yMax: 0, xPoint: 0 };
      }
    }
  }

  findYMinFomChartData() {
    if (this.yMin) {
      return this.yMin;
    } else {
      let dataSet = this.dataSeriesPoints.filter((point) => point.drawPoint);
      if (dataSet.length === 0) {
        dataSet = this.dataSeriesPoints;
      }
      if (dataSet.length > 0) {
        let yMin = dataSet[0].yPoint;
        let xPoint = dataSet[0].xPoint;
        dataSet.forEach((point) => {
          xPoint = yMin > point.yPoint ? point.xPoint : xPoint;
          yMin = yMin > point.yPoint ? point.yPoint : yMin;
        });
        this.yMin = { yMin, xPoint };
        return { yMin, xPoint };
      } else {
        return { yMin: 0, xPoint: 0 };
      }
    }
  }

  findXMaxFomChartData() {
    if (!this.sorted) {
      this.sortDataSeriesPoints();
    }

    if (this.dataSeriesPoints.length > 0) {
      return this.dataSeriesPoints[this.dataSeriesPoints.length - 1].xPoint;
    } else {
      return 0;
    }
  }

  sortDataSeriesPoints() {
    this.dataSeriesPoints.sort((a, b) => {
      return (a.xPoint.getTime() as number) - (b.xPoint.getTime() as number);
      // return (a.xPoint as number) - (b.xPoint as number);
    });
    this.sorted = true;
  }
}
export class ChartPoint {
  private static counter = 0;
  pointId: string;

  xPoint: Date; //| number;
  yPoint: number //Date | number;
  drawPoint = true;
  title: string;
  object: any;

  constructor(x: Date, y: number, object = null, title = '', drawPoint = true) {
    this.xPoint = x;
    this.yPoint = y;
    this.object = object;
    this.title = title;
    this.drawPoint = drawPoint;

    this.pointId = 'point-' + ++ChartPoint.counter;
  }
}
export class ExtendedChartOptions {
  colors = [
    '#3582E8',
    '#93bbe7',
    '#0b5696',
    '#47BCFF',
    '#3575E8',
    '#34C6FF',
    '#3083E8',
    '#4165FF',
    '#17B8E8',
    '#2690FF',
    '#47BCFF',
    '#3582E8',
    '#3A66FF',
  ];
  drawName = false;
  name: string;
  nameColor = '#6c757d';
  nameFontSize = '1rem';

  drawLegend = false;
  legendTextColor = '#000000';
  legendTextFontSize = '12px';
  legendLineWidth = 1;
  legendOpacity = '0.4';
  legendTextLength = 120;
  legendRowHight = 15;

  drawDots = false;
  dotType: CommonEnums.DotType = CommonEnums.DotType.CIRCLE;
  dotColor: string = "";
  dotBorderWidth = 1;
  dotBorderRadius = 3;
  dotOpacity = '0.4';
  dotBorderSquareSideLength = 6;
  dotCrossLength = 4;
  dotAnimationTime = 1000;

  drawLine = false;
  lineType: CommonEnums.LineType;
  lineColor: string = "";
  lineWidth = '2px';
  lineAnimationTime = 1000;

  drawBar = false;
  barWidth = 30;
  barBorderWidth = 1;
  barColor: string = "";
  barOpacity = '0.4';
  barAnimationTime = 800;

  drawMin = false;
  drawMax = false;
  textMinMaxColor = '#6c757d';
  textMinMaxFontSize = '.8rem';
  textAnimationTime = 2000;

  drawXAxis = true;
  drawYAxis = true;
  drawXAxisTitle = true;
  drawXTicks = true;
  xTicksNumber = 5;
  rotateXticks = false;
  additionalTextForPoint = false;
  additionalTextForPointSize = '.8rem';
  drawYAxisTitle = true;
  drawYTicks = true;
  yTicksNumber = 5;
  axisesColor = '#D4D8DA';
  axisesWidth = '2px';
  axisesTextColor = '#6c757d';
  axisesTextFontSize = '.8rem';

  drawGrid = true;
  gridColor = 'lightgrey';
  gridWidth = '0';

  addValueTitles = true;
  nameOfTitleField = CommonEnums.NamesOfTitleField.yPoint;
  emptyDataTextSize = '2rem';
  drawAllPoints = true;

  minHeight = '250px';
  minWidth = '250px';
  cssStyle = { 'min-height': this.minHeight, 'min-width': this.minWidth };

  constructor(lineType = CommonEnums.LineType.StraightPath, drawDots = false, name = '', drawLine = false) {
    this.lineType = lineType;
    this.drawDots = drawDots;
    this.drawLine = drawLine;
    this.name = name;
    // this.dotColor = this.colors[Math.round(10 * Math.random())];
    // this.lineColor = this.colors[Math.round(10 * Math.random())];
    // this.barColor = this.colors[Math.round(10 * Math.random())];
  }

  getColor(index: number) {
    if (this.lineColor) {
      return this.lineColor;
    }

    if (this.dotColor) {
      return this.dotColor;
    }

    if (this.barColor) {
      return this.barColor;
    }

    if (index > this.colors.length - 1) {
      return this.colors[Math.round(index % (this.colors.length - 1))];
    } else {
      return this.colors[index];
    }
  }
}

export module CommonEnums {
  export enum NamesOfTitleField {
    xPoint = 'xPoint',
    yPoint = 'yPoint',
    title = 'title',
    pointXY = '(xPoint, yPoint)',
  }

  export enum ChartType {
    LineChart,
    BarChart,
    CrossDotChart,
    SquareDotChart,
    CircleDotChart,
    MixedChart,
  }

  export enum DotType {
    CIRCLE = 1,
    CROSS = 2,
    SQUARE = 3,
  }

  export enum PointType {
    Date,
    Number,
  }

  export enum LineType {
    StraightPath = 1,
    CurveLinear = 2,
    CurveStep = 3,
    CurveCardinal = 4,
    CurveBasis,
  }

  export enum GroupType {
    Left,
    Right,
  }
}

export class PieChartDataContainer {
  private static counter = 0;
  chartId = 0;

  constructor() {
    this.chartId = ++PieChartDataContainer.counter;
  }
}
