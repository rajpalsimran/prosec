import { useCallback, useEffect, useState } from 'react'; import { useApi, discoveryApiRef, fetchApiRef, } from '@backstage/core-plugin-api'; import { Header, Container } from '@backstage/ui';

type Product = { id: string; name: string; title: string; description: string; owner: string; domain: string; version: string; tier: string; repositoryUrl: string; documentationUrl: string; createdAt: string; };

type ProductInput = Omit<Product, 'id' | 'createdAt'>;

export const TodoPage = () => { const fetchApi = useApi(fetchApiRef); const discoveryApi = useApi(discoveryApiRef);

const [products, setProducts] = useState<Product[]>([]); const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); const [showForm, setShowForm] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');

const getProductsUrl = useCallback(async () => {
  const baseUrl = await discoveryApi.getBaseUrl('products');
  return `${baseUrl}/products`;
}, [discoveryApi]);
const loadProducts = useCallback(async () => { setLoading(true); setError('');


try {
  const url = await getProductsUrl();
  const response = await fetchApi.fetch(url);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Failed to load products (${response.status})`,
    );
  }

  const data: { items: Product[] } = await response.json();
  setProducts(data.items);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unable to load products');
} finally {
  setLoading(false);
}
}, [fetchApi, getProductsUrl]);

useEffect(() => { void loadProducts(); }, [loadProducts]);

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault();


const form = event.currentTarget;
const formData = new FormData(form);

const product: ProductInput = {
  name: String(formData.get('name') ?? '').trim(),
  title: String(formData.get('title') ?? '').trim(),
  description: String(formData.get('description') ?? '').trim(),
  owner: String(formData.get('owner') ?? '').trim(),
  domain: String(formData.get('domain') ?? '').trim(),
  version: String(formData.get('version') ?? '').trim(),
  tier: String(formData.get('tier') ?? '').trim(),
  repositoryUrl: String(formData.get('repositoryUrl') ?? '').trim(),
  documentationUrl: String(formData.get('documentationUrl') ?? '').trim(),
};

setSaving(true);
setError('');

try {
  const url = await getProductsUrl();

  const response = await fetchApi.fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Failed to save product (${response.status})`,
    );
  }

  const created: Product = await response.json();

  setProducts(current => [...current, created]);
  setSelectedProduct(null);
  setShowForm(false);
  form.reset();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unable to save product');
} finally {
  setSaving(false);
}
};

const fieldStyle: React.CSSProperties = { display: 'block', width: '100%', padding: 10, marginTop: 6, marginBottom: 16, boxSizing: 'border-box', border: '1px solid #aaa', borderRadius: 5, };

const buttonStyle: React.CSSProperties = { padding: '10px 16px', borderRadius: 5, border: '1px solid #888', cursor: 'pointer', marginRight: 8, marginBottom: 8, };

const renderField = ( label: string, name: string, required = true, placeholder = '', multiline = false, ) => ( <label key={name} style={{ display: 'block', marginTop: 8 }}> {label} {multiline ? ( <textarea
name={name}
required={required}
placeholder={placeholder}
style={fieldStyle}
/> ) : ( <input
name={name}
required={required}
placeholder={placeholder}
style={fieldStyle}
/> )} </label> );

return ( <> <Header title="Products" subtitle="Manage your products" />


  <Container>
    <div style={{ padding: 24 }}>
      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            marginBottom: 16,
            border: '1px solid #d32f2f',
            borderRadius: 5,
            color: '#d32f2f',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setSelectedProduct(null);
            setShowForm(current => !current);
          }}
        >
          {showForm ? 'Cancel' : 'Add Product'}
        </button>

        <button
          type="button"
          style={buttonStyle}
          onClick={() => void loadProducts()}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={event => void handleSubmit(event)}
          style={{
            maxWidth: 640,
            padding: 20,
            marginBottom: 24,
            border: '1px solid #ddd',
            borderRadius: 8,
          }}
        >
          <h2>Add Product</h2>

          {renderField('Name', 'name', true, 'unique-product-name')}
          {renderField('Title', 'title', true, 'Product title')}
          {renderField(
            'Description',
            'description',
            true,
            'Describe the product',
            true,
          )}
          {renderField('Owner', 'owner', true, 'user:default/guest')}
          {renderField('Domain', 'domain', true, 'default')}
          {renderField('Version', 'version', true, '1.0.0')}
          {renderField('Tier', 'tier', true, '1')}
          {renderField(
            'Repository URL',
            'repositoryUrl',
            true,
            'https://github.com/org/repository',
          )}
          {renderField(
            'Documentation URL',
            'documentationUrl',
            true,
            'https://example.com/docs',
          )}

          <button type="submit" style={buttonStyle} disabled={saving}>
            {saving ? 'Saving...' : 'Save Product'}
          </button>

          <button
            type="button"
            style={buttonStyle}
            disabled={saving}
            onClick={() => setShowForm(false)}
          >
            Cancel
          </button>
        </form>
      )}

      {selectedProduct && (
        <section
          style={{
            padding: 20,
            marginBottom: 24,
            border: '1px solid #ddd',
            borderRadius: 8,
            overflowWrap: 'anywhere',
          }}
        >
          <h2>{selectedProduct.title}</h2>
          <p>{selectedProduct.description}</p>
          <p>
            <strong>Name:</strong> {selectedProduct.name}
          </p>
          <p>
            <strong>Owner:</strong> {selectedProduct.owner}
          </p>
          <p>
            <strong>Domain:</strong> {selectedProduct.domain}
          </p>
          <p>
            <strong>Version:</strong> {selectedProduct.version}
          </p>
          <p>
            <strong>Tier:</strong> {selectedProduct.tier}
          </p>
          <p>
            <strong>Repository:</strong>{' '}
            <a
              href={selectedProduct.repositoryUrl}
              target="_blank"
              rel="noreferrer"
            >
              {selectedProduct.repositoryUrl}
            </a>
          </p>
          <p>
            <strong>Documentation:</strong>{' '}
            <a
              href={selectedProduct.documentationUrl}
              target="_blank"
              rel="noreferrer"
            >
              {selectedProduct.documentationUrl}
            </a>
          </p>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => setSelectedProduct(null)}
          >
            Close Details
          </button>
        </section>
      )}

      <h2>Product List</h2>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products found. Select Add Product to create one.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr>
                {[
                  'Title',
                  'Name',
                  'Owner',
                  'Version',
                  'Tier',
                  'Actions',
                ].map(heading => (
                  <th
                    key={heading}
                    style={{
                      padding: 12,
                      borderBottom: '2px solid #ddd',
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
                    {product.title}
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
                    {product.name}
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
                    {product.owner}
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
                    {product.version}
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
                    {product.tier}
                  </td>
                  <td style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowForm(false);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </Container>
</>
); };
