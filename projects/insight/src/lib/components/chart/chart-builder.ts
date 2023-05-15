// @ts-ignore
import * as d3 from 'd3';
import { formatDate } from '@angular/common';
import { ChartMargin, DataSeries, ExtendedChartOptions, ChartDataContainer, CommonEnums } from './chart';

export class ChartBuilder {
  chartId: string = "";
  private data: ChartDataContainer = new ChartDataContainer();
  private options: ExtendedChartOptions = new ExtendedChartOptions();
  private callback: Function;
  private scaleXFunction: any;
  private svgChart: any;
  private svgLegend: any;
  private chartWidth: number = 0;
  private chartHeight: number = 0;
  private chartMargin: ChartMargin;
  private yGridDrawn = false;

  constructor(callback: Function = function () {}, top = 40, right = 40, bottom = 20, left = 50) {
    this.callback = callback;
    this.chartMargin = new ChartMargin({ top: top, right: right, bottom: bottom, left: left });
  }

  drawChart(data: ChartDataContainer, svgChart: any, svgLegend: any) {
    if (data.dataArray.length === 0) {
      return;
    }

    this.data = data;
    this.options = data.options;
    this.svgChart = svgChart;
    this.svgLegend = svgLegend;

    if (this.checkData(data)) {
      return;
    }

    this.clearChart();
    this.setUp();
    this.sketchLinesGroup(CommonEnums.GroupType.Left);
    this.drawLegend();
    this.drawChartName();
  }

  private checkData(data: ChartDataContainer) {
    let length = 0;
    data.dataArray.forEach((item) => {
      length = length + item.dataSeriesPoints.length;
    });

    if (length === 0) {
      this.drawEmptyDataText('No data');
      return true;
    }

    return false;
  }

  setUp() {
    if (!this.options.drawLegend) {
      if (this.svgLegend) {
        this.svgLegend.remove();
      }
    } else {
      const legendNode = this.svgLegend.node();
      if (legendNode && legendNode.parentNode) {
        legendNode.parentNode.setAttribute('style', 'height: 30px; overflow-y: hidden;');
      }
    }

    const area = this.svgChart.node().getBoundingClientRect();
    const width = area.width;
    const height = area.height;
    this.chartMargin.top = this.options.drawName ? 40 : 20;

    this.chartWidth = width - this.chartMargin.left - this.chartMargin.right;

    this.chartHeight = height - this.chartMargin.top - this.chartMargin.bottom;
    // if (this.data.xPointType === CommonEnums.PointType.Date ) {
    //     this.chartHeight = this.chartHeight - 25;
    // }
    if (this.options.rotateXticks) {
      this.chartHeight = this.chartHeight - 10;
    }
    const gChart = this.svgChart
      .append('g')
      .attr('id', 'chart-main')
      .attr('transform', 'translate(' + this.chartMargin.left + ',' + this.chartMargin.top + ')');

    // now we don't use these scale functions, but keep them probably for future
    // if (this.data.xPointType === CommonEnums.PointType.Number) {
    //     this.scaleXFunction = d3.scaleLinear().range([0, this.chartWidth]);
    //     this.scaleXFunction.domain(this.data.xColumn);
    // } else if (this.data.xPointType === CommonEnums.PointType.Date) {
    //     this.scaleXFunction = d3.scaleTime().range([0, this.chartWidth]);
    //     this.scaleXFunction.domain(d3.extent(this.data.xColumn, d => d));
    // }
    this.scaleXFunction = d3.scaleBand().range([0, this.chartWidth]).padding(0.2);
    this.scaleXFunction.domain(this.data.xColumn);
  }

  private sketchLinesGroup(groupType: CommonEnums.GroupType) {
    let scaleYFunc: any;
    if (this.data.yPointType === CommonEnums.PointType.Number) {
      scaleYFunc = d3.scaleLinear().range([this.chartHeight, 0]);
      scaleYFunc.domain([0, this.data.yMax.yMax]);
    } else if (this.data.yPointType === CommonEnums.PointType.Date) {
      scaleYFunc = d3.scaleTime().range([this.chartHeight, 0]);
      scaleYFunc.domain(d3.extent(this.data.yColumn, (d: any) => d));
    }

    if (this.options.drawXAxis) {
      this.drawXAxis();
    }
    if (this.options.drawYAxis) {
      this.drawYAxis(scaleYFunc, groupType);
    }

    if (!this.yGridDrawn) {
      this.drawYGrid(scaleYFunc);
    }
    console.log(this.data);
    this.data.dataArray.forEach((dataSeries, index) => {
      const color = this.options.getColor(index);
      this.sketchLines(dataSeries, color, scaleYFunc);
    });

    this.drawMaxMinText(scaleYFunc);
  }

