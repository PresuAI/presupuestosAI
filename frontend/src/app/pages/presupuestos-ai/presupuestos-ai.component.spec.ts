import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresupuestosAiComponent } from './presupuestos-ai.component';

describe('PresupuestosAiComponent', () => {
  let component: PresupuestosAiComponent;
  let fixture: ComponentFixture<PresupuestosAiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresupuestosAiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresupuestosAiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
