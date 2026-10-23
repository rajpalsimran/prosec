import { startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';
import { productsPlugin } from './plugin';
import { productServiceRef } from './services/TodoListService';
import { createServiceFactory } from '@backstage/backend-plugin-api';

describe('productsPlugin', () => {
  const testProduct = {
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
  };

  const mockProductService = {
    listProducts: jest.fn().mockResolvedValue([testProduct]),
    getProduct: jest.fn().mockResolvedValue(testProduct),
    createProduct: jest.fn().mockResolvedValue(testProduct),
  };

  async function setup() {
    const { server } = await startTestBackend({
      features: [
        productsPlugin, createServiceFactory(
        {
          service: productServiceRef,
          deps: {},
          factory: () => mockProductService,
        }),
      ],
    });

    return server;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists products', async () => {
    const server = await setup();

    await request(server)
      .get('/api/products/products')
      .expect(200, { items: [testProduct] });
  });

  it('creates a product', async () => {
    const server = await setup();

    const response = await request(server)
      .post('/api/products/products')
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
      })
      .expect(201);

    expect(response.body).toEqual(testProduct);
  });

  it('gets a product by ID', async () => {
    const server = await setup();

    await request(server)
      .get('/api/products/products/product-1')
      .expect(200, testProduct);
  });
});
