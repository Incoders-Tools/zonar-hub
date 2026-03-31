import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ImageUploadComponent } from './image-upload.component';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';

describe('ImageUploadComponent', () => {
  let component: ImageUploadComponent;
  let fixture: ComponentFixture<ImageUploadComponent>;
  let optimizationService: jasmine.SpyObj<ImageOptimizationService>;

  const createMockFile = (name = 'test.png', size = 1024, type = 'image/png'): File => {
    const content = new ArrayBuffer(size);
    return new File([content], name, { type });
  };

  beforeEach(async () => {
    optimizationService = jasmine.createSpyObj('ImageOptimizationService', ['generateResponsive']);
    optimizationService.generateResponsive.and.callFake(async (file: File) => ({
      desktop: new File([file], `desktop_${file.name}`, { type: file.type }),
      tablet: new File([file], `tablet_${file.name}`, { type: file.type }),
      mobile: new File([file], `mobile_${file.name}`, { type: file.type })
    }));

    await TestBed.configureTestingModule({
      imports: [ImageUploadComponent],
      providers: [
        { provide: ImageOptimizationService, useValue: optimizationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should process a valid file on selection', fakeAsync(() => {
    const spy = spyOn(component.imageChanged, 'emit');
    const file = createMockFile();

    component.onFileSelected({
      target: { files: [file], value: '' }
    } as unknown as Event);

    tick();
    expect(spy).toHaveBeenCalled();
    expect(component.previewUrl()).toBeTruthy();
  }));

  it('should set error when file exceeds max size', fakeAsync(() => {
    const sixMbFile = createMockFile('large.png', 6 * 1024 * 1024);

    component.onFileSelected({
      target: { files: [sixMbFile], value: '' }
    } as unknown as Event);

    tick();
    expect(component.error()).toBe('imageUpload.maxSizeExceeded');
  }));

  it('should set error for non-image files', fakeAsync(() => {
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });

    component.onFileSelected({
      target: { files: [textFile], value: '' }
    } as unknown as Event);

    tick();
    expect(component.error()).toBe('imageUpload.invalidType');
  }));

  it('should emit imageRemoved and clear preview on remove', () => {
    const spy = spyOn(component.imageRemoved, 'emit');
    component.previewUrl.set('blob:test-url');

    component.removeImage();

    expect(spy).toHaveBeenCalled();
    expect(component.previewUrl()).toBeNull();
  });

  it('should set isDragOver on dragover', () => {
    const event = new DragEvent('dragover');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');

    component.onDragOver(event);

    expect(component.isDragOver()).toBeTrue();
  });

  it('should clear isDragOver on dragleave', () => {
    component.isDragOver.set(true);
    const event = new DragEvent('dragleave');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');

    component.onDragLeave(event);

    expect(component.isDragOver()).toBeFalse();
  });

  it('should display currentImageUrl when no preview is set', () => {
    fixture.componentRef.setInput('currentImageUrl', 'https://example.com/image.png');
    fixture.detectChanges();

    expect(component.displayUrl()).toBe('https://example.com/image.png');
  });

  it('should prefer previewUrl over currentImageUrl', () => {
    fixture.componentRef.setInput('currentImageUrl', 'https://example.com/image.png');
    component.previewUrl.set('blob:local-preview');
    fixture.detectChanges();

    expect(component.displayUrl()).toBe('blob:local-preview');
  });

  it('should call optimization service when enableOptimization is true', fakeAsync(() => {
    const file = createMockFile();

    component.onFileSelected({
      target: { files: [file], value: '' }
    } as unknown as Event);

    tick();
    expect(optimizationService.generateResponsive).toHaveBeenCalledWith(file);
  }));

  it('should skip optimization when enableOptimization is false', fakeAsync(() => {
    fixture.componentRef.setInput('enableOptimization', false);
    fixture.detectChanges();

    const file = createMockFile();

    component.onFileSelected({
      target: { files: [file], value: '' }
    } as unknown as Event);

    tick();
    expect(optimizationService.generateResponsive).not.toHaveBeenCalled();
  }));
});
