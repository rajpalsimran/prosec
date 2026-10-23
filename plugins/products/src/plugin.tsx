import {
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import { rootRouteRef } from './routes';

export const page = PageBlueprint.make({
  params: {
    path: '/products',
    title: 'Products',
    icon: <ShoppingCartIcon/>,
    routeRef: rootRouteRef,
    loader: () =>
      import('./components/TodoPage').then(m => (
        <m.TodoPage />
      )),
  },
});

export const productsPlugin = createFrontendPlugin({
  pluginId: 'products',
  extensions: [page],
  routes: {
    root: rootRouteRef,
  },
});
