import { expect } from 'chai';
import DefaultExport from '../index.js';
import * as AllExports from '../index.js';
import { SlicknodeRuntime } from '../SlicknodeRuntime.js';
import { fromGlobalId, toGlobalId } from '../utils.js';

describe('index', () => {
  it('exports SlicknodeRuntime', () => {
    expect(DefaultExport).to.equal(SlicknodeRuntime);
  });

  it('exports toGlobalId', () => {
    expect(AllExports.toGlobalId).to.equal(toGlobalId);
  });

  it('exports fromGlobalId', () => {
    expect(AllExports.fromGlobalId).to.equal(fromGlobalId);
  });
});
