import request from 'supertest';
import { createRouter } from './router';
import { ProductService } from './services/TodoListService';

describe('createRouter', () => {
  const products = [
    {
      id: 'product-1',
      name: 'test-product',
      title: 'Test Product',
      description: 'A test product',
      owner: 'group:default/platform',
      domain: 'payments',
      version: '1.0.0',
      tier: '1',
      repositoryUrl: 'https://github.com/example/test-product',
      documentationUrl: 'https://example.com/docs',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const productService = {
    listProducts: jest.fn().mockResolvedValue(products),
    getProduct: jest.fn().mockResolvedValue(products[0]),
    createProduct: jest.fn().mockResolvedValue(products[0]),
  } as unknown as ProductService;

  async function setup() {
    return request(
      await createRouter({ productService }),
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists products', async () => {
    const response = await (await setup()).get('/products');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(productService.listProducts).toHaveBeenCalled();
  });

  it('creates a product', async () => {
    const response = await (await setup())
      .post('/products')
      .send({
        name: 'test-product',
        title: 'Test Product',
        description: 'A test product',
        owner: 'group:default/platform',
        domain: 'payments',
        version: '1.0.0',
        tier: '1',
        repositoryUrl: 'https://github.com/example/test-product',
        documentationUrl: 'https://example.com/docs',
      });

    expect(response.status).toBe(201);
    expect(productService.createProduct).toHaveBeenCalled();
  });

  it('rejects invalid product input', async () => {
    const response = await (await setup())
      .post('/products')
      .send({ name: '' });

    expect(response.status).toBe(400);
    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it('gets a product by ID', async () => {
    const response = await (await setup()).get('/products/product-1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('product-1');
  });
});
