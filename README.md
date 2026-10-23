# Backstage Products Plugin — Setup, Debugging & Database Guide

## 1. Quick Start: Clone and Run Backstage

Use these steps to get the project running locally from a fresh clone. The rest of this README covers the Products plugin, API, database, and troubleshooting.

### Prerequisites

- Git
- Node.js and Corepack
- The project's pinned Yarn version (check `package.json` / `packageManager`)
- GitHub access if you need to publish repositories through the Software Scaffolder

> **Note:** This project has been developed in WSL Ubuntu. Use the Node.js and Yarn versions specified by the repository. If your `package.json` pins Yarn 4.13.0, use that version rather than upgrading Yarn independently.

Check your tools:

```bash
node --version
corepack --version
yarn --version
git --version
```

### Clone the repository

Replace the placeholders with your actual GitHub repository URL and directory name:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_NAME>
```

### Install dependencies

Run this from the repository root:

```bash
yarn install
```

Keep the committed `yarn.lock` and `.yarn/releases/` files; they help keep dependency versions consistent.

### Configure local environment

Review `app-config.yaml` and `app-config.production.yaml` before starting. Set any environment variables required by your configuration using your team's approved method. Common examples in this project may include `GITHUB_TOKEN` for GitHub integration and PostgreSQL variables when using production configuration.

Do not commit secrets, tokens, passwords, private keys, or real `.env` files. Use local environment variables or an approved untracked environment file.

### Start the development environment

From the project root:

```bash
yarn dev
```

Wait for the frontend and backend to finish starting. With the current local configuration, the expected URLs are:

- Frontend: http://localhost:3000
- Backend: http://localhost:7007

Keep the terminal open while developing; press `Ctrl+C` to stop the processes. If startup reports different ports or a script error, trust the terminal output and inspect the root `package.json` scripts.

### Quick verification

```bash
ss -ltnp | grep -E ':3000|:7007'
```

Then open http://localhost:3000 and navigate to the Products page (usually `/products`).

### First-time setup troubleshooting

- **`yarn: command not found`:** Check `node --version` and `corepack --version`; enable Corepack if needed, following your OS/team setup instructions.
- **Dependency install fails:** Confirm Node.js/Yarn versions match the repository, then inspect the first meaningful error from `yarn install`.
- **Port already in use:** Check `ss -ltnp | grep -E ':3000|:7007'` and identify the process before stopping it.
- **GitHub publishing fails:** Verify GitHub integration settings, required environment variables, and repository permissions.
- **Products page or API fails:** Continue to the Products troubleshooting sections below.

---

1. Project Overview

This project contains a custom Backstage Products plugin with a frontend page and a backend API.

The plugin supports:

Listing products
Creating products
Retrieving a product by ID
Storing product information in SQLite
Displaying product details in the Backstage frontend
Accessing the backend through Backstage's API and discovery infrastructure
Technology Stack
Backstage frontend and backend
React and TypeScript
Express and express-promise-router
Zod for request validation
SQLite with better-sqlite3
Backstage backend service APIs
Guest authentication
2. Important Project Files
File	Purpose
app-config.yaml	Backend URL, port, database, authentication and other configuration
packages/backend/src/index.ts	Registers backend plugins
packages/backend/package.json	Backend dependencies
packages/app/src/App.tsx	Registers frontend plugins and sign-in configuration
packages/app/package.json	Frontend dependencies
plugins/products-backend/src/index.ts	Exports the Products backend plugin
plugins/products-backend/src/plugin.ts	Registers the backend plugin and router
plugins/products-backend/src/router.ts	Defines the Products REST API
plugins/products-backend/src/services/TodoListService.ts	Product service and database operations
plugins/products-backend/package.json	Backend plugin package configuration
plugins/products/src/components/TodoPage/TodoPage.tsx	Product listing, creation form and product details
3. Backend Configuration

The backend listens on port 7007.

Relevant configuration from app-config.yaml:

backend:
  baseUrl: http://localhost:7007
  listen:
    port: 7007

  database:
    client: better-sqlite3
    connection: ./data/backstage.db


The frontend normally runs on port 3000.

app:
  baseUrl: http://localhost:3000


The proxy section in app-config.yaml contained only commented example configuration. No custom proxy endpoint was configured there.

Important: The database connection path above is the configured base path, not necessarily the location of the custom Products plugin's database file. Backstage can provide separate database connections to individual plugins.

4. Backend Plugin Registration

The backend plugin is registered in:

packages/backend/src/index.ts

backend.add(
  import('@internal/backstage-plugin-products-backend'),
);


The backend plugin entry point is:

plugins/products-backend/src/index.ts

export { productsPlugin as default } from './plugin';


The plugin is identified by the ID products:

export const productsPlugin = createBackendPlugin({
  pluginId: 'products',
  // ...
});


The plugin registers its router through the Backstage HTTP router service.

httpRouter.use(
  await createRouter({ productService }),
);


The resulting API base path is:

/api/products

5. Products REST API

The router is implemented in:

plugins/products-backend/src/router.ts

The following endpoints are defined:

Method	Endpoint	Purpose
GET	/api/products/products	List all products
POST	/api/products/products	Create a product
GET	/api/products/products/:id	Retrieve a product by ID

The router uses Express JSON parsing and Zod validation.

Product fields

A product contains:

id — generated UUID
name — unique product name
title — display title
description — product description
owner — product owner
domain — domain identifier
version — product version
tier — product tier
repositoryUrl — source repository URL
documentationUrl — documentation URL
createdAt — creation timestamp

The id and createdAt values are generated by the service when a product is created.

Example POST request
curl -i -X POST \
  http://localhost:7007/api/products/products \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "test-product",
    "title": "Test Product",
    "description": "Test description",
    "owner": "user:default/guest",
    "domain": "default",
    "version": "1.0.0",
    "tier": "1",
    "repositoryUrl": "https://github.com/example/test-product",
    "documentationUrl": "https://example.com/docs"
  }'


Depending on the authentication configuration, a request without valid credentials may return 401 Unauthorized.

Example GET request
curl -i http://localhost:7007/api/products/products


A successful response has this structure:

{
  "items": [
    {
      "id": "generated-uuid",
      "name": "test-product",
      "title": "Test Product",
      "description": "Test description",
      "owner": "user:default/guest",
      "domain": "default",
      "version": "1.0.0",
      "tier": "1",
      "repositoryUrl": "https://github.com/example/test-product",
      "documentationUrl": "https://example.com/docs",
      "createdAt": "2026-10-20T18:00:00.000Z"
    }
  ]
}


This JSON is an example of the response structure, not a record guaranteed to exist in the database.

6. Product Service and Database Operations

The service is implemented in:

plugins/products-backend/src/services/TodoListService.ts

It uses Backstage's database service:

database: coreServices.database


The service initializes the products table if it does not already exist.

The table stores:

id
name
title
description
owner
domain
version
tier
repository_url
documentation_url
created_at


The service maps database column names such as repository_url and created_at to the frontend-facing fields repositoryUrl and createdAt.

The service implements:

listProducts() — retrieves all products ordered by title
getProduct(id) — retrieves a product or throws NotFoundError
createProduct(input) — generates an ID and timestamp, inserts the product and returns it

The database service initializes the table as needed.

7. Frontend Products Page

The frontend component is:

plugins/products/src/components/TodoPage/TodoPage.tsx

The page contains:

A product list
An Add Product form
Product detail display
Loading indicators
Error messages
A Refresh button

The frontend product type matches the API response fields.

Backend URL discovery

The frontend uses Backstage's discovery and fetch APIs:

import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';


Inside the component:

const fetchApi = useApi(fetchApiRef);
const discoveryApi = useApi(discoveryApiRef);


The Products backend URL is resolved with:

const getProductsUrl = useCallback(async () => {
  const baseUrl = await discoveryApi.getBaseUrl('products');
  return `${baseUrl}/products`;
}, [discoveryApi]);


The backticks around the template string are essential. Without them, TypeScript reports a syntax error.

Loading products
const url = await getProductsUrl();
const response = await fetchApi.fetch(url);

Creating a product
const url = await getProductsUrl();

const response = await fetchApi.fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(product),
});


The component checks the HTTP response status and displays an error if the request fails.

Authentication note: Using fetchApiRef and discovery resolves the backend URL and uses Backstage's fetch infrastructure. It does not automatically fix an incorrectly configured authentication provider or grant access to an otherwise protected endpoint.

8. Frontend Plugin and Guest Sign-In Registration

The frontend application is configured in:

packages/app/src/App.tsx

The application registers the catalog plugin, navigation module, home module, Products plugin and sign-in module.

The Guest sign-in configuration uses SignInPageBlueprint and SignInPage with the guest provider.

The backend registers the authentication plugin and Guest provider module in:

packages/backend/src/index.ts

The relevant dependencies include:

{
  "@backstage/plugin-auth-backend": "...",
  "@backstage/plugin-auth-backend-module-guest-provider": "..."
}


The exact versions should be taken from the project's actual package.json.

Important distinction

Guest sign-in in the UI and authorization of a backend request are separate concerns.

If an unauthenticated curl request returns:

401 Unauthorized
Missing credentials


that does not necessarily mean Guest sign-in is broken. The request may simply lack the credentials sent by the Backstage frontend.

Do not disable authentication globally just to make the endpoint work. Configure and test the intended authentication flow.

9. Database Location and Inspection

A database search identified these files:

plugins/products-backend/data/products.sqlite
packages/backend/data/user-settings.sqlite
packages/backend/data/kubernetes.sqlite
packages/backend/data/catalog.sqlite
packages/backend/data/notifications.sqlite
packages/backend/data/products.sqlite
packages/backend/data/app.sqlite
packages/backend/data/proxy.sqlite
packages/backend/data/permission.sqlite
packages/backend/data/auth.sqlite
packages/backend/data/signals.sqlite
packages/backend/data/search.sqlite
packages/backend/data/mcp-actions.sqlite
packages/backend/data/scaffolder.sqlite
packages/backend/data/techdocs.sqlite


The directory ~/projects/newtest/data/ was empty.

The existence of a file named products.sqlite does not by itself prove it contains the custom Products table. Inspect both candidate files before choosing one.

Step 1: Open the backend database
cd ~/projects/newtest

sqlite3 packages/backend/data/products.sqlite

Step 2: List tables

Inside SQLite:

.tables

Step 3: Inspect the Products table
.schema products

Step 4: Display product records
.headers on
.mode column

SELECT
  id,
  name,
  title,
  owner,
  version,
  tier
FROM products;


To display every column:

SELECT * FROM products;

Step 5: Inspect the other candidate

Exit SQLite:

.quit


Then open:

sqlite3 plugins/products-backend/data/products.sqlite


Run:

.tables
.schema products
.headers on
.mode column
SELECT * FROM products;


Use the file that actually contains your custom Products table and saved records.

Step 6: Count saved products
SELECT COUNT(*) AS total_products
FROM products;

Step 7: Exit SQLite
.quit

Graphical database viewer

DB Browser for SQLite is another option:

https://sqlitebrowser.org/

Open the correct .sqlite file and choose Browse Data, then select the products table.

10. Troubleshooting History

The following table documents the errors encountered and what they indicated.

Error	Cause or interpretation	Action
404 Not Found	The requested route was not found at the URL being called.	Verify plugin registration, URL, and active server.
Cannot POST /api/products/products	The server handling the request did not match it to a POST route.	Check which server receives the request and inspect routing/proxy behavior.
connection.filename is not supported for the base sqlite connection	The database service rejected the configured base SQLite connection's filename setting.	Remove unsupported filename configuration and use the supported base connection configuration or plugin-specific connection configuration.
EADDRINUSE :::7007	Another process was already listening on port 7007.	Identify the existing process and stop the duplicate backend before restarting.
401 Unauthorized / Missing credentials	The backend authentication service received a request without acceptable credentials.	Sign in through Backstage and check how frontend credentials are forwarded.
Unexpected token '<'	The frontend attempted to parse an HTML error page as JSON.	Inspect the HTTP status and response body before parsing JSON.
TypeScript syntax error at ${baseUrl}	The template expression was not enclosed in backticks.	Use `${baseUrl}/products`.
unable to open database "data"	data was a directory name, not a database file.	Open a specific SQLite file.
Empty data/ directory	The configured-looking path did not contain a database file at that location.	Search for actual .sqlite and .db files.
11. Port and Process Checks

The frontend and backend were found running on:

Frontend: port 3000
Backend: port 7007

Check them with:

ss -ltnp | grep -E ':3000|:7007'


Example output:

LISTEN ... 127.0.0.1:3000 ... node
LISTEN ... *:7007 ... node


The actual process IDs will change between runs.

If port 7007 is already occupied, inspect the process:

lsof -i :7007


Stop only the process you have identified and intend to stop. Avoid killing unrelated Node.js processes.

12. Troubleshooting Flowchart
flowchart TD
    A[Open Products page] --> B{Can the page load products?}

    B -- Yes --> C{Can a product be created?}
    B -- No --> D[Inspect browser Network tab]

    D --> E{HTTP status?}
    E -- 404 --> F[Check API URL and plugin registration]
    E -- 401 --> G[Check sign-in and request credentials]
    E -- 500 --> H[Check backend logs and database service]

    F --> I[Test backend on port 7007]
    G --> J[Sign in through Backstage and retry]
    H --> K[Inspect SQLite configuration and service logs]

    I --> L{Route responds?}
    L -- No --> M[Inspect router and plugin initialization]
    L -- Yes --> N[Inspect frontend URL and proxy behavior]

    C -- Yes --> O[Verify record in SQLite]
    C -- No --> D

    O --> P[Inspect the correct products.sqlite file]


The flowchart is a troubleshooting guide; it does not imply that every branch has been independently verified.

13. Recommended Verification Checklist

Use this checklist after changes or a restart.

Backend starts without plugin initialization errors.
Frontend starts on port 3000.
Backend listens on port 7007.
The Products plugin is registered in the backend.
The Products frontend plugin is registered in the application.
Guest sign-in is configured if Guest access is intended.
The frontend can list products.
Product creation succeeds with valid authentication.
The created product appears in the list.
The record exists in the correct SQLite database.
Product details display correctly.
Duplicate product names are handled appropriately.
14. Useful Commands Reference

Run these from the project root.

Check backend registration:

grep -n 'products-backend' packages/backend/src/index.ts


Check frontend registration:

grep -n 'productsPlugin' packages/app/src/App.tsx


Check API routes:

grep -n 'router\\.' plugins/products-backend/src/router.ts


Find SQLite files:

find ~/projects/newtest -type f \
  \( -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" \) \
  -not -path "*/node_modules/*" 2>/dev/null


List tables in the Products database:

sqlite3 packages/backend/data/products.sqlite ".tables"


Check products:

sqlite3 -header -column \
  packages/backend/data/products.sqlite \
  "SELECT id, name, title, owner, version, tier FROM products;"


If that command reports that the table does not exist, inspect the other candidate database rather than assuming the database is empty.

15. Final Architecture Summary
Backstage Frontend (port 3000)
          |
          | Products page
          | discoveryApiRef + fetchApiRef
          v
Backstage Backend (port 7007)
          |
          | /api/products/products
          v
Products Backend Plugin
          |
          | ProductService
          | listProducts()
          | createProduct()
          | getProduct()
          v
SQLite Database
          |
          +-- products table
              +-- id
              +-- name
              +-- title
              +-- description
              +-- owner
              +-- domain
              +-- version
              +-- tier
              +-- repository_url
              +-- documentation_url
              +-- created_at

16. Important Notes
Always verify the actual database path before running SQL commands.
A successful GET request does not guarantee that POST is authorized.
Guest sign-in does not mean every direct curl request automatically carries credentials.
A 404 from port 3000 and a 401 from port 7007 are different problems and should be debugged separately.
Use the Backstage discovery API instead of hardcoding the Products backend URL in the frontend.
Keep the backend database and authentication configuration appropriate for your environment.
Before changing database files or schemas, back up any records you need to preserve.

End of README