  private sketchLines(data: DataSeries, color: any, scaleYFunc: any) {
    const g = this.svgChart.select('g#chart-main');

    const maxY = this.data.yMax.yMax;

    const initialDataSet = data.dataSeriesPoints;
    let dataSet;
    if (this.options.drawAllPoints) {
      dataSet = initialDataSet;
    } else {
      dataSet = initialDataSet.filter((item) => item.drawPoint);
    }
    if (this.options.drawLine) {
      this.drawLine(g, dataSet, color, scaleYFunc);
    }

    if (this.options.drawDots) {
      switch (this.options.dotType) {
        case CommonEnums.DotType.CIRCLE:
          this.drawCircle(g, dataSet, color, scaleYFunc);
          break;
        case CommonEnums.DotType.CROSS:
          this.drawCross(g, dataSet, color, scaleYFunc);
          break;
        case CommonEnums.DotType.SQUARE:
          this.drawSquare(g, dataSet, color, scaleYFunc);
          break;
      }
    }

    if (this.options.drawBar) {
      this.drawBar(g, dataSet, color, scaleYFunc, maxY);
    }
  }

  private drawMaxMinText(scaleYFunc: any) {
    if (this.options.drawMin || this.options.drawMax) {
      const g = this.svgChart.select('g#chart-main');

      const maxY = this.data.yMax.yMax;
      const xPointMaxY = this.data.yMax.xPoint;

      const minY = this.data.yMin.yMin;
      const xPointMinY = this.data.yMin.xPoint;

      if (this.options.drawMin) {
        let formattedMinY;
        if (this.data.yPointType === CommonEnums.PointType.Date) {
          formattedMinY = formatDate(minY, this.data.dateFormatter, 'en-US');
        } else if (this.data.yPointType === CommonEnums.PointType.Number) {
          formattedMinY = this.numberFormatter(minY, this.data.yAccuracy);
        }
        this.drawText(g, scaleYFunc, formattedMinY, xPointMinY, minY);
      }

      if (this.options.drawMax) {
        let formattedMaxY;
        if (this.data.yPointType === CommonEnums.PointType.Date) {
          formattedMaxY = formatDate(maxY, this.data.dateFormatter, 'en-US');
        } else if (this.data.yPointType === CommonEnums.PointType.Number) {
          formattedMaxY = this.numberFormatter(maxY, this.data.yAccuracy);
        }
        this.drawText(g, scaleYFunc, formattedMaxY, xPointMaxY, maxY);
      }
    }
  }

  private drawLine(g: any, dataSet: any, mainColor: any, scaleYFunc: any) {
    let color = mainColor;
    if (this.options.lineColor) {
      color = this.options.lineColor;
    }

    let lineFunction = d3
      .line()
      .x((d: any) => this.scaleXFunction(d.xPoint) + this.scaleXFunction.bandwidth() / 2)
      .y((d: any) => scaleYFunc(d.yPoint));

    switch (this.options.lineType) {
      case CommonEnums.LineType.CurveCardinal:
        lineFunction = lineFunction.curve(d3.curveCardinal);
        break;
      case CommonEnums.LineType.CurveLinear:
        lineFunction = lineFunction.curve(d3.curveLinear);
        break;
      case CommonEnums.LineType.CurveStep:
        lineFunction = lineFunction.curve(d3.curveStep);
        break;
      case CommonEnums.LineType.CurveBasis:
        lineFunction = lineFunction.curve(d3.curveBasis);
        break;
    }

    const path = g
      .append('path')
      .datum(dataSet)
      .attr('class', 'line')
      .attr('d', lineFunction)
      .style('fill', 'none')
      .style('stroke', color)
      .style('stroke-width', this.options.lineWidth)
      .style('background', '#eee');

    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .ease(d3.easeLinear)
      .duration(this.options.lineAnimationTime)
      .attr('stroke-dashoffset', 0);
  }

  private drawCircle(g: any, dataSet: any, mainColor: any, scaleYFunc: any) {
    let color = mainColor;
    if (this.options.dotColor) {
      color = this.options.dotColor;
    }

    const self = this;
    const circle = g.selectAll('.dot').data(dataSet);
    circle
      .enter()
      .append('circle')
      .attr('class', 'point-circle')
      .attr('id', (d: any) => d.pointId)
      .attr('stroke', color)
      .attr('stroke-width', this.options.dotBorderWidth)
      .attr('fill', color)
      .attr('fill-opacity', this.options.dotOpacity)
      .attr('opacity', 0.7)
      .attr('r', this.options.dotBorderRadius)
      .attr('cy', scaleYFunc(0))
      .attr('cx', 0)
      .on('mouseover', (cp: any) => {
        self.onMouseOverElement(d3.select(this), cp);
      })
      .on('mouseout', (cp: any) => {
        self.onMouseLeaveElement(d3.select(this), cp);
      })
      .transition()
      .duration(this.options.dotAnimationTime)
      .attr('cy', (d: any) => scaleYFunc(d.yPoint))
      .attr('cx', (d: any, i: number) => this.scaleXFunction(d.xPoint) + this.scaleXFunction.bandwidth() / 2);

    if (this.options.addValueTitles) {
      switch (this.options.nameOfTitleField) {
        case CommonEnums.NamesOfTitleField.yPoint:
          if (this.data.yPointType === CommonEnums.PointType.Date) {
            const formatTime = d3.timeFormat(this.data.dateFormatter);
            g.selectAll('circle')
              .append('svg:title')
              .text((d: any) => formatTime(d.yPoint));
          } else if (this.data.yPointType === CommonEnums.PointType.Number) {
            g.selectAll('circle')
              .append('svg:title')
              .text((d: any) => this.numberFormatter(d.yPoint, this.data.yAccuracy));
          }
          break;
        case CommonEnums.NamesOfTitleField.xPoint:
          if (this.data.xPointType === CommonEnums.PointType.Date) {
            const formatTime = d3.timeFormat(this.data.dateFormatter);
            g.selectAll('circle')
              .append('svg:title')
              .text((d: any) => formatTime(d.xPoint));
          } else if (this.data.xPointType === CommonEnums.PointType.Number) {
            g.selectAll('circle')
              .append('svg:title')
              .text((d: any) => this.numberFormatter(d.xPoint, this.data.xAccuracy));
          }
          break;
        case CommonEnums.NamesOfTitleField.title:
          g.selectAll('circle')
            .append('svg:title')
            .text((d: any) => d.title);
          break;
        case CommonEnums.NamesOfTitleField.pointXY:
          g.selectAll('circle')
            .append('svg:title')
            .text(
              (d: any) =>
                `(${this.numberFormatter(d.xPoint, this.data.xAccuracy)},${this.numberFormatter(
                  d.yPoint,
                  this.data.yAccuracy
                )})`
            );
          break;
        default:
          break;
      }
    }
  }

