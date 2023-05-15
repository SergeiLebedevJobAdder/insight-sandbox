import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RandomChartComponent } from './random-chart.component';

describe('RandomChartComponent', () => {
  let component: RandomChartComponent;
  let fixture: ComponentFixture<RandomChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RandomChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RandomChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
