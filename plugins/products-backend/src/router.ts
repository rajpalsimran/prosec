import { InputError } from '@backstage/errors';
import { z } from 'zod/v3';
import express from 'express';
import Router from 'express-promise-router';
import { productServiceRef } from './services/TodoListService';

export async function createRouter({
  productService,
}: {
  productService: typeof productServiceRef.T;
}): Promise<express.Router> {
  const router = Router();

  router.use(express.json());

  const productSchema = z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    owner: z.string().min(1),
    domain: z.string(),
    version: z.string(),
    tier: z.string(),
    repositoryUrl: z.string(),
    documentationUrl: z.string(),
  });

  // List all products
  router.get('/products', async (_req, res) => {
    res.json({ items: await productService.listProducts() });
  });

  // Add a product
  router.post('/products', async (req, res) => {
    const parsed = productSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const product = await productService.createProduct(parsed.data);
    res.status(201).json(product);
  });

  // Get one product by ID
  router.get('/products/:id', async (req, res) => {
    res.json(await productService.getProduct(req.params.id));
  });

  return router;
}