  private drawCross(g: any, dataSet: any, mainColor: any, scaleYFunc: any) {
    let color = mainColor;
    if (this.options.dotColor) {
      color = this.options.dotColor;
    }

    const self = this;
    const dotCrossLength = this.options.dotCrossLength;
    const leftLine = g.selectAll('.dot1').data(dataSet);
    leftLine
      .enter()
      .append('line')
      .attr('class', 'left-point-cross')
      .attr('id', (d: any) => `left${d.pointId}`)
      .attr('stroke', color)
      .attr('stroke-width', this.options.dotBorderWidth)
      .attr('opacity', 0.7)
      .attr('x1', 0 - dotCrossLength)
      .attr('y1', scaleYFunc(0) - dotCrossLength)
      .attr('x2', 0 + dotCrossLength)
      .attr('y2', scaleYFunc(0) + dotCrossLength)
      .on('mouseover', (cp: any) => {
        self.onMouseOverElement(d3.select(this), cp);
      })
      .on('mouseout', (cp: any) => {
        self.onMouseLeaveElement(d3.select(this), cp);
      })
      .transition()
      .duration(this.options.dotAnimationTime)
      .attr('x1', (d: any, i: number) => this.scaleXFunction(d.xPoint) + this.scaleXFunction.bandwidth() / 2 - dotCrossLength)
      .attr('y1', (d: any) => scaleYFunc(d.yPoint) - dotCrossLength)
      .attr('x2', (d: any, i: number) => this.scaleXFunction(d.xPoint) + this.scaleXFunction.bandwidth() / 2 + dotCrossLength)
      .attr('y2', (d: any) => scaleYFunc(d.yPoint) + dotCrossLength);

    const rightLine = g.selectAll('.dot2').data(dataSet);
    rightLine
      .enter()
      .append('line')
      .attr('class', 'rigth-point-cross')
      .attr('id', (d: any) => `rigth${d.pointId}`)
      .attr('stroke', color)
      .attr('stroke-width', this.options.dotBorderWidth)
      .attr('opacity', 0.7)
      .attr('x1', 0 - dotCrossLength)
      .attr('y1', scaleYFunc(0) + dotCrossLength)
      .attr('x2', 0 + dotCrossLength)
      .attr('y2', scaleYFunc(0) - dotCrossLength)
      .on('mouseover', (cp: any) => {
        self.onMouseOverElement(d3.select(this), cp);
      })
      .on('mouseout', (cp: any) => {
        self.onMouseLeaveElement(d3.select(this), cp);
      })
      .transition()
      .duration(this.options.dotAnimationTime)
      .attr('x1', (d: any, i: number) => this.scaleXFunction(d.xPoint) + this.scaleXFunction.bandwidth() / 2 - dotCrossLength)
      .attr('y1', (d: any) => scaleYFunc(d.yPoint) + dotCrossLength)
      .attr('x2', (d: any, i: number) => this.scaleXFunction(d.xPoint) + this.scaleXFunction.bandwidth() / 2 + dotCrossLength)
      .attr('y2', (d: any) => scaleYFunc(d.yPoint) - dotCrossLength);

    if (this.options.addValueTitles) {
      switch (this.options.nameOfTitleField) {
        case CommonEnums.NamesOfTitleField.yPoint:
          if (this.data.yPointType === CommonEnums.PointType.Date) {
            const formatTime = d3.timeFormat(this.data.dateFormatter);
            dataSet.forEach((item: any) =>
              g.select(`#left${item.pointId}`).append('svg:title').text(formatTime(item.yPoint))
            );
            dataSet.forEach((item: any) =>
              g.select(`#rigth${item.pointId}`).append('svg:title').text(formatTime(item.yPoint))
            );
          } else if (this.data.yPointType === CommonEnums.PointType.Number) {
            dataSet.forEach((item: any) =>
              g
                .select(`#left${item.pointId}`)
                .append('svg:title')
                .text(this.numberFormatter(item.yPoint, this.data.yAccuracy))
            );
            dataSet.forEach((item: any) =>
              g
                .select(`#rigth${item.pointId}`)
                .append('svg:title')
                .text(this.numberFormatter(item.yPoint, this.data.yAccuracy))
            );
          }
          break;
        case CommonEnums.NamesOfTitleField.xPoint:
          if (this.data.xPointType === CommonEnums.PointType.Date) {
            const formatTime = d3.timeFormat(this.data.dateFormatter);
            dataSet.forEach((item: any) =>
              g.select(`#left${item.pointId}`).append('svg:title').text(formatTime(item.xPoint))
            );
            dataSet.forEach((item: any) =>
              g.select(`#rigth${item.pointId}`).append('svg:title').text(formatTime(item.xPoint))
            );
          } else if (this.data.xPointType === CommonEnums.PointType.Number) {
            dataSet.forEach((item: any) =>
              g
                .select(`#left${item.pointId}`)
                .append('svg:title')
                .text(this.numberFormatter(item.xPoint, this.data.xAccuracy))
            );
            dataSet.forEach((item: any) =>
              g
                .select(`#rigth${item.pointId}`)
                .append('svg:title')
                .text(this.numberFormatter(item.xPoint, this.data.xAccuracy))
            );
          }
          break;
        case CommonEnums.NamesOfTitleField.title:
          dataSet.forEach((item: any) => g.select(`#left${item.pointId}`).append('svg:title').text(item.title));
          dataSet.forEach((item: any) => g.select(`#rigth${item.pointId}`).append('svg:title').text(item.title));
          break;
        case CommonEnums.NamesOfTitleField.pointXY:
          dataSet.forEach((item: any) =>
            g
              .select(`#left${item.pointId}`)
              .append('svg:title')
              .text(
                `(${this.numberFormatter(item.xPoint, this.data.xAccuracy)},${this.numberFormatter(
                  item.yPoint,
                  this.data.yAccuracy
                )})`
              )
          );
          dataSet.forEach((item: any) =>
            g
              .select(`#rigth${item.pointId}`)
              .append('svg:title')
              .text(
                `(${this.numberFormatter(item.xPoint, this.data.xAccuracy)},${this.numberFormatter(
                  item.yPoint,
                  this.data.yAccuracy
                )})`
              )
          );
          break;
        default:
          break;
      }
    }
  }

