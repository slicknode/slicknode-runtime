import {expect} from 'chai';
import DefaultExport from '../index';
import {SlicknodeRuntime} from '../SlicknodeRuntime';

describe('index', () => {
  it('exports SlicknodeRuntime', () => {
    expect(DefaultExport).to.equal(SlicknodeRuntime);
  });
});
