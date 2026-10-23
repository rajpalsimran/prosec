
import crypto from 'node:crypto';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { Expand } from '@backstage/types';

export interface Product {
  id: string;
  name: string;
  title: string;
  description: string;
  owner: string;
  domain: string;
  version: string;
  tier: string;
  repositoryUrl: string;
  documentationUrl: string;
  createdAt: string;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt'>;

export class ProductService {
  readonly #logger: LoggerService;
  readonly #database: typeof coreServices.database.T;

  static async create(options: {
    logger: LoggerService;
    database: typeof coreServices.database.T;
  }) {
    const service = new ProductService(options.logger, options.database);
    await service.initialize();
    return service;
  }

  private constructor(
    logger: LoggerService,
    database: typeof coreServices.database.T,
  ) {
    this.#logger = logger;
    this.#database = database;
  }

  private async initialize() {
    const db = await this.#database.getClient();

    if (!(await db.schema.hasTable('products'))) {
      await db.schema.createTable('products', table => {
        table.string('id').primary();
        table.string('name').notNullable().unique();
        table.string('title').notNullable();
        table.text('description').notNullable();
        table.string('owner').notNullable();
        table.string('domain').notNullable();
        table.string('version').notNullable();
        table.string('tier').notNullable();
        table.text('repository_url').notNullable();
        table.text('documentation_url').notNullable();
        table.string('created_at').notNullable();
      });
    }
  }

  async listProducts(): Promise<Product[]> {
    const db = await this.#database.getClient();
    const rows = await db('products').select('*').orderBy('title');

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      title: row.title,
      description: row.description,
      owner: row.owner,
      domain: row.domain,
      version: row.version,
      tier: row.tier,
      repositoryUrl: row.repository_url,
      documentationUrl: row.documentation_url,
      createdAt: row.created_at,
    }));
  }

  async getProduct(id: string): Promise<Product> {
    const db = await this.#database.getClient();
    const row = await db('products').where({ id }).first();

    if (!row) {
      throw new NotFoundError(`Product '${id}' was not found`);
    }

    return {
      id: row.id,
      name: row.name,
      title: row.title,
      description: row.description,
      owner: row.owner,
      domain: row.domain,
      version: row.version,
      tier: row.tier,
      repositoryUrl: row.repository_url,
      documentationUrl: row.documentation_url,
      createdAt: row.created_at,
    };
  }

  async createProduct(input: ProductInput): Promise<Product> {
    const db = await this.#database.getClient();

    const product: Product = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    await db('products').insert({
      id: product.id,
      name: product.name,
      title: product.title,
      description: product.description,
      owner: product.owner,
      domain: product.domain,
      version: product.version,
      tier: product.tier,
      repository_url: product.repositoryUrl,
      documentation_url: product.documentationUrl,
      created_at: product.createdAt,
    });

    this.#logger.info('Product created', {
      id: product.id,
      name: product.name,
    });

    return product;
  }
}

export const productServiceRef = createServiceRef<Expand<ProductService>>({
  id: 'products.service',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
      },
      async factory({ logger, database }) {
        return ProductService.create({ logger, database });
      },
    }),
});
