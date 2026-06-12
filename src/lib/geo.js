/**
 * Módulo de geolocalização por IP
 * Detecta o estado do usuário e mapeia para a loja mais próxima.
 * 
 * Usa um endpoint interno do SvelteKit (/api/geo) que faz a chamada
 * server-side para ip-api.com, evitando problemas de mixed content (HTTP/HTTPS).
 * 
 * Lojas:
 *   - Araçatuba/SP  → estado SP e demais estados do Norte/Nordeste/Centro-Oeste/Sudeste
 *   - Rio do Sul/SC → estados do Sul (SC, PR, RS)
 */

const CACHE_KEY = 'gati_user_region';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

/**
 * @typedef {'araçatuba' | 'rio do sul'} StoreRegion
 */

/**
 * Retorna a região da loja mais próxima do usuário.
 * Usa cache no localStorage para evitar chamadas repetidas à API.
 * 
 * @returns {Promise<StoreRegion | null>} 'rio do sul' para estados do Sul, 'araçatuba' para o resto, null se falhou
 */
export async function detectNearestStore() {
  // Tentar ler do cache primeiro
  const cached = readCache();
  if (cached) return cached;

  try {
    const response = await fetch('/api/geo');
    if (!response.ok) throw new Error('Geo API response not ok');

    const data = await response.json();

    if (!data.store) {
      throw new Error('Geolocation failed');
    }

    // Salvar no cache
    writeCache(data.store);

    return data.store;
  } catch (err) {
    console.warn('[Geo] Falha na detecção de localização:', err.message);
    return null;
  }
}

/**
 * Lê a região do cache do localStorage.
 * @returns {StoreRegion | null}
 */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const { store, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return store;
  } catch {
    return null;
  }
}

/**
 * Salva a região no cache do localStorage.
 * @param {StoreRegion} store
 */
function writeCache(store) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      store,
      timestamp: Date.now()
    }));
  } catch {
    // localStorage indisponível
  }
}
