import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { productServiceRef } from './services/TodoListService';

export const productsPlugin = createBackendPlugin({
  pluginId: 'products',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        productService: productServiceRef,
      },
      async init({ httpRouter, productService }) {
        httpRouter.use(
          await createRouter({ productService }),
        );
      },
    });
  },
});