  private drawSquare(g: any, dataSet: any, mainColor: any, scaleYFunc: any) {
    let color = mainColor;
    if (this.options.dotColor) {
      color = this.options.dotColor;
    }

    const self = this;
    const square = g.selectAll('.dot').data(dataSet);
    square
      .enter()
      .append('rect')
      .attr('class', 'point-square')
      .attr('id', (d: any) => d.pointId)
      .attr('stroke', color)
      .attr('stroke-width', this.options.dotBorderWidth)
      .attr('fill', color)
      .attr('fill-opacity', this.options.dotOpacity)
      .attr('opacity', 0.7)
      .attr('width', this.options.dotBorderSquareSideLength)
      .attr('height', this.options.dotBorderSquareSideLength)
      .attr('x', 0 - this.options.dotBorderSquareSideLength / 2)
      .attr('y', scaleYFunc(0) - this.options.dotBorderSquareSideLength / 2)
      .on('mouseover', (cp: any) => {
        self.onMouseOverElement(d3.select(this), cp);
      })
      .on('mouseout', (cp: any) => {
        self.onMouseLeaveElement(d3.select(this), cp);
      })
      .transition()
      .duration(this.options.dotAnimationTime)
      .attr(
        'x',
        (d: any, i: number) =>
          this.scaleXFunction(d.xPoint) +
          this.scaleXFunction.bandwidth() / 2 -
          this.options.dotBorderSquareSideLength / 2
      )
      .attr('y', (d: any) => scaleYFunc(d.yPoint) - this.options.dotBorderSquareSideLength / 2);

    if (this.options.addValueTitles) {
      switch (this.options.nameOfTitleField) {
        case CommonEnums.NamesOfTitleField.yPoint:
          if (this.data.yPointType === CommonEnums.PointType.Date) {
            const formatTime = d3.timeFormat(this.data.dateFormatter);
            g.selectAll('rect')
              .append('svg:title')
              .text((d: any) => formatTime(d.yPoint));
          } else if (this.data.yPointType === CommonEnums.PointType.Number) {
            g.selectAll('rect')
              .append('svg:title')
              .text((d: any) => this.numberFormatter(d.yPoint, this.data.yAccuracy));
          }
          break;
        case CommonEnums.NamesOfTitleField.xPoint:
          if (this.data.xPointType === CommonEnums.PointType.Date) {
            const formatTime = d3.timeFormat(this.data.dateFormatter);
            g.selectAll('rect')
              .append('svg:title')
              .text((d: any) => formatTime(d.xPoint));
          } else if (this.data.xPointType === CommonEnums.PointType.Number) {
            g.selectAll('rect')
              .append('svg:title')
              .text((d: any) => this.numberFormatter(d.xPoint, this.data.xAccuracy));
          }
          break;
        case CommonEnums.NamesOfTitleField.title:
          g.selectAll('rect')
            .append('svg:title')
            .text((d: any) => d.title);
          break;
        case CommonEnums.NamesOfTitleField.pointXY:
          g.selectAll('rect')
            .append('svg:title')
            .text(
              (d: any) =>
                `(${this.numberFormatter(d.xPoint, this.data.xAccuracy)},${this.numberFormatter(
                  d.yPoint,
                  this.data.yAccuracy
                )})`
            );
          break;
        default:
          break;
      }
    }
  }

