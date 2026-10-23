import { productsPlugin } from './plugin';

describe('products', () => {
  it('should export plugin', () => {
    expect(productsPlugin).toBeDefined();
  });
});
