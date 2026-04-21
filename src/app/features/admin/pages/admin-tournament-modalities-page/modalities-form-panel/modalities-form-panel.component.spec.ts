import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalitiesFormPanelComponent } from './modalities-form-panel.component';
import { ModalitiesFacadeService } from '../modalities-facade.service';

describe('ModalitiesFormPanelComponent', () => {
  let component: ModalitiesFormPanelComponent;
  let fixture: ComponentFixture<ModalitiesFormPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalitiesFormPanelComponent],
      providers: [
        { provide: ModalitiesFacadeService, useValue: { getNextSortOrder: () => 1, checkKeyExists: () => Promise.resolve(false), checkSortOrderExists: () => Promise.resolve(false), saveModality: () => Promise.resolve(true) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalitiesFormPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