  private drawBar(g: any, dataSet: any, mainColor: any, scaleYFunc: any, maxY: any) {
    let color = mainColor;
    if (this.options.barColor) {
      color = this.options.barColor;
    }

    const self = this;
    const bars = g.selectAll('.bar').data(dataSet);
    bars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('id', (d: any) => d.pointId)
      .attr('stroke', color)
      .attr('stroke-width', this.options.barBorderWidth)
      .attr('fill', color)
      .attr('fill-opacity', this.options.barOpacity)
      .attr('opacity', 0.7)
      .attr('x', (d: any, i: number) => this.scaleXFunction(d.xPoint))
      .attr('width', this.scaleXFunction.bandwidth())
      .attr('y', scaleYFunc(0))
      .attr('height', 0)
      .on('mouseover', (cp: any) => {
        self.onMouseOverElement(d3.select(this), cp);
      })
      .on('mouseout', (cp: any) => {
        self.onMouseLeaveElement(d3.select(this), cp);
      })
      .on('click', (d: any) => self.onMouseClick(d))
      .transition()
      .duration(this.options.barAnimationTime)
      .attr('y', (d: any) => scaleYFunc(d.yPoint))
      .attr('height', function (d: any) {
        const scaleYFuncValue = scaleYFunc(maxY - d.yPoint);
        return scaleYFuncValue === 0 ? 1 : scaleYFuncValue;
      });

    if (this.options.additionalTextForPoint) {
      bars
        .enter()
        .append('text')
        .attr('x', (d: any, i: number) => this.scaleXFunction(d.xPoint) + 15)
        .attr('y', scaleYFunc(0) - 15)
        .attr('dy', '.5rem')
        .style('font-size', this.options.additionalTextForPointSize)
        .style('fill', this.options.textMinMaxColor)
        .style('text-anchor', 'middle')
        .text((d: any) => d.title)
        .style('opacity', '0')
        .transition()
        .duration(this.options.textAnimationTime)
        .style('opacity', '1');
    }

    if (this.options.addValueTitles) {
      switch (this.options.nameOfTitleField) {
        case CommonEnums.NamesOfTitleField.yPoint:
          if (this.data.yPointType === CommonEnums.PointType.Date) {
            const formatTime = d3.timeFormat(this.data.dateFormatter);
            g.selectAll('rect')
              .append('svg:title')
              .text((d: any) => formatTime(d.yPoint));
          } else if (this.data.yPointType === CommonEnums.PointType.Number) {
            g.selectAll('rect')
              .append('svg:title')
              .text((d: any) => this.numberFormatter(d.yPoint, this.data.yAccuracy));
          }
          break;
        case CommonEnums.NamesOfTitleField.xPoint:
          if (this.data.xPointType === CommonEnums.PointType.Date) {
            const formatTime = d3.timeFormat(this.data.dateFormatter);
            g.selectAll('rect')
              .append('svg:title')
              .text((d: any) => formatTime(d.xPoint));
          } else if (this.data.xPointType === CommonEnums.PointType.Number) {
            g.selectAll('rect')
              .append('svg:title')
              .text((d: any) => this.numberFormatter(d.xPoint, this.data.xAccuracy));
          }
          break;
        case CommonEnums.NamesOfTitleField.title:
          g.selectAll('rect')
            .append('svg:title')
            .text((d: any) => d.title);
          break;
        case CommonEnums.NamesOfTitleField.pointXY:
          g.selectAll('rect')
            .append('svg:title')
            .text(
              (d: any) =>
                `(${this.numberFormatter(d.xPoint, this.data.xAccuracy)},${this.numberFormatter(
                  d.yPoint,
                  this.data.yAccuracy
                )})`
            );
          break;
        default:
          break;
      }
    }
  }

  private drawText(g: any, scaleYFunc: any, yText: any, xPos: any, yPos: any) {
    const text = g
      .append('text')
      .attr('x', this.scaleXFunction(xPos) + this.scaleXFunction.bandwidth() / 2)
      .attr('y', scaleYFunc(yPos) - 15)
      .attr('dy', '.5rem')
      .style('font-size', this.options.textMinMaxFontSize)
      .style('fill', this.options.textMinMaxColor)
      .style('text-anchor', 'middle')
      .text(yText)
      .style('opacity', '0')
      .transition()
      .duration(this.options.textAnimationTime)
      .style('opacity', '1');
  }

