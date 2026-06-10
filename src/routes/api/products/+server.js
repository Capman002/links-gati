import { json } from '@sveltejs/kit';
import Papa from 'papaparse';
import { dev } from '$app/environment';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1sp6b3GdTY1LcWGVfcQJP2h-LoaDIBMi22el_laGhKdM/gviz/tq?tqx=out:csv';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos
const ACTIVE_TTL = dev ? 10 * 1000 : CACHE_TTL; // 10 segundos em dev, 5 minutos em prod

// Cache em memória — sobrevive entre requests enquanto o servidor estiver rodando
let cache = {
  data: null,
  timestamp: 0
};

function getPhoneForRegion(region) {
  const normalizedRegion = (region || '').toLowerCase();
  if (normalizedRegion.includes('rio do sul')) {
    return '5547999758511';
  }
  return '5518996693067';
}

async function fetchAndParseProducts() {
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Google Sheets: ${response.statusText}`);
  }
  const csvText = await response.text();

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return result.data
    .filter(row => row['NOME'] && row['NOME'].trim() !== '')
    .map((row, index) => {
      const title = row['NOME'] || '';
      const region = row['LOCAL'] || '';
      const phone = getPhoneForRegion(region);
      const stockInt = parseInt(row['ESTOQUE'] || '0', 10) || 0;
      const isOutOfStock = stockInt <= 0;

      return {
        id: String(index + 1),
        title,
        description: row['DESCRIÇÃO'] || '',
        type: row['Tipo'] || '',
        price: row['VALOR'] || '',
        imageUrl: row['IMAGEM'] || 'https://placehold.co/400x400/f1f5f9/94a3b8?text=Sem+Imagem',
        region,
        phone,
        message: `Oi, quero comprar o produto ${title}`,
        stock: stockInt,
        badge: isOutOfStock ? 'Esgotado' : `Estoque: ${stockInt}`,
        isOutOfStock
      };
    });
}

export async function GET({ url, setHeaders }) {
  try {
    const now = Date.now();
    const bypass = url.searchParams.get('refresh') === 'true' || url.searchParams.get('bypass') === 'true';

    // Se o cache é válido e não estamos forçando a atualização, retorna instantaneamente
    if (cache.data && (now - cache.timestamp) < ACTIVE_TTL && !bypass) {
      setHeaders({ 'Cache-Control': 'public, max-age=300' });
      return json(cache.data);
    }

    // Cache expirado, vazio ou forçado — busca dados frescos
    const products = await fetchAndParseProducts();

    // Atualiza o cache
    cache = { data: products, timestamp: now };

    setHeaders({ 'Cache-Control': 'public, max-age=300' });
    return json(products);
  } catch (error) {
    console.error('Error fetching products:', error);

    // Se deu erro mas tem cache antigo, usa ele mesmo (stale)
    if (cache.data) {
      setHeaders({ 'Cache-Control': 'public, max-age=60' });
      return json(cache.data);
    }

    return json([], { status: 500 });
  }
}
