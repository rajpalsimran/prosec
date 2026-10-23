import { createApp } from '@backstage/frontend-defaults'; import { createFrontendModule } from '@backstage/frontend-plugin-api'; import { SignInPage } from '@backstage/core-components'; import { SignInPageBlueprint } from '@backstage/plugin-app-react';

import catalogPlugin from '@backstage/plugin-catalog/alpha'; import { navModule } from './modules/nav'; import { homeModule } from './modules/home'; import productsPlugin from '@internal/backstage-plugin-products';

const signInPage = SignInPageBlueprint.make({ params: { loader: async () => props => ( <SignInPage {...props} providers={['guest']} /> ), }, });

const authModule = createFrontendModule({ pluginId: 'app', extensions: [signInPage], });

export default createApp({ features: [ catalogPlugin, navModule, homeModule, productsPlugin, authModule, ], });