  private drawXAxis() {
    const g = this.svgChart.select('g#chart-main');

    if (this.options.drawXTicks) {
      if (this.data.xPointType === CommonEnums.PointType.Date) {
        g.append('g')
          .attr('class', 'axis axis-x')
          .attr('transform', 'translate(0,' + this.chartHeight + ')')
          .call(
            d3
              .axisBottom(this.scaleXFunction)
              .ticks(this.options.xTicksNumber)
              .tickFormat(d3.timeFormat(this.data.dateFormatter))
          );
      } else if (this.data.xPointType === CommonEnums.PointType.Number) {
        g.append('g')
          .attr('class', 'axis axis-x')
          .attr('transform', 'translate(0,' + this.chartHeight + ')')
          .call(
            d3
              .axisBottom(this.scaleXFunction)
              .ticks(this.options.xTicksNumber)
              .tickFormat((d: any) => this.numberFormatter(d, this.data.xAccuracy))
          );
      }
    } else {
      g.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', 'translate(0,' + this.chartHeight + ')')
        .call(
          d3
            .axisBottom(this.scaleXFunction)
            .ticks(this.options.xTicksNumber)
            .tickFormat(() => '')
        );
    }

    if (this.options.rotateXticks) {
      g.selectAll('.tick text').attr('transform', 'rotate(-45) translate(-20, -5)');
    }

    if (this.options.drawXAxisTitle) {
      const xPos = this.chartWidth + this.chartMargin.right / 2;
      g.append('text')
        .attr('x', xPos)
        .attr('y', this.chartHeight)
        .attr('dy', '.5rem')
        .style('font-size', this.options.axisesTextFontSize)
        .style('fill', this.options.axisesTextColor)
        .style('text-anchor', 'middle')
        .text(this.data.xPointName);
    }
  }

  private drawYAxis(scaleYFunc: any, groupType: CommonEnums.GroupType) {
    const g = this.svgChart.select('g#chart-main');
    let axisFunc = d3.axisLeft(scaleYFunc);
    let translate = 0;
    let axisClass = 'axis-y';
    if (groupType === CommonEnums.GroupType.Left) {
      axisClass += 'axis-left';
    }
    if (groupType === CommonEnums.GroupType.Right) {
      axisClass += 'axis-right';
      axisFunc = d3.axisRight(scaleYFunc);
      translate = this.chartWidth;
    }

    if (this.options.drawYTicks) {
      if (this.data.yPointType === CommonEnums.PointType.Number) {
        g.append('g')
          .attr('class', axisClass)
          .attr('transform', 'translate( ' + translate + ', 0 )')
          .call(
            axisFunc.ticks(this.options.yTicksNumber).tickFormat((d: any) => this.numberFormatter(d, this.data.yAccuracy))
          );
      } else if (this.data.yPointType === CommonEnums.PointType.Date) {
        g.append('g')
          .attr('class', axisClass)
          .attr('transform', 'translate( ' + translate + ', 0 )')
          .call(axisFunc.ticks(this.options.yTicksNumber).tickFormat(d3.timeFormat(this.data.dateFormatter)));
      }
    } else {
      g.append('g')
        .attr('class', axisClass)
        .attr('transform', 'translate( ' + translate + ', 0 )')
        .call(axisFunc.ticks(this.options.yTicksNumber).tickFormat(() => ''));
    }

    if (this.options.drawYAxisTitle) {
      const axislabel = this.data.yPointName;
      const xPos = groupType === CommonEnums.GroupType.Left ? 0 : this.chartWidth;
      g.append('text')
        .attr('x', xPos - 30)
        .attr('y', 0 - this.chartMargin.top / 2 - 7)
        .attr('dy', '.5rem')
        .style('font-size', this.options.axisesTextFontSize)
        .style('fill', this.options.axisesTextColor)
        .style('text-anchor', 'middle')
        .text(axislabel);
      this.styleAxises();
      this.styleGrid();
    }
  }

