export async function load({ url, fetch }) {
  const refresh = url.searchParams.get('refresh') === 'true' ? '?refresh=true' : '';
  const response = await fetch(`/api/products${refresh}`);
  const products = await response.json();
  
  return {
    products
  };
}
