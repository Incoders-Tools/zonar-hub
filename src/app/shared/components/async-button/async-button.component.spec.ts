import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsyncButtonComponent } from './async-button.component';

describe('AsyncButtonComponent', () => {
  let component: AsyncButtonComponent;
  let fixture: ComponentFixture<AsyncButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsyncButtonComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(AsyncButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit clicked when not disabled or loading', () => {
    const spy = spyOn(component.clicked, 'emit');
    component.handleClick();
    expect(spy).toHaveBeenCalled();
  });
});
