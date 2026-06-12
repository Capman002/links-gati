import { json } from '@sveltejs/kit';

const IP_API_URL = 'http://ip-api.com/json/{ip}?fields=status,region';

// Estados do Sul → Rio do Sul/SC
const SOUTHERN_STATES = ['SC', 'PR', 'RS'];

export async function GET({ request, getClientAddress }) {
  try {
    // Obter o IP real do cliente
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : getClientAddress();

    // Chamada server-side para ip-api.com (HTTP é seguro no server)
    const apiUrl = IP_API_URL.replace('{ip}', clientIp);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`ip-api responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error('ip-api lookup failed');
    }

    const stateCode = (data.region || '').toUpperCase();
    const store = SOUTHERN_STATES.includes(stateCode) ? 'rio do sul' : 'araçatuba';

    return json({ store, state: stateCode });
  } catch (err) {
    console.error('[Geo API] Error:', err.message);
    return json({ store: null, error: 'detection_failed' }, { status: 200 });
  }
}