  private drawYGrid(scaleYFunc: any) {
    if (this.options.drawGrid) {
      this.yGridDrawn = true;
      this.svgChart
        .select('g#chart-main')
        .append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(scaleYFunc).ticks(5).tickSize(-this.chartWidth).tickFormat(null));

      this.styleGrid();
    }
  }

  private styleAxises() {
    d3.selectAll('.domain')
      .style('fill', 'none')
      .style('stroke', this.options.axisesColor)
      .style('stroke-width', this.options.axisesWidth)
      .style('shape-rendering', 'crispEdges');
  }

  private styleGrid() {
    d3.selectAll('.grid path').style('stroke-width', this.options.gridWidth);
    d3.selectAll('.grid line')
      .style('stroke-opacity', '0.7')
      .style('stroke', this.options.gridColor)
      .style('shape-rendering', 'crispEdges');
  }

  private drawChartName() {
    if (this.options.drawName) {
      if (!this.options.name) {
        return;
      }
      const length = this.options.name.length;
      const g = this.svgChart.select('g#chart-main');
      g.append('text')
        .attr('class', 'chart-name')
        .attr('transform', 'translate(' + (this.chartWidth - 7 * length) / 2 + ',-35 )')
        .attr('dy', '1em')
        .style('font-size', this.options.nameFontSize)
        .style('fill', this.options.nameColor)
        .text(this.options.name);
    }
  }

  clearChart() {
    this.yGridDrawn = false;
    if (this.svgChart) {
      this.svgChart.select('g#chart-main').remove();
    }
    if (this.svgLegend) {
      this.svgLegend.select('g#chart-legend').remove();
    }
  }

  private wrap(width: any, g: any) {
    const texts = g.selectAll('text');
    texts._groups[0].forEach((item: any) => {
      let textLength = item.getComputedTextLength();
      let text = item.textContent;
      while (textLength > width && text.length > 0) {
        text = text.slice(0, -1);
        item.textContent = text + '...';
        textLength = item.getComputedTextLength();
      }
    });
  }

  private drawLegend() {
    if (this.options.drawLegend) {
      const g = this.svgLegend.append('g').attr('id', 'chart-legend');
      let y = 10;
      let x = this.chartMargin.left;
      this.data.dataArray.forEach((dataSeries, index) => {
        const color = this.options.getColor(index);

        if (this.options.drawLine) {
          g.append('line')
            .attr('class', 'point-cross')
            .attr('stroke', color)
            .attr('stroke-width', 3)
            .attr('x1', x)
            .attr('y1', y + 5)
            .attr('x2', x + 35)
            .attr('y2', y + 5);
          x = x + 40;
          g.append('text')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', '.5rem')
            .style('font-size', this.options.legendTextFontSize)
            .style('fill', this.options.legendTextColor)
            .text(dataSeries.legendName);
          x = x + this.options.legendTextLength;
          if (x + (this.options.legendTextLength + 40) >= this.chartWidth) {
            x = this.chartMargin.left;
            y = y + this.options.legendRowHight;
          } else {
            x = x + 10;
          }
        } else if (this.options.drawDots) {
          switch (this.options.dotType) {
            case CommonEnums.DotType.CIRCLE:
              g.append('circle')
                .attr('class', 'point-circle')
                .attr('stroke', color)
                .attr('stroke-width', this.options.dotBorderWidth)
                .attr('fill', color)
                .attr('fill-opacity', this.options.dotOpacity)
                .attr('r', this.options.dotBorderRadius)
                .attr('cx', x)
                .attr('cy', y + 5);
              x = x + 15;
              g.append('text')
                .attr('x', x)
                .attr('y', y)
                .attr('dy', '.5rem')
                .style('font-size', this.options.legendTextFontSize)
                .style('fill', this.options.legendTextColor)
                .text(dataSeries.legendName);
              break;
            case CommonEnums.DotType.CROSS:
              const dotCrosslength = this.options.dotCrossLength;
              g.append('line')
                .attr('class', 'point-cross')
                .attr('stroke', color)
                .attr('stroke-width', this.options.dotBorderWidth)
                .attr('x1', x - dotCrosslength)
                .attr('y1', y + 5 - dotCrosslength)
                .attr('x2', x + dotCrosslength)
                .attr('y2', y + 5 + dotCrosslength);

              g.append('line')
                .attr('class', 'point-cross')
                .attr('stroke', color)
                .attr('stroke-width', this.options.dotBorderWidth)
                .attr('x1', x - dotCrosslength)
                .attr('y1', y + 5 + dotCrosslength)
                .attr('x2', x + dotCrosslength)
                .attr('y2', y + 5 - dotCrosslength);
              x = x + 15;
              g.append('text')
                .attr('x', x)
                .attr('y', y)
                .attr('dy', '.5rem')
                .style('font-size', this.options.legendTextFontSize)
                .style('fill', this.options.legendTextColor)
                .text(dataSeries.legendName);
              break;
            case CommonEnums.DotType.SQUARE:
              g.append('rect')
                .attr('class', 'point-square')
                .attr('stroke', color)
                .attr('stroke-width', this.options.dotBorderWidth)
                .attr('fill', color)
                .attr('fill-opacity', this.options.dotOpacity)
                .attr('width', this.options.dotBorderSquareSideLength)
                .attr('height', this.options.dotBorderSquareSideLength)
                .attr('x', x - this.options.dotBorderSquareSideLength / 2)
                .attr('y', y + 5 - this.options.dotBorderSquareSideLength / 2);
              x = x + 15;
              g.append('text')
                .attr('x', x)
                .attr('y', y)
                .attr('dy', '.5rem')
                .style('font-size', this.options.legendTextFontSize)
                .style('fill', this.options.legendTextColor)
                .text(dataSeries.legendName);
              break;
          }
          x = x + this.options.legendTextLength;
          if (x + (this.options.legendTextLength + 5) >= this.chartWidth) {
            x = this.chartMargin.left;
            y = y + this.options.legendRowHight;
          } else {
            x = x + 10;
          }
        } else if (this.options.drawBar) {
          g.append('rect')
            .attr('class', 'point-cross')
            .attr('stroke', color)
            .attr('stroke-width', this.options.barBorderWidth)
            .attr('fill', color)
            .attr('fill-opacity', this.options.barOpacity)
            .attr('x', x)
            .attr('width', 5)
            .attr('y', y + 4)
            .attr('height', 3);
          x = x + 8;
          g.append('rect')
            .attr('class', 'point-cross')
            .attr('stroke', color)
            .attr('stroke-width', this.options.barBorderWidth)
            .attr('fill', color)
            .attr('fill-opacity', this.options.barOpacity)
            .attr('x', x)
            .attr('width', 5)
            .attr('y', y)
            .attr('height', 7);
          x = x + 8;
          g.append('rect')
            .attr('class', 'point-cross')
            .attr('stroke', color)
            .attr('stroke-width', this.options.barBorderWidth)
            .attr('fill', color)
            .attr('fill-opacity', this.options.barOpacity)
            .attr('x', x)
            .attr('width', 5)
            .attr('y', y + 2)
            .attr('height', 5);
          x = x + 10;
          g.append('text')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', '.5rem')
            .style('font-size', this.options.legendTextFontSize)
            .style('fill', this.options.legendTextColor)
            .text(dataSeries.legendName);
          x = x + this.options.legendTextLength;
          if (x + (this.options.legendTextLength + 10) >= this.chartWidth) {
            x = this.chartMargin.left;
            y = y + this.options.legendRowHight;
          } else {
            x = x + 10;
          }
        }
      });

      this.wrap(this.options.legendTextLength, g);

      const legendNode = this.svgLegend.node();
      if (y > 30) {
        legendNode.parentNode.setAttribute('style', 'height: 30px; overflow-y: auto;');
        legendNode.setAttribute('style', `height: ${y}px;`);
      } else {
        legendNode.parentNode.setAttribute('style', 'height: 30px; overflow-y: hidden;');
      }
    }
  }

  private drawEmptyDataText(emptyDataText: string) {
    const gChart = this.svgChart.append('g').attr('id', 'chart-main');
    const g = this.svgChart.select('g#chart-main');
    const text = g
      .append('text')
      .attr('x', 100)
      .attr('y', 50)
      .attr('dy', '.5rem')
      .style('font-size', this.options.emptyDataTextSize)
      .style('fill', this.options.textMinMaxColor)
      .style('text-anchor', 'middle')
      .text(emptyDataText)
      .style('opacity', '0')
      .transition()
      .duration(this.options.textAnimationTime)
      .style('opacity', '1');
  }

  private onMouseClick(element: any) {
    if (this.callback) {
      this.callback(element, 'click');
    }
  }

  private onMouseOverElement(d3Element: any, element: any) {
    this.highlightElement(d3Element);
    if (this.callback) {
      this.callback(element, 'mouseover');
    }
  }

  private onMouseLeaveElement(d3Element: any, element: any) {
    this.unHighlightElement(d3Element);
    if (this.callback) {
      this.callback(element, 'mouseout');
    }
  }

  private highlightElement(d3Element: any) {
    d3Element.attr('opacity', 1);
  }

  private unHighlightElement(d3Element: any) {
    d3Element.attr('opacity', 0.7);
  }

  public onMouseOver(id: string) {
    const g = this.svgChart.select('g#chart-main');
    const d3Element = g.select(`#${id}`);
    this.highlightElement(d3Element);
  }

  public onMouseOut(id: string) {
    const g = this.svgChart.select('g#chart-main');
    const d3Element = g.select(`#${id}`);
    this.unHighlightElement(d3Element);
  }

  numberFormatter(input: any, numberOfDecimals: number) {
    return parseFloat(input).toLocaleString('EN', {
      minimumFractionDigits: numberOfDecimals,
      maximumFractionDigits: numberOfDecimals,
    });
  }
}

