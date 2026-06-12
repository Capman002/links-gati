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
    // Esgotados vão pro final
    filtered.sort((a, b) => (a.isOutOfStock === b.isOutOfStock ? 0 : a.isOutOfStock ? 1 : -1));
    return filtered;
  });
  let isDropdownOpen = $state(false);

  // ==========================================
  // CART SYSTEM
  // ==========================================
  let cart = $state(new Map());
  let cartOpen = $state(false);

  function addToCart(product) {
    const existing = cart.get(product.id);
    if (existing) {
      existing.quantity++;
    } else {
      cart.set(product.id, { product, quantity: 1 });
    }
    cart = new Map(cart);
  }

  function updateQuantity(productId, delta) {
    const item = cart.get(productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart.delete(productId);
    }
    cart = new Map(cart);
  }

  function clearCart() {
    cart = new Map();
    cartOpen = false;
  }

  function isInCart(productId) {
    return cart.has(productId);
  }

  function getCartQty(productId) {
    return cart.get(productId)?.quantity || 0;
  }

  let cartItems = $derived([...cart.values()]);
  let cartCount = $derived(cartItems.reduce((sum, item) => sum + item.quantity, 0));

  function parsePrice(priceStr) {
    const cleaned = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  function formatPrice(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
  }

  let cartTotal = $derived(
    cartItems.reduce((sum, item) => sum + parsePrice(item.product.price) * item.quantity, 0)
  );

  function getCheckoutUrl() {
    if (cartItems.length === 0) return '#';
    const phone = cartItems[0].product.phone;
    let msg = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    cartItems.forEach(item => {
      msg += `• ${item.quantity}x ${item.product.title} — ${item.product.price}\n`;
    });
    msg += `\n*Total: ${formatPrice(cartTotal)}*`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
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

  <section class="catalog-grid {cartCount > 0 ? 'catalog-grid-with-cart' : ''}" aria-label="Lista de Suplementos">
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
            {:else if isInCart(product.id)}
              <button class="btn-in-cart" onclick={() => cartOpen = true}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {getCartQty(product.id)}x
              </button>
            {:else}
              <button class="btn-add-cart" onclick={() => addToCart(product)}>
                Adicionar
              </button>
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

<!-- CART FAB (Floating Action Button) -->
{#if cartCount > 0}
  <button class="cart-fab" onclick={() => cartOpen = true} aria-label="Abrir carrinho">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
    <span class="cart-badge">{cartCount}</span>
  </button>
{/if}

<!-- CART DRAWER -->
{#if cartOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="cart-overlay" onclick={() => cartOpen = false}></div>
  <div class="cart-drawer">
    <div class="cart-drawer-handle"></div>
    <div class="cart-drawer-header">
      <span class="cart-drawer-title">Meu Pedido ({cartCount})</span>
      <button class="cart-btn-clear" onclick={clearCart}>Limpar tudo</button>
    </div>

    {#if cartItems.length === 0}
      <div class="cart-empty">
        <p>Seu carrinho está vazio.</p>
      </div>
    {:else}
      <div class="cart-items">
        {#each cartItems as item (item.product.id)}
          <div class="cart-item">
            <img class="cart-item-img" src={item.product.imageUrl} alt={item.product.title} />
            <div class="cart-item-info">
              <div class="cart-item-name">{item.product.title}</div>
              <div class="cart-item-price">{item.product.price}</div>
            </div>
            <div class="cart-qty-stepper">
              <button 
                class="cart-qty-btn {item.quantity === 1 ? 'remove' : ''}" 
                onclick={() => updateQuantity(item.product.id, -1)}
                aria-label="Diminuir quantidade"
              >
                {#if item.quantity === 1}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                {:else}
                  −
                {/if}
              </button>
              <span class="cart-qty-val">{item.quantity}</span>
              <button 
                class="cart-qty-btn" 
                onclick={() => updateQuantity(item.product.id, 1)}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
          </div>
        {/each}
      </div>

      <div class="cart-footer">
        <div class="cart-total-row">
          <span class="cart-total-label">Total</span>
          <span class="cart-total-value">{formatPrice(cartTotal)}</span>
        </div>
        <a 
          href={getCheckoutUrl()} 
          class="cart-btn-whatsapp" 
          target="_blank" 
          rel="noopener"
          onclick={() => { cartOpen = false; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Enviar Pedido
        </a>
      </div>
    {/if}
  </div>
{/if}
