<script>
  import { detectNearestStore } from '$lib/geo.js';
  import { onMount } from 'svelte';

  let { data } = $props();
  
  let regions = $derived([...new Set(data.products.map(p => p.region).filter(Boolean))].sort());
  let activeTab = $state('');
  let geoResolved = $state(false);

  // Mapeia o resultado da geo para o nome da região no catálogo
  function matchRegionTab(storeName, availableRegions) {
    if (!storeName || availableRegions.length === 0) return null;

    const needle = storeName.toLowerCase();
    return availableRegions.find(r => r.toLowerCase().includes(needle)) || null;
  }

  // Definir tab inicial: tenta geo primeiro, fallback para primeira região
  onMount(async () => {
    const store = await detectNearestStore();
    if (store && regions.length > 0) {
      const matched = matchRegionTab(store, regions);
      if (matched) {
        activeTab = matched;
      }
    }
    geoResolved = true;
  });



  let availableTags = $derived.by(() => {
    const types = new Set();
    data.products.forEach(p => {
      if (p.type) types.add(p.type);
    });
    return ['Todos', ...Array.from(types).sort()];
  });

  let activeTag = $state('Todos');
  let searchQuery = $state('');

  let filteredProducts = $derived.by(() => {
    let filtered = activeTab
      ? data.products.filter(p => p.region === activeTab)
      : [...data.products];
    if (activeTag !== 'Todos') {
      filtered = filtered.filter(p => p.type === activeTag);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  });
  let isDropdownOpen = $state(false);

  function getWhatsAppUrl(phone, message) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
</script>

<svelte:window onclick={(e) => {
  if (isDropdownOpen && !e.target.closest('.category-select-wrapper')) {
    isDropdownOpen = false;
  }
}} />

<main class="container">
  
  <div class="catalog-header">
    <a href="/" class="btn-back">
      <img class="icon-back-img" src="/icons/arrow-left.svg" alt="" width="16" height="16" />
      Voltar
    </a>
    <h1 class="catalog-title">Catálogo Completo</h1>
  </div>

  <!-- SEARCH BAR -->
  <div class="search-container">
    <div class="search-box">
      <span class="search-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>
      <input 
        type="text" 
        placeholder="Buscar suplemento..." 
        bind:value={searchQuery}
        class="search-input"
      />
      {#if searchQuery}
        <button class="btn-clear-search" onclick={() => searchQuery = ''} aria-label="Limpar busca">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      {/if}
    </div>
  </div>



  {#if availableTags.length > 1}
  <div class="category-select-wrapper">
    <button 
      class="category-select {isDropdownOpen ? 'open' : ''}" 
      onclick={() => isDropdownOpen = !isDropdownOpen} 
      aria-haspopup="listbox" 
      aria-expanded={isDropdownOpen}
      aria-label="Filtrar por categoria"
    >
      <span class="select-text">{activeTag === 'Todos' ? 'Todas as Categorias' : activeTag}</span>
      <svg class="select-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
    
    {#if isDropdownOpen}
      <ul class="custom-dropdown-menu" role="listbox">
        {#each availableTags as tag}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <li 
            class="custom-dropdown-item {activeTag === tag ? 'selected' : ''}" 
            role="option" 
            aria-selected={activeTag === tag}
            onclick={() => {
              activeTag = tag;
              isDropdownOpen = false;
            }}
          >
            <span>{tag === 'Todos' ? 'Todas as Categorias' : tag}</span>
            {#if activeTag === tag}
              <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  {/if}

  <section class="catalog-grid" aria-label="Lista de Suplementos">
    {#each filteredProducts as product (product.id)}
      <article class="catalog-card">
        <div class="product-img-wrapper">
          <img class="product-img" src={product.imageUrl} alt={product.title} loading="lazy" />
        </div>
        
        <div class="product-details">
          <h2 class="product-title" title={product.title}>
            {product.title}
          </h2>
          <p class="product-desc">{product.description}</p>
          
          <div class="product-footer">
            <div class="price-stack">
              <span class="product-price">{product.price}</span>
              <span class="stock-status {product.isOutOfStock ? 'out' : 'in'}">
                {product.isOutOfStock ? 'Esgotado' : product.badge.replace('ESTOQUE:', 'Disponíveis:')}
              </span>
            </div>
            {#if product.isOutOfStock}
              <button class="btn-buy-disabled" disabled>
                Esgotado
              </button>
            {:else}
              <a href={getWhatsAppUrl(product.phone, product.message)} 
                 class="btn-buy-blue" 
                 target="_blank" 
                 rel="noopener">
                Comprar
              </a>
            {/if}
          </div>
        </div>
      </article>
    {/each}
    
    {#if filteredProducts.length === 0}
      <p style="text-align: center; color: #a1a1aa; padding: 40px 0;">Nenhum produto encontrado para este filtro.</p>
    {/if}
  </section>

</main>