// format specifier	resulting formatted number
// d3.time.format("%Y-%m-%d")	1986-01-28
// d3.time.format("%m/%d/%Y")	01/28/1986
// d3.time.format("%H:%M")	11:39
// d3.time.format("%H:%M %p")	11:39 AM
// d3.time.format("%B %d")	January 28
// d3.time.format("%d %b")	28 Jan
// d3.time.format("%d-%b-%y")	28-Jan-86
// d3.time.format("%S s")	13 s
// d3.time.format("%M m")	39 m
// d3.time.format("%H h")	11 h
// d3.time.format("%a")	Tue
// d3.time.format("%A")	Tuesday
// d3.time.format("%d d")	28 d
// d3.time.format("%b")	Jan
// d3.time.format("%m/%Y")	01/1986
// d3.time.format("%b %Y")	Jan 1986
// d3.time.format("%B")	January
// d3.time.format("%c")	Tue Jan 28 11:39:13 1986
// d3.time.format("%d")	28
// d3.time.format("%e")	28
// d3.time.format("%H")	11
// d3.time.format("%I")	11
// d3.time.format("%j")	028
// d3.time.format("%m")	01
// d3.time.format("%M")	39
// d3.time.format("%L")	000
// d3.time.format("%p")	AM
// d3.time.format("%S")	13
// d3.time.format("%U")	04
// d3.time.format("%w")	2
// d3.time.format("%W")	04
// d3.time.format("%x")	01/28/1986
// d3.time.format("%X")	11:39:13
// d3.time.format("%y")	86
// d3.time.format("%Z")	+1300
