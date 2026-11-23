import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart, Menu,
  Minus, Plus, Search, ShoppingBag, X,
} from 'lucide-react';
import { Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { categories, demoProducts, Product } from './catalog';

type CartLine = { productId: string; quantity: number };
type User = { email: string; name: string; role: 'CUSTOMER' | 'ADMIN' };
type Order = { orderNumber: string; total: number; status: string; createdAt: string };
type Review = { id: string; customerName: string; rating: number; body: string; createdAt: string };
const FREE_SHIPPING_THRESHOLD = 250;
const STANDARD_SHIPPING = 12;
const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);
const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'include' });
    if (!csrfResponse.ok) throw new Error('Could not establish a secure session. Please try again.');
    const csrf = await csrfResponse.json() as { token: string };
    headers.set('X-XSRF-TOKEN', csrf.token);
  }
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    const body = await response.text();
    let message = body || `Request failed (${response.status})`;
    try {
      const error = JSON.parse(body) as { message?: string };
      message = error.message ?? message;
    } catch {
      // The response body may be a plain-text error from the security filter.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function ProductCard({ product, saved, onToggle }: { product: Product; saved: boolean; onToggle: (id: string) => void }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.article className="product-card" layout={!reducedMotion} initial={reducedMotion ? false : { opacity: 0, y: 24 }} whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: reducedMotion ? 0 : 0.55 }}>
      <div className="product-image-wrap">
        <Link to={`/product/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
          <img className="product-image" src={product.imageUrl} alt={product.name} loading="lazy" />
          {product.featured && <span className="image-label">Considered essential</span>}
        </Link>
        <button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={() => onToggle(product.id)} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}>
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
        <Link to={`/product/${product.slug}`} className="quick-view"><span>Discover</span><ArrowUpRight size={15} /></Link>
      </div>
      <div className="product-meta">
        <div><p className="eyebrow">{product.categoryName}</p><Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link></div>
        <span className="product-price">{money(product.price)}</span>
      </div>
    </motion.article>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [apiOnline, setApiOnline] = useState(false);
  const [notice, setNotice] = useState('');
  const [cart, setCart] = useState<CartLine[]>(() => readStored('mn-cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => readStored('mn-wishlist', []));
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [orders, setOrders] = useState<Order[]>(() => readStored('mn-orders', []));
  const syncedAccount = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    request<Product[]>('/api/products')
      .then(async (items) => {
        if (!active) return;
        setProducts(items);
        setCart((local) => local.flatMap((line) => {
          const product = items.find((item) => item.id === line.productId);
          return product && product.inventory > 0
            ? [{ ...line, quantity: Math.min(line.quantity, product.inventory) }]
            : [];
        }));
        setApiOnline(true);
        try {
          const currentUser = await request<User>('/api/auth/me');
          if (active) setUser(currentUser);
        } catch {
          if (active) setUser(null);
        }
      })
      .catch(() => { if (active) { setApiOnline(false); setNotice('The commerce service is offline. A sample catalog is shown; purchasing is disabled until the service returns.'); } });
    return () => { active = false; };
  }, []);

  useEffect(() => { localStorage.setItem('mn-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('mn-wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('mn-orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => {
    if (!apiOnline || !user) {
      syncedAccount.current = null;
      return;
    }
    let active = true;
    syncedAccount.current = null;
    void (async () => {
      try {
        const [remoteCart, remoteWishlist, remoteOrders] = await Promise.all([
          request<CartLine[]>('/api/cart'),
          request<Product[]>('/api/wishlist'),
          request<Order[]>('/api/orders/mine'),
        ]);
        if (!active) return;
        const remoteWishlistIds = new Set(remoteWishlist.map((product) => product.id));
        const mergedWishlist = [...new Set([...wishlist, ...remoteWishlistIds])];
        await Promise.all(wishlist
          .filter((productId) => !remoteWishlistIds.has(productId))
          .map((productId) => request(`/api/wishlist/${productId}`, { method: 'POST' })));
        if (!active) return;
        setCart((local) => {
          const merged = new Map(local.map((line) => [line.productId, line.quantity]));
          remoteCart.forEach((line) => merged.set(line.productId, Math.max(merged.get(line.productId) ?? 0, line.quantity)));
          return [...merged].map(([productId, quantity]) => {
            const inventory = products.find((product) => product.id === productId)?.inventory;
            return { productId, quantity: inventory === undefined ? quantity : Math.min(quantity, inventory) };
          }).filter((line) => line.quantity > 0);
        });
        setWishlist(mergedWishlist);
        setOrders(remoteOrders);
        syncedAccount.current = user.email;
      } catch {
        if (active) setNotice('Your account could not be synchronized. Changes remain saved on this device.');
      }
    })();
    return () => { active = false; };
  }, [apiOnline, products, user]);
  useEffect(() => {
    if (!user || syncedAccount.current !== user.email) return;
    const timer = window.setTimeout(() => {
      request('/api/cart', { method: 'PUT', body: JSON.stringify({ items: cart }) })
        .catch(() => setNotice('Your bag is saved on this device but could not be synchronized.'));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [cart, user, apiOnline]);
  useEffect(() => {
    if (!cartOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = document.querySelector<HTMLElement>('.cart-drawer');
    drawer?.querySelector<HTMLElement>('button:not(:disabled), a[href]')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCartOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawer) return;
      const focusable = [...drawer.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [cartOpen]);
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;
    const move = (event: PointerEvent) => {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursor.classList.toggle('cursor-active', Boolean((event.target as HTMLElement).closest('a, button')));
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [reducedMotion]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    setMenuOpen(false);
  }, [location.pathname, reducedMotion]);
  useEffect(() => {
    if (!heroRef.current || reducedMotion) return;
    const context = gsap.context(() => {
      gsap.fromTo('.hero-copy > *', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.14, ease: 'power3.out', delay: 0.22 });
      gsap.fromTo('.hero-photo', { scale: 1.08 }, { scale: 1, duration: 1.8, ease: 'power2.out' });
    }, heroRef);
    return () => context.revert();
  }, [reducedMotion]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const cartLines = cart.map((line) => ({ ...line, product: products.find((item) => item.id === line.productId) })).filter((line): line is CartLine & { product: Product } => Boolean(line.product));
  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const toggleWishlist = async (id: string) => {
    const next = wishlist.includes(id) ? wishlist.filter((item) => item !== id) : [...wishlist, id];
    setWishlist(next);
    if (apiOnline && user) {
      try {
        await request(`/api/wishlist/${id}`, { method: next.includes(id) ? 'POST' : 'DELETE' });
      } catch {
        setNotice('Wishlist saved on this device. Your account could not be synchronized.');
      }
    }
  };
  const addToCart = (id: string, quantity = 1) => {
    const product = products.find((item) => item.id === id);
    if (!apiOnline) {
      setNotice('The commerce service is offline. Please try again when it is available.');
      return;
    }
    if (!product || product.inventory < 1) {
      setNotice('This piece is currently unavailable.');
      return;
    }
    const currentQuantity = cart.find((line) => line.productId === id)?.quantity ?? 0;
    if (currentQuantity + quantity > product.inventory) {
      setNotice(`Only ${product.inventory} ${product.inventory === 1 ? 'piece is' : 'pieces are'} available.`);
      return;
    }
    setCart((current) => {
      const line = current.find((item) => item.productId === id);
      if ((line?.quantity ?? 0) + quantity > product.inventory) return current;
      return line ? current.map((item) => item.productId === id ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { productId: id, quantity }];
    });
    setCartOpen(true);
  };
  const changeQuantity = (id: string, delta: number) => {
    const line = cart.find((item) => item.productId === id);
    const product = products.find((item) => item.id === id);
    if (line && product && line.quantity + delta > product.inventory) {
      setNotice(`Only ${product.inventory} ${product.inventory === 1 ? 'piece is' : 'pieces are'} available.`);
      return;
    }
    setCart((current) => current
      .map((item) => item.productId === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/shop?query=${encodeURIComponent(searchValue.trim())}`);
    setSearchOpen(false);
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="announcement"><span>Complimentary delivery on orders over $250</span><span className="announcement-mark">✳</span><span>Thoughtful things, made to last</span></div>
      <header className="site-header">
        <button className="icon-button mobile-menu" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X /> : <Menu />}</button>
        <nav id="primary-navigation" className={`main-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          <Link to="/shop">Shop all</Link><Link to="/category/ready-to-wear">Ready to wear</Link><Link to="/category/accessories">Accessories</Link><Link to="/category/objects">Objects</Link><Link className="mobile-nav-link" to="/wishlist">Your kept list ({wishlist.length})</Link><Link className="mobile-nav-link" to="/profile">{user ? 'Your account' : 'Sign in'}</Link>
        </nav>
        <Link to="/" className="wordmark" aria-label="Maison Noir home">maison<span>noir</span><i>®</i></Link>
        <div className="header-actions">
          <button className="icon-button search-trigger" aria-label="Search" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><Search size={19} /></button>
          <Link className="account-link" to="/profile">{user ? user.name.split(' ')[0] : 'Account'}</Link>
          <Link to="/wishlist" className="icon-button wishlist-trigger" aria-label={`Wishlist, ${wishlist.length} items`}><Heart size={18} /><span className="action-count">{wishlist.length}</span></Link>
          <button className="icon-button bag-trigger" aria-label={`Shopping bag, ${cartCount} items`} onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span className="action-count">{cartCount}</span></button>
        </div>
      </header>
      <AnimatePresence>
        {searchOpen && <motion.form className="search-panel" role="search" onSubmit={submitSearch} initial={reducedMotion ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
          <Search size={18} /><input autoFocus placeholder="Search the collection" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} aria-label="Search products" /><button className="text-button">Search <ArrowRight size={15} /></button><button type="button" className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button>
        </motion.form>}
      </AnimatePresence>
      {notice && <div className="api-notice" role="status" aria-live="polite"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={14} /></button></div>}

      <AnimatePresence mode="wait">
        <motion.main id="main-content" tabIndex={-1} key={location.pathname + location.search} initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }} transition={{ duration: reducedMotion ? 0 : 0.28 }}>
          <Routes>
            <Route path="/" element={<Home products={products} wishlist={wishlist} onToggle={toggleWishlist} heroRef={heroRef} />} />
            <Route path="/shop" element={<Shop products={products} wishlist={wishlist} onToggle={toggleWishlist} />} />
            <Route path="/category/:slug" element={<Shop products={products} wishlist={wishlist} onToggle={toggleWishlist} />} />
            <Route path="/product/:slug" element={<ProductPage products={products} wishlist={wishlist} onToggle={toggleWishlist} onAdd={addToCart} onProductUpdate={(updated) => setProducts((current) => current.map((item) => item.id === updated.id ? updated : item))} apiOnline={apiOnline} user={user} />} />
            <Route path="/wishlist" element={<Wishlist products={products} wishlist={wishlist} onToggle={toggleWishlist} />} />
            <Route path="/cart" element={<CartPage lines={cartLines} subtotal={subtotal} apiOnline={apiOnline} changeQuantity={changeQuantity} onCheckout={() => navigate('/checkout')} />} />
            <Route path="/checkout" element={<Checkout cartLines={cartLines} subtotal={subtotal} apiOnline={apiOnline} user={user} onOrder={(order) => { setOrders((items) => [order, ...items]); setCart([]); navigate('/orders'); }} />} />
            <Route path="/profile" element={<Profile user={user} onUser={setUser} />} />
            <Route path="/orders" element={<Orders orders={orders} user={user} />} />
            <Route path="/admin" element={<Admin user={user} products={products} apiOnline={apiOnline} onProducts={setProducts} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.main>
      </AnimatePresence>

      <footer className="site-footer">
        <div className="footer-top"><div><Link to="/" className="footer-wordmark">maisonnoir<span>®</span></Link><p>Objects of quiet distinction.<br />Made with intention, kept for a lifetime.</p></div><div className="footer-links"><div><span className="eyebrow">Explore</span><Link to="/shop">The collection</Link><Link to="/category/objects">Objects</Link><Link to="/category/accessories">Accessories</Link></div><div><span className="eyebrow">Your Maison</span><Link to="/profile">Your account</Link><Link to="/orders">Order history</Link><Link to="/wishlist">Your kept list</Link></div></div></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Maison Noir Studio</span><span>A considered collection for everyday living</span></div>
      </footer>
      <div className="custom-cursor" ref={cursorRef} aria-hidden="true" />

      <AnimatePresence>
        {cartOpen && <><motion.button className="drawer-scrim" aria-label="Close shopping bag" onClick={() => setCartOpen(false)} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }} />
          <motion.aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title" initial={reducedMotion ? false : { x: '100%' }} animate={{ x: 0 }} exit={reducedMotion ? { opacity: 0 } : { x: '100%' }} transition={reducedMotion ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 250 }}>
            <div className="drawer-heading"><div><p className="eyebrow">Your selection</p><h2 id="cart-drawer-title">Shopping bag <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X /></button></div>
            {cartLines.length ? <><div className="drawer-lines">{cartLines.map(({ product, quantity }) => <div className="drawer-line" key={product.id}><img src={product.imageUrl} alt="" /><div className="drawer-product"><Link to={`/product/${product.slug}`} onClick={() => setCartOpen(false)}>{product.name}</Link><span>{money(product.price)}</span><div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{quantity}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><button className="remove-link" onClick={() => changeQuantity(product.id, -quantity)}>Remove</button></div>)}</div><div className="drawer-bottom"><div className="subtotal-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Shipping and taxes calculated at checkout.</p><Link to="/checkout" className="button button-dark full-button" onClick={() => setCartOpen(false)}>Continue to checkout <ArrowRight size={16} /></Link><Link to="/cart" className="continue-link" onClick={() => setCartOpen(false)}>View bag</Link></div></> : <div className="drawer-empty"><ShoppingBag size={26} strokeWidth={1.2} /><p>Your bag is taking a quiet moment.</p><Link to="/shop" className="button button-outline" onClick={() => setCartOpen(false)}>Explore the collection</Link></div>}
          </motion.aside></>}
      </AnimatePresence>
    </div>
  );
}

function Home({ products, wishlist, onToggle, heroRef }: { products: Product[]; wishlist: string[]; onToggle: (id: string) => void; heroRef: React.RefObject<HTMLDivElement> }) {
  const featured = products.filter((item) => item.featured).slice(0, 4);
  return <>
    <section className="hero" ref={heroRef}>
      <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> The Maison collection</p><h1>Less, but<br /><em>better.</em></h1><p className="hero-description">A considered collection of things to wear, live with, and pass on.</p><Link to="/shop" className="button button-light">Discover the collection <ArrowRight size={16} /></Link><span className="hero-index">01 — 04</span></div>
      <div className="hero-visual"><img className="hero-photo" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=90" alt="A fashion editorial in warm evening light" /><div className="hero-image-caption"><span>Form follows feeling</span><span>The Maison collection</span></div><a href="#edit" className="hero-scroll"><ArrowDown size={16} /><span>Scroll to discover</span></a></div>
      <div className="hero-side-note">A wardrobe with room to breathe</div>
    </section>
    <section className="intro-section content-wrap"><p className="eyebrow">The Maison point of view</p><h2>We believe the things you live with<br className="desktop-break" /> should make you <em>feel something.</em></h2><p className="intro-bottom">Not more. Just more meaningful.</p><span className="intro-star">✳</span></section>
    <section className="featured-section content-wrap" id="edit"><div className="section-heading"><div><p className="eyebrow">The edit / 01</p><h2>Quietly <em>considered.</em></h2></div><Link to="/shop" className="underlined-link">Shop the edit <ArrowRight size={15} /></Link></div>
      <div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} onToggle={onToggle} />)}</div>
    </section>
    <section className="manifesto"><div className="manifesto-image"><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1300&q=85" alt="A considered selection of wardrobe pieces" loading="lazy" /><span>01 / Made to be lived in</span></div><div className="manifesto-copy"><p className="eyebrow">A slower kind of luxury</p><h2>Good things<br />take <em>their time.</em></h2><p>Choose fewer things, and choose them well. From useful everyday pieces to objects that shift the feeling of a room, each item has a place in a more considered life.</p><Link to="/category/objects" className="underlined-link">Explore the objects <ArrowRight size={15} /></Link><span className="manifesto-seal">MN<br /><i>Maison Noir</i></span></div></section>
    <section className="category-section content-wrap"><div className="section-heading"><div><p className="eyebrow">A life, well composed</p><h2>Explore by <em>category.</em></h2></div><span className="category-note">Three chapters, one point of view.</span></div><div className="category-grid">{categories.map((category, index) => <Link key={category.slug} to={`/category/${category.slug}`} className={`category-card category-${index + 1}`}><img src={category.image} alt="" loading="lazy" /><div><h3>{category.name}</h3><span className="category-arrow"><ArrowUpRight size={18} /></span></div></Link>)}</div></section>
    <section className="studio-contact"><p className="eyebrow">The Maison collection</p><h2>Choose with <em>intention.</em></h2><Link to="/shop" className="underlined-link">Explore all pieces <ArrowUpRight size={15} /></Link></section>
  </>;
}

function Shop({ products, wishlist, onToggle }: { products: Product[]; wishlist: string[]; onToggle: (id: string) => void }) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query')?.toLowerCase() ?? '';
  const [sort, setSort] = useState('featured');
  const [category, setCategory] = useState(slug ?? 'all');
  useEffect(() => setCategory(slug ?? 'all'), [slug]);
  const filtered = useMemo(() => products.filter((product) =>
    (category === 'all' || product.categorySlug === category) &&
    (!query || `${product.name} ${product.categoryName} ${product.description}`.toLowerCase().includes(query)),
  ).sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : Number(b.featured) - Number(a.featured)), [products, category, query, sort]);
  const categoryName = categories.find((item) => item.slug === category)?.name;
  return <section className="collection-page content-wrap">
    <div className="collection-title"><p className="eyebrow">The Maison collection</p><h1>{categoryName ?? 'Objects of'} <em>{categoryName ? 'edit.' : 'quiet distinction.'}</em></h1><p>Pieces to live in, live with, and love for a long time.</p></div>
    <div className="collection-toolbar"><div className="filter-list"><button className={category === 'all' ? 'filter-active' : ''} onClick={() => setCategory('all')}>All pieces <span>{products.length}</span></button>{categories.map((item) => <button key={item.slug} className={category === item.slug ? 'filter-active' : ''} onClick={() => setCategory(item.slug)}>{item.name}</button>)}</div><label className="sort-label">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={14} /></label></div>
    {query && <p className="results-note">Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''} for “{query}”</p>}
    {filtered.length ? <div className="product-grid collection-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} onToggle={onToggle} />)}</div> : <div className="empty-state"><p className="eyebrow">Nothing here, just yet</p><h2>Try another <em>search.</em></h2><Link to="/shop" className="button button-outline">View all pieces</Link></div>}
  </section>;
}

function ProductPage({ products, wishlist, onToggle, onAdd, onProductUpdate, apiOnline, user }: { products: Product[]; wishlist: string[]; onToggle: (id: string) => void; onAdd: (id: string, quantity?: number) => void; onProductUpdate: (product: Product) => void; apiOnline: boolean; user: User | null }) {
  const { slug } = useParams();
  const product = products.find((item) => item.slug === slug);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewReload, setReviewReload] = useState(0);

  useEffect(() => {
    let active = true;
    setReviewsLoading(true);
    setReviewsError('');
    request<Review[]>(`/api/products/${slug}/reviews`)
      .then((items) => { if (active) setReviews(items); })
      .catch(() => { if (active) setReviewsError('Reviews could not be loaded. Please try again.'); })
      .finally(() => { if (active) setReviewsLoading(false); });
    return () => { active = false; };
  }, [slug, reviewReload]);

  if (!product) return <NotFound />;

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setReviewMessage('Sign in to share a review.');
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setReviewBusy(true);
    setReviewMessage('');
    try {
      const created = await request<Review>(`/api/products/${product.slug}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: Number(form.get('rating')), body: form.get('review') }),
      });
      setReviews((items) => [created, ...items]);
      formElement.reset();
      setReviewMessage('Thank you. Your review has been published.');
      try {
        onProductUpdate(await request<Product>(`/api/products/${product.slug}`));
      } catch {
        setReviewMessage('Your review is published. The rating summary will refresh on your next visit.');
      }
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : 'Your review could not be submitted. Please try again.');
    } finally {
      setReviewBusy(false);
    }
  };

  return <section className="product-detail content-wrap">
    <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={`/category/${product.categorySlug}`}>{product.categoryName}</Link><span>/</span><span>{product.name}</span></div>
    <div className="product-detail-grid">
      <div className="detail-image"><img src={product.imageUrl} alt={product.name} /><span className="image-label">Designed to be kept</span></div>
      <div className="detail-info">
        <p className="eyebrow">{product.categoryName} · The Maison collection</p>
        <h1>{product.name}</h1>
        <div className="detail-rating">{product.reviewCount > 0
          ? <><span aria-label={`${product.rating.toFixed(1)} out of 5 stars`}>★★★★★</span> {product.rating.toFixed(1)} <a href="#reviews">({product.reviewCount} reviews)</a></>
          : <a href="#reviews">No reviews yet</a>}</div>
        <p className="detail-price">{money(product.price)} <span>USD</span></p>
        <p className="detail-description">{product.description}</p>
        <div className="detail-stock">{!apiOnline ? 'Stock details are unavailable in the sample catalog.' : product.inventory > 0 ? <><span className="stock-dot" /> {product.inventory} available</> : 'Currently out of stock'}</div>
        <div className="detail-actions">
          <div className="quantity-control detail-quantity">
            <button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></button>
            <span>{quantity}</span>
            <button aria-label="Increase quantity" disabled={!apiOnline || quantity >= product.inventory} onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}><Plus size={14} /></button>
          </div>
          <button disabled={!apiOnline || product.inventory < 1} className="button button-dark detail-add" onClick={() => onAdd(product.id, quantity)}>Add to bag — {money(product.price * quantity)} <ArrowRight size={16} /></button>
          <button className={`detail-save ${wishlist.includes(product.id) ? 'is-saved' : ''}`} onClick={() => onToggle(product.id)} aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={19} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} /></button>
        </div>
        <div className="detail-promises"><div><span>01</span> Complimentary shipping over $250</div><div><span>02</span> Prices shown in USD</div><div><span>03</span> Availability shown above</div></div>
      </div>
    </div>
    <section className="reviews-section" id="reviews">
      <p className="eyebrow">Notes from the community</p>
      <h2>Made to be <em>loved.</em></h2>
      <div className="reviews-layout">
        <div className="review-summary">
          <strong>{product.reviewCount > 0 ? product.rating.toFixed(1) : '—'}</strong>
          {product.reviewCount > 0 && <span aria-label={`${product.rating.toFixed(1)} out of 5 stars`}>★★★★★</span>}
          <p>{product.reviewCount > 0 ? `Based on ${product.reviewCount} reviews` : 'No reviews have been shared yet.'}</p>
        </div>
        <div className="review-list" aria-live="polite">
          {reviewsLoading ? <p className="form-hint">Loading reviews…</p> : reviewsError
            ? <div><p className="error-message">{reviewsError}</p><button className="text-button" onClick={() => setReviewReload((value) => value + 1)}>Try again <ArrowRight size={15} /></button></div>
            : reviews.length
              ? reviews.map((item) => <article className="review-card" key={item.id}><span aria-label={`${item.rating} out of 5 stars`}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span><p>{item.body}</p><small>{item.customerName} · {new Date(item.createdAt).toLocaleDateString()}</small></article>)
              : <div className="review-card"><p>No reviews yet. If you have purchased this piece, you can be the first to share your experience.</p></div>}
        </div>
        <form className="review-form" onSubmit={submitReview}>
          <label htmlFor="review-message" className="eyebrow">Leave a note</label>
          <select name="rating" aria-label="Rating"><option value="5">★★★★★ — Loved it</option><option value="4">★★★★ — Very good</option><option value="3">★★★ — Just right</option><option value="2">★★ — Could be better</option><option value="1">★ — Not for me</option></select>
          <textarea name="review" id="review-message" required minLength={8} maxLength={1200} placeholder="What did you think?" />
          <button className="text-button" disabled={reviewBusy || !apiOnline}>{reviewBusy ? 'Sending…' : 'Submit review'} <ArrowRight size={15} /></button>
          {reviewMessage && <p className={reviewMessage.startsWith('Thank') || reviewMessage.startsWith('Your review is published') ? 'form-message' : 'error-message'} role="status">{reviewMessage} {reviewMessage.startsWith('Sign in') && <Link to="/profile">Go to your account</Link>}</p>}
        </form>
      </div>
    </section>
  </section>;
}

