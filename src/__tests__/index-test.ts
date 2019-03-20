import {expect} from 'chai';
import DefaultExport from '../index';
import * as AllExports from '../index';
import {SlicknodeRuntime} from '../SlicknodeRuntime';
import {
  fromGlobalId,
  toGlobalId,
} from '../utils';

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
