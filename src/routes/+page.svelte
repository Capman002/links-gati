<script>
  import { detectNearestStore } from '$lib/geo.js';
  import { onMount } from 'svelte';

  let nearestStore = $state(null);
  let geoLoaded = $state(false);

  onMount(async () => {
    const store = await detectNearestStore();
    nearestStore = store;
    geoLoaded = true;
  });

  // Dados das duas lojas
  const stores = {
    araçatuba: {
      whatsapp: 'https://wa.me/5518996693067?text=Oi,%20gostaria%20de%20falar%20com%20o%20atendimento%20de%20Ara%C3%A7atuba',
      instagram: 'https://www.instagram.com/gattsossuplementos/',
      label: 'Araçatuba/SP e Região'
    },
    'rio do sul': {
      whatsapp: 'https://wa.me/5547999758511?text=Oi,%20gostaria%20de%20falar%20com%20o%20atendimento%20de%20Rio%20do%20Sul',
      instagram: 'https://www.instagram.com/gatt_suplementos/',
      label: 'Rio do Sul/SC e Região'
    }
  };

  const tiktokUrl = 'https://www.tiktok.com/@gattsossuplementos';

  // Mostra só a loja detectada; se falhou, mostra as duas
  let visibleStoreKeys = $derived.by(() => {
    if (geoLoaded && nearestStore) {
      return [nearestStore];
    }
    // Fallback: mostra as duas enquanto carrega ou se falhou
    return ['araçatuba', 'rio do sul'];
  });
</script>

<div class="ambient-background" aria-hidden="true">
  <div class="ambient-glow glow-1"></div>
  <div class="ambient-glow glow-2"></div>
</div>

<main class="container">
  <!-- HEADER SECTION -->
  <header class="header">
    <div class="logo-wrapper">
      <img
        class="logo-img"
        src="/logotipo-gatt-v2.png"
        alt="Gatt Suplementos Logo"
        width="118"
        height="118"
      />
      <h1 class="sr-only">Gatt Suplementos</h1>
    </div>

    <p class="bio">
      Nutrição Esportiva Premium. Seu melhor resultado começa aqui.
    </p>
  </header>

  <!-- LINKS BUTTONS LIST -->
  <nav class="links-wrapper" aria-label="Links oficiais Gatt Suplementos">
    <!-- Link Catalog (Hero Card) -->
    <a
      href="/catalogo"
      class="catalog-card-v2"
      data-sveltekit-preload-data="hover"
      aria-label="Ver Catálogo Completo"
    >
      <div class="catalog-card-left">
        <img
          src="/catalog-bg.png"
          class="catalog-thumb-img"
          alt=""
          width="64"
          height="64"
          loading="eager"
        />
        <div class="catalog-info">
          <span class="catalog-tag">Nossos Produtos</span>
          <span class="catalog-name">Ver Catálogo</span>
        </div>
      </div>
      <div class="catalog-card-right">
        <img src="/icons/chevron-right.svg" alt="" width="14" height="14" />
      </div>
    </a>

    <!-- WhatsApp Links - ordenados por proximidade -->
    {#each visibleStoreKeys as key (key)}
      {@const store = stores[key]}
      <a
        href={store.whatsapp}
        class="link-btn"
        target="_blank"
        rel="noopener"
      >
        <div class="link-content">
          <span class="link-icon">
            <img
              class="link-icon-img"
              src="/icons/whatsapp.svg"
              alt=""
              width="22"
              height="22"
            />
          </span>
          <div class="link-details">
            <span class="link-title">{store.label}</span>
          </div>
        </div>
        <img
          class="arrow-icon-img"
          src="/icons/chevron-right.svg"
          alt=""
          width="16"
          height="16"
        />
      </a>
    {/each}

    <!-- Instagram Links - dinâmico por estado -->
    {#each visibleStoreKeys as key (key)}
      {@const store = stores[key]}
      <a
        href={store.instagram}
        class="link-btn"
        target="_blank"
        rel="noopener"
      >
        <div class="link-content">
          <span class="link-icon">
            <img
              class="link-icon-img"
              src="/icons/ig-icon.svg"
              alt=""
              width="22"
              height="22"
            />
          </span>
          <div class="link-details">
            <span class="link-title">{store.label}</span>
          </div>
        </div>
        <img
          class="arrow-icon-img"
          src="/icons/chevron-right.svg"
          alt=""
          width="16"
          height="16"
        />
      </a>
    {/each}

    <!-- TikTok - mesmo para ambas as lojas -->
    <a
      href={tiktokUrl}
      class="link-btn"
      target="_blank"
      rel="noopener"
    >
      <div class="link-content">
        <span class="link-icon">
          <img
            class="link-icon-img"
            src="/icons/tk-icon.svg"
            alt=""
            width="22"
            height="22"
          />
        </span>
        <div class="link-details">
          <span class="link-title">TikTok Oficial</span>
        </div>
      </div>
      <img
        class="arrow-icon-img"
        src="/icons/chevron-right.svg"
        alt=""
        width="16"
        height="16"
      />
    </a>
  </nav>
</main>