function Wishlist({ products, wishlist, onToggle }: { products: Product[]; wishlist: string[]; onToggle: (id: string) => void }) {
  const saved = products.filter((product) => wishlist.includes(product.id));
  return <section className="collection-page content-wrap"><div className="collection-title"><p className="eyebrow">A collection of your own</p><h1>The <em>kept list.</em></h1><p>Things you loved, all in one place.</p></div>{saved.length ? <div className="product-grid collection-grid">{saved.map((product) => <ProductCard key={product.id} product={product} saved onToggle={onToggle} />)}</div> : <div className="empty-state"><Heart size={28} strokeWidth={1.2} /><p className="eyebrow">Your list is still taking shape</p><h2>Keep what <em>moves you.</em></h2><Link to="/shop" className="button button-outline">Explore the collection</Link></div>}</section>;
}

function CartPage({ lines, subtotal, apiOnline, changeQuantity, onCheckout }: { lines: (CartLine & { product: Product })[]; subtotal: number; apiOnline: boolean; changeQuantity: (id: string, delta: number) => void; onCheckout: () => void }) {
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const total = subtotal + shipping;
  return <section className="cart-page content-wrap">
    <div className="collection-title"><p className="eyebrow">Your selection</p><h1>Shopping <em>bag.</em></h1></div>
    {lines.length ? <div className="cart-layout">
      <div className="cart-table">{lines.map(({ product, quantity }) => <div className="cart-row" key={product.id}>
        <img src={product.imageUrl} alt={product.name} />
        <div className="cart-row-info"><p className="eyebrow">{product.categoryName}</p><Link to={`/product/${product.slug}`}>{product.name}</Link>
          <div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{quantity}</span><button disabled={quantity >= product.inventory} onClick={() => changeQuantity(product.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div>
        </div><strong>{money(product.price * quantity)}</strong><button className="remove-link" onClick={() => changeQuantity(product.id, -quantity)}>Remove</button>
      </div>)}</div>
      <aside className="order-summary"><p className="eyebrow">A little recap</p>
        <div className="subtotal-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div className="subtotal-row"><span>Shipping</span><span>{shipping === 0 ? 'Complimentary' : money(shipping)}</span></div>
        <p className="summary-note">Free standard shipping on orders of $250 or more. Standard shipping is $12.</p>
        <div className="subtotal-row total-row"><strong>Total</strong><strong>{money(total)}</strong></div>
        <button className="button button-dark full-button" disabled={!apiOnline} onClick={onCheckout}>Continue to checkout <ArrowRight size={16} /></button>
        {!apiOnline && <p className="error-message" role="status">Checkout is unavailable while the commerce service is offline.</p>}
        <Link className="continue-link" to="/shop"><ArrowLeft size={14} /> Keep looking</Link>
      </aside>
    </div> : <div className="empty-state"><ShoppingBag size={28} strokeWidth={1.2} /><p className="eyebrow">Nothing in your bag, just yet</p><h2>Make room for <em>something good.</em></h2><Link to="/shop" className="button button-outline">Discover the collection</Link></div>}
  </section>;
}

function Checkout({ cartLines, subtotal, apiOnline, user, onOrder }: { cartLines: (CartLine & { product: Product })[]; subtotal: number; apiOnline: boolean; user: User | null; onOrder: (order: Order) => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');
  if (!cartLines.length) return <div className="empty-state content-wrap"><p className="eyebrow">Checkout</p><h2>Your bag is <em>empty.</em></h2><Link to="/shop" className="button button-dark">Explore the collection</Link></div>;
  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const address = `${form.get('address')}, ${form.get('city')}, ${form.get('postal')}, ${form.get('country')}`;
    try {
      const result = await request<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ email, shippingAddress: address, items: cartLines.map((line) => ({ productId: line.product.id, quantity: line.quantity })) }),
      });
      onOrder(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not place your order. Please try again.');
    } finally { setBusy(false); }
  };
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const total = subtotal + shipping;
  return <section className="checkout-page content-wrap"><div className="collection-title"><p className="eyebrow">Order details</p><h1>Almost <em>yours.</em></h1></div><div className="checkout-layout"><form className="checkout-form" onSubmit={placeOrder}><div className="checkout-step"><span>01</span><div><h2>Contact details</h2><label>Email address<input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><p className="form-hint">This email is saved with your order. Email notifications are not configured.</p></div></div><div className="checkout-step"><span>02</span><div><h2>Where to send it</h2><label>Street address<input name="address" autoComplete="street-address" required /></label><div className="field-pair"><label>City<input name="city" autoComplete="address-level2" required /></label><label>Postal code<input name="postal" autoComplete="postal-code" required /></label></div><label>Country<select name="country" defaultValue="United States"><option>United States</option><option>Canada</option><option>United Kingdom</option><option>Denmark</option><option>France</option><option>Germany</option><option>Australia</option></select></label></div></div><div className="checkout-step"><span>03</span><div><h2>Payment status</h2><p>Payments are not enabled in this environment. Submitting creates a pending order and reserves the listed stock; it will not charge you.</p><div className="payment-note"><Check size={16} /> No card details are requested or stored.</div></div></div>{!apiOnline && <p className="error-message" role="alert">The commerce service is offline. No order has been submitted.</p>}{message && <p className="error-message" role="alert">{message}</p>}<button className="button button-dark full-button" disabled={busy || !apiOnline}>{busy ? 'Submitting order…' : `Submit unpaid order · ${money(total)}`} <ArrowRight size={16} /></button></form><aside className="order-summary checkout-summary"><p className="eyebrow">In your bag</p>{cartLines.map(({ product, quantity }) => <div className="summary-product" key={product.id}><img src={product.imageUrl} alt="" /><span>{product.name} <i>× {quantity}</i></span><strong>{money(product.price * quantity)}</strong></div>)}<div className="subtotal-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="subtotal-row"><span>Shipping</span><span>{shipping === 0 ? 'Complimentary' : money(shipping)}</span></div><div className="subtotal-row total-row"><strong>Total</strong><strong>{money(total)}</strong></div></aside></div></section>;
}

