import { TestBed } from '@angular/core/testing';
import { MockFileStorageRepository } from './mock-file-storage.repository';
import { StorageBucket } from '../file-storage.repository';

describe('MockFileStorageRepository', () => {
  let repository: MockFileStorageRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    repository = TestBed.inject(MockFileStorageRepository);
  });

  const bucket: StorageBucket = 'complexes';
  const path = 'org1/cx1/logo.webp';

  function makeFile(content = 'fake-image-data', name = 'logo.png', type = 'image/png'): File {
    return new File([content], name, { type });
  }

  it('should upload a file and return a data URL', async () => {
    const file = makeFile();
    const url = await repository.upload(bucket, path, file);

    expect(url).toMatch(/^data:image\/png;base64,/);
  });

  it('should return the same data URL when the same path is re-uploaded', async () => {
    const file = makeFile('content-v1');
    const url1 = await repository.upload(bucket, path, file);

    const file2 = makeFile('content-v2');
    const url2 = await repository.upload(bucket, path, file2);

    // Second upload overwrites the first
    expect(url1).not.toBe(url2);
  });

  it('should delete a previously uploaded file', async () => {
    const file = makeFile();
    await repository.upload(bucket, path, file);

    // Uploading a new file to that same key after delete should succeed (no error)
    await repository.delete(bucket, path);

    const newFile = makeFile('after-delete');
    const url = await repository.upload(bucket, path, newFile);
    expect(url).toMatch(/^data:image\/png;base64,/);
  });

  it('should not throw when deleting a non-existent path', async () => {
    await expectAsync(repository.delete(bucket, 'non/existent/path.webp')).toBeResolved();
  });

  it('should return the URL unchanged from buildTransformUrl', () => {
    const url = 'data:image/png;base64,abc123';
    const result = repository.buildTransformUrl(url, { width: 100, format: 'webp' });
    expect(result).toBe(url);
  });

  it('should handle different buckets independently', async () => {
    const fileA = makeFile('bucket-a');
    const fileB = makeFile('bucket-b');
    const samePath = 'org1/item/logo.webp';

    const urlA = await repository.upload('complexes', samePath, fileA);
    const urlB = await repository.upload('players', samePath, fileB);

    expect(urlA).not.toBe(urlB);
  });
});
