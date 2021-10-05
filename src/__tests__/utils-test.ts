import { expect } from 'chai';
import { fromGlobalId, toGlobalId } from '../utils.js';

describe('utils', () => {
  describe('toGlobalId', () => {
    it('converts global ID object to string', () => {
      expect(toGlobalId('User', '12')).to.equal('VXNlcjoxMg');
    });
  });

  describe('from global ID', () => {
    it('decodes global ID', () => {
      expect(fromGlobalId('VXNlcjoxMg')).to.deep.equal({
        id: '12',
        __typename: 'User',
      });
    });
  });
});