function Profile({ user, onUser }: { user: User | null; onUser: (user: User | null) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage('');
    const data = new FormData(event.currentTarget);
    try {
      const result = await request<User>(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ name: data.get('name'), email: data.get('email'), password: data.get('password') }) });
      onUser(result);
      setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'We could not sign you in. Please try again.'); }
    finally { setBusy(false); }
  };
  const signOut = async () => {
    setSignOutBusy(true);
    setMessage('');
    try {
      await request('/api/auth/logout', { method: 'POST' });
      onUser(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not sign you out. Please try again.');
    } finally {
      setSignOutBusy(false);
    }
  };
  return <section className="account-page content-wrap"><div className="collection-title"><p className="eyebrow">Your Maison</p><h1>A place to <em>return.</em></h1></div>{user ? <div className="account-card"><div className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">Welcome back</p><h2>{user.name}</h2><p>{user.email}</p><div className="account-actions"><Link to="/orders" className="button button-outline">View your orders <ArrowRight size={15} /></Link>{user.role === 'ADMIN' && <Link to="/admin" className="button button-dark">Open studio dashboard <ArrowRight size={15} /></Link>}<button className="text-button" disabled={signOutBusy} onClick={signOut}>{signOutBusy ? 'Signing out…' : 'Sign out'}</button></div>{message && <p className="error-message" role="alert">{message}</p>}</div></div> : <div className="auth-layout"><div className="auth-aside"><p className="eyebrow">The Maison, closer</p><h2>Keep your<br /><em>good things.</em></h2><p>Save what speaks to you and keep track of the pieces making their way home.</p></div><form className="auth-form" onSubmit={submit}><div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create an account</button></div>{mode === 'register' && <label>Your name<input name="name" autoComplete="name" required /></label>}<label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label><button className="button button-dark full-button" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></button>{message && <p className={message.startsWith('You') ? 'form-message' : 'error-message'} role="status">{message}</p>}<p className="form-hint">An active local API connection is required to create or access an account.</p></form></div>}</section>;
}

function Orders({ orders, user }: { orders: Order[]; user: User | null }) {
  return <section className="collection-page content-wrap"><div className="collection-title"><p className="eyebrow">Your Maison</p><h1>The journey <em>continues.</em></h1></div>{orders.length ? <div className="orders-list">{orders.map((order) => <div className="order-row" key={order.orderNumber}><div><p className="eyebrow">{new Date(order.createdAt).toLocaleDateString()}</p><strong>{order.orderNumber}</strong></div><span className="order-status">{order.status.replace(/_/g, ' ')}</span><strong>{money(order.total)}</strong></div>)}</div> : <div className="empty-state"><p className="eyebrow">{user ? 'No orders to revisit' : 'A Maison account'}</p><h2>{user ? <>Your story starts <em>here.</em></> : <>Keep your story <em>close.</em></>}</h2><Link to={user ? '/shop' : '/profile'} className="button button-outline">{user ? 'Discover the collection' : 'Sign in to your account'}</Link></div>}</section>;
}

function Admin({ user, products, apiOnline, onProducts }: { user: User | null; products: Product[]; apiOnline: boolean; onProducts: (products: Product[]) => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categorySlug, setCategorySlug] = useState(categories[0].slug);
  const [inventory, setInventory] = useState('1');
  const [featured, setFeatured] = useState(false);
  if (!user || user.role !== 'ADMIN') return <div className="empty-state content-wrap"><p className="eyebrow">Studio access</p><h2>A quieter <em>backstage.</em></h2><p>Sign in with an administrator account to manage the collection.</p><Link to="/profile" className="button button-dark">Administrator sign in <ArrowRight size={16} /></Link></div>;
  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const created = await request<Product>('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ name, description, price: Number(price), imageUrl, categorySlug, inventory: Number(inventory), featured }),
      });
      onProducts([created, ...products]);
      setName('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setInventory('1');
      setFeatured(false);
      setMessage('Product created and added to the catalog.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save product. Confirm the API is online and your account has admin access.');
    }
    finally { setBusy(false); }
  };
  const adjustInventory = async (product: Product, delta: number) => {
    try {
      const updated = await request<Product>(`/api/admin/products/${product.id}/inventory`, { method: 'PATCH', body: JSON.stringify({ adjustment: delta }) });
      onProducts(products.map((item) => item.id === updated.id ? updated : item));
      setMessage(`Stock updated for ${product.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not update stock for ${product.name}.`);
    }
  };
  return <section className="admin-page content-wrap"><div className="collection-title"><p className="eyebrow">Maison Noir · Studio</p><h1>The <em>workroom.</em></h1><p>Make thoughtful changes to the collection.</p></div>{!apiOnline && <p className="error-message">The commerce API is offline; changes cannot be saved.</p>}<div className="admin-create"><div><p className="eyebrow">A new addition</p><h2>Add a piece</h2></div><form onSubmit={createProduct}>
    <label>Piece name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} required /></label>
    <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} required /></label>
    <label>Price (USD)<input type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
    <label>Image URL<input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} maxLength={500} required /></label>
    <label>Category<select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)}>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
    <label>Stock<input type="number" min="0" step="1" value={inventory} onChange={(event) => setInventory(event.target.value)} required /></label>
    <label className="admin-featured"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /> Feature this piece</label>
    <button className="button button-dark" disabled={busy || !apiOnline}>{busy ? 'Saving…' : 'Create piece'} <Plus size={16} /></button>
  </form>{message && <p className={message.includes('created') || message.includes('updated') ? 'form-message' : 'error-message'} role="status">{message}</p>}</div><div className="inventory-table"><div className="inventory-heading"><span>Piece</span><span>Category</span><span>Price</span><span>Available</span><span>Adjust stock</span></div>{products.map((product) => <div className="inventory-row" key={product.id}><span>{product.name}</span><span>{product.categoryName}</span><span>{money(product.price)}</span><span>{product.inventory}</span><span className="quantity-control"><button onClick={() => adjustInventory(product, -1)} disabled={!apiOnline || product.inventory < 1} aria-label={`Remove one ${product.name} from stock`}><Minus size={13} /></button><button onClick={() => adjustInventory(product, 1)} disabled={!apiOnline} aria-label={`Add one ${product.name} to stock`}><Plus size={13} /></button></span></div>)}</div></section>;
}

function NotFound() {
  return <div className="empty-state content-wrap"><p className="eyebrow">A little off the path</p><h2>This page took <em>another turn.</em></h2><Link to="/" className="button button-dark"><ArrowLeft size={15} /> Return to the Maison</Link></div>;
}

export default App;
