import { Component, useEffect, useMemo, useState } from 'react';
import { explainAuthError, isGoogleAuthConfigured, signInWithGoogle, signOut, watchAuth } from './firebaseAuth';
import { downloadOrderReceipt } from './receiptPdf';

const kitchens = [
  {
    id: 'thalassery', name: 'Thalassery Dum Biryani House', cuisine: 'Malabar · Biryani · Kebabs', eta: 28, rating: '4.8', tags: ['Biryani', 'Malabar'],
    sections: [
      { name: 'DUM BIRYANI', items: [
        { id: 'chicken-biryani', name: 'Chicken Biryani', detail: 'Seeraga samba rice · slow dum · raita', price: 220, veg: false },
        { id: 'mutton-biryani', name: 'Mutton Biryani', detail: 'Tender goat · fragrant short-grain rice', price: 290, veg: false },
      ] },
      { name: 'FROM THE TAWA', items: [
        { id: 'egg-roast', name: 'Kerala Egg Roast', detail: 'Two eggs · roasted onion masala', price: 110, veg: false },
        { id: 'parotta', name: 'Parotta (2 pcs)', detail: 'Flaky, layered, made by hand', price: 30, veg: true },
      ] },
    ],
  },
  {
    id: 'meenakshi', name: 'Meenakshi Mess', cuisine: 'Tamil · Meals · Parotta', eta: 22, rating: '4.7', tags: ['Meals', 'South Indian'],
    sections: [
      { name: 'LUNCH LEAF', items: [
        { id: 'mini-meals', name: 'Mini Meals', detail: 'Rice · sambar · poriyal · appalam', price: 160, veg: true },
        { id: 'curd-rice', name: 'Curd Rice', detail: 'Tempered curd rice · pickle', price: 90, veg: true },
      ] },
      { name: 'PAROTTA & GRAVY', items: [
        { id: 'parotta-pcs', name: 'Parotta (2 pcs)', detail: 'Layered and griddled to order', price: 30, veg: true },
        { id: 'chicken-salna', name: 'Chicken Salna', detail: 'Peppery home-style curry', price: 140, veg: false },
      ] },
    ],
  },
  {
    id: 'namma-oota', name: 'Namma Oota Company', cuisine: 'Kannadiga · Rice · Curries', eta: 34, rating: '4.9', tags: ['Meals', 'South Indian'],
    sections: [{ name: 'KARNATAKA COMFORTS', items: [
      { id: 'oota', name: 'Karnataka Oota', detail: 'Rice · saaru · palya · kosambari', price: 180, veg: true },
      { id: 'mudde', name: 'Ragi Mudde', detail: 'Finger millet balls · bassaru', price: 110, veg: true },
      { id: 'donne', name: 'Donne Chicken Biryani', detail: 'Green masala · donne leaf bowl', price: 220, veg: false },
    ] }],
  },
  {
    id: 'parotta-corner', name: 'Parotta Corner', cuisine: 'Kerala · Parotta · Curry', eta: 19, rating: '4.6', tags: ['Malabar', 'Parotta'],
    sections: [{ name: 'TAWA & CURRY', items: [
      { id: 'kerala-parotta', name: 'Kerala Parotta (2 pcs)', detail: 'Crisp edges · soft layers', price: 30, veg: true },
      { id: 'beef-curry', name: 'Beef Curry', detail: 'Slow-cooked · coconut · curry leaf', price: 230, veg: false },
      { id: 'chicken-stew', name: 'Chicken Stew', detail: 'Coconut milk · whole spices', price: 180, veg: false },
    ] }],
  },
  {
    id: 'mtr', name: 'MTR 1924', cuisine: 'Udupi · Dosa · Tiffin', eta: 31, rating: '4.8', tags: ['South Indian', 'Tiffin'],
    sections: [{ name: 'TUMMING TIFFIN', items: [
      { id: 'masala-dosa', name: 'Masala Dosa', detail: 'Ghee roast · potato palya · chutney', price: 130, veg: true },
      { id: 'idli-vada', name: 'Idli Vada', detail: 'Two idli · one vada · sambar', price: 105, veg: true },
      { id: 'kesari-bath', name: 'Kesari Bath', detail: 'Saffron · cashew · warm ghee', price: 75, veg: true },
    ] }],
  },
  {
    id: 'empire', name: 'Empire Restaurant', cuisine: 'North Indian · Grill · Biryani', eta: 26, rating: '4.5', tags: ['Biryani', 'Grill'],
    sections: [{ name: 'THE LATE-NIGHT FAVOURITES', items: [
      { id: 'pepper-fry', name: 'Chicken Pepper Fry', detail: 'Black pepper · curry leaf · onion', price: 230, veg: false },
      { id: 'empire-biryani', name: 'Chicken Biryani', detail: 'Basmati rice · raita · salan', price: 220, veg: false },
      { id: 'paneer-tikka', name: 'Paneer Tikka', detail: 'Tandoor char · mint chutney', price: 210, veg: true },
    ] }],
  },
];

const filters = ['All kitchens', 'Biryani', 'South Indian', 'Malabar', 'Tiffin'];
const formatRupees = (amount) => `₹${Math.round(amount).toLocaleString('en-IN')}`;
const foodPhotos = {
  biryani: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=1100&q=82',
  dosa: 'https://images.unsplash.com/photo-1743517894265-c86ab035adef?auto=format&fit=crop&w=1000&q=80',
  curry: 'https://images.unsplash.com/photo-1742599361498-79824d24e355?auto=format&fit=crop&w=1000&q=80',
};
const kitchenPhoto = (kitchen) => kitchen.id === 'mtr' ? foodPhotos.dosa : kitchen.id === 'empire' ? foodPhotos.curry : foodPhotos.biryani;
const dishPhotos = {
  'chicken-biryani': foodPhotos.biryani,
  'mutton-biryani': 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Ch_480%2Cw_480/InstamartAssets/mutton_biryani.webp?updatedAt=1727156023947',
  'egg-roast': 'https://www.hindustantimes.com/ht-img/img/2025/02/12/1600x900/kerala_1739360335199_1739360339959.jpg',
  'parotta': 'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Cw_480%2Ch_480%2Cc_fit/FOOD_CATALOG/IMAGES/CMS/2025/9/11/367da6d9-8809-44c9-9ed3-3881def75697_8326e1f7-ffe8-4e8f-bd27-6dfb40bb06f7.jpg',
  'mini-meals': 'https://rakskitchen.net/wp-content/uploads/2013/11/10993534204_2ae8179db1_z.jpg',
  'curd-rice': 'https://images.unsplash.com/photo-1633383718081-22ac93e3db65?auto=format&fit=crop&w=480&q=78',
  'parotta-pcs': 'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Cw_480%2Ch_480%2Cc_fit/FOOD_CATALOG/IMAGES/CMS/2025/9/11/367da6d9-8809-44c9-9ed3-3881def75697_8326e1f7-ffe8-4e8f-bd27-6dfb40bb06f7.jpg',
  'chicken-salna': 'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Cw_480%2Ch_480%2Cc_fill/RX_THUMBNAIL/IMAGES/VENDOR/2025/11/29/c8a66385-cdb0-4be8-b7bd-fd24f91f55f6_1253564%20%281%29.jpg',
  oota: 'https://rakskitchen.net/wp-content/uploads/2013/11/10993534204_2ae8179db1_z.jpg',
  mudde: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Ragi_Mudde.jpg',
  donne: 'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Cw_480%2Ch_480%2Cc_fit/FOOD_CATALOG/IMAGES/CMS/2025/3/12/b2460af8-c59d-46eb-9279-91c68e1da387_084e2dc3-c661-4e68-955b-9bc0e4f4ef5d.jpg',
  'kerala-parotta': 'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Cw_480%2Ch_480%2Cc_fit/FOOD_CATALOG/IMAGES/CMS/2025/9/11/367da6d9-8809-44c9-9ed3-3881def75697_8326e1f7-ffe8-4e8f-bd27-6dfb40bb06f7.jpg',
  'beef-curry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Kerala_Beef_Curry.jpg/480px-Kerala_Beef_Curry.jpg',
  'chicken-stew': 'https://kitchenmai.com/wp-content/uploads/2020/12/stew2_blog-500x500.jpg',
  'masala-dosa': 'https://154630363.cdn6.editmysite.com/uploads/1/5/4/6/154630363/XSWPR3Z73RCKZWWDDDQCERAH.png',
  'idli-vada': 'https://b.zmtcdn.com/data/dish_photos/b93/8783b18ad1c78491d5bf272ece73cb93.jpg',
  'kesari-bath': 'https://shrikripa.in/wp-content/uploads/2021/11/DSC_0744-1024x683.jpg',
  'pepper-fry': 'https://www.keralatourism.org/responsible-tourism/uploads/ec/cuisine/thumb/Chicken_Pepper_Fry20131126124009_58_1.jpg',
  'empire-biryani': foodPhotos.biryani,
  'paneer-tikka': 'https://norex.in/uploads/images/202208/img_x600_630dedb1a4ec80-27148532-44935679.jpg',
};
const itemPhoto = (item) => dishPhotos[item.id];

function PinIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.5"><path d="M16 8.2c0 4.1-6 9.1-6 9.1S4 12.3 4 8.2a6 6 0 1 1 12 0Z"/><circle cx="10" cy="8" r="2"/></svg>;
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.5"><circle cx="8.7" cy="8.7" r="5.6"/><path d="m13 13 4 4"/></svg>;
}

function BackIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6"><path d="M16 10H4m0 0 5-5m-5 5 5 5"/></svg>;
}

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="min-h-screen px-6 py-24 text-center"><span className="stamp stamp-red">KITCHEN NOTE</span><h1 className="mt-8 font-display text-3xl">We lost our place.</h1><p className="mt-3 text-sm text-ink/65">The menu could not be read just now.</p><button className="plain-button mt-8" onClick={() => window.location.reload()}>Try again</button></main>;
    return this.props.children;
  }
}

function VegMark({ veg }) {
  return <span className={`veg-mark ${veg ? 'veg' : 'non-veg'}`} role="img" aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}><span /></span>;
}

function KitchenRow({ kitchen, index, onOpen }) {
  return (
    <button type="button" className="kitchen-row kitchen-row-button slip-in text-left" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }} onClick={() => onOpen(kitchen)} aria-label={`Open menu for ${kitchen.name}, ${kitchen.cuisine}, ${kitchen.eta} minutes, rated ${kitchen.rating}`}>
      <div className="row-index mono">{String(index + 1).padStart(2, '0')}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[18px] leading-[1.22] tracking-[-0.025em]">{kitchen.name}</h3>
          <span className="eta mono shrink-0">{kitchen.eta}<span className="eta-unit"> MIN</span></span>
        </div>
        <div className="mt-[7px] flex items-center gap-2">
          <p className="truncate text-[11px] leading-4 text-ink/65">{kitchen.cuisine}</p><span className="leader" aria-hidden="true" /><span className="rating mono"><span className="rating-star">★</span> {kitchen.rating}</span>
        </div>
        <div className="mt-[10px] flex items-center justify-between gap-2">
          <span className="kitchen-note mono"><span className="hidden sm:inline">HOUSE PICK · </span>{kitchen.sections[0].items[0].name}</span>
          <span className="order-min mono">{formatRupees(kitchen.sections[0].items[0].price)}</span>
        </div>
      </div>
    </button>
  );
}

function LoadingLine() {
  return <div className="loading-note mono" role="status" aria-label="Loading nearby kitchens">READING THE NEIGHBORHOOD<span className="cursor-block">▋</span></div>;
}

function AppHeader({ screen, onBack, cartCount, onOpenCart }) {
  return (
    <header className="top-rule flex items-center justify-between py-4">
      <div className="flex min-w-0 items-center gap-3">
        {screen !== 'home' && <button className="header-back" type="button" onClick={onBack} aria-label="Go back"><BackIcon /></button>}
        <a className="wordmark font-display" href="#home" onClick={(event) => { event.preventDefault(); onBack(); }} aria-label="khana home">khana<span className="text-chilli">.</span></a>
      </div>
      <div className="flex items-center gap-2">
        <span className="location-icon text-chilli"><PinIcon /></span>
        <div className="leading-tight"><span className="block mono text-[9px] tracking-[0.08em] text-ink/55">DELIVERING NEAR</span><span className="mt-1 block text-[12px] font-semibold">Indiranagar, Bengaluru <span className="text-chilli">⌄</span></span></div>
      </div>
      <button type="button" className="header-cart mono" onClick={onOpenCart} aria-label={`Open chit, ${cartCount} items`}><span>CHIT</span><span className="cart-count">{String(cartCount).padStart(2, '0')}</span></button>
    </header>
  );
}

function AccountStrip({ user, onSignIn, onSignOut }) {
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Khana diner';
  return <div className="account-strip" aria-live="polite">
    <div className="account-copy"><span className="mono account-kicker">{user ? 'SIGNED IN AS' : 'ORDERING AS A GUEST'}</span><span className="account-name">{user ? displayName : 'Your chit is ready when you are.'}</span></div>
    {user ? <button className="account-action mono" type="button" onClick={onSignOut}>SIGN OUT</button> : <button className="account-action mono" type="button" onClick={onSignIn}>SIGN IN WITH GOOGLE <span aria-hidden="true">↗</span></button>}
  </div>;
}

function SignInDialog({ busy, message, onClose, onGoogleSignIn, onGuest }) {
  useEffect(() => {
    function closeOnEscape(event) { if (event.key === 'Escape') onClose(); }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="auth-slip screen-reveal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="auth-close mono" type="button" onClick={onClose} aria-label="Close sign-in">×</button>
      <span className="stamp stamp-red auth-stamp">ACCOUNT<br />ENTRY</span>
      <p className="mono auth-kicker">KHANA · CUSTOMER COPY</p>
      <h2 id="auth-title" className="font-display">Keep your place.</h2>
      <p className="auth-description">Sign in to see your name on the chit and pick up where you left off.</p>
      <button className="google-action mono" type="button" onClick={onGoogleSignIn} disabled={busy}><span className="google-g" aria-hidden="true">G</span><span>{busy ? 'OPENING GOOGLE…' : 'CONTINUE WITH GOOGLE'}</span><span aria-hidden="true">→</span></button>
      {message && <p className="auth-message" role="status">{message}</p>}
      {!isGoogleAuthConfigured && <p className="auth-setup mono">GOOGLE SIGN-IN NEEDS THE FIREBASE WEB SETTINGS IN .ENV.LOCAL.</p>}
      <button className="guest-action mono" type="button" onClick={onGuest}>KEEP BROWSING AS A GUEST</button>
      <p className="auth-foot">No password to remember. Google handles sign-in securely.</p>
    </section>
  </div>;
}

function HomeScreen({ query, setQuery, activeFilter, setActiveFilter, loading, visibleKitchens, onOpen }) {
  return (
    <>
      <section className="intro-grid screen-reveal pt-8 sm:pt-16">
        <div className="intro-main">
          <div className="flex items-center gap-2"><span className="section-tag mono">YOUR LOCAL FOOD LINE-UP</span><span className="tag-rule" /><span className="issue-number mono">NO. 018</span></div>
          <h1 className="mt-6 max-w-[680px] font-display text-[38px] font-medium leading-[1.04] tracking-[-0.045em] sm:text-[56px] sm:leading-[1.03]">Good food is<br className="hidden sm:block" /> closer than <span className="heading-accent">you think.</span></h1>
          <p className="intro-copy mt-4 max-w-[34ch] text-[13px] leading-[1.65] text-ink/70 sm:mt-6 sm:text-[15px]">The neighborhood kitchens doing the most, delivered while it’s still lovely.</p>
        </div>
        <div className="intro-stamp-wrap hidden sm:flex"><div className="stamp stamp-red"><span>MADE</span><span>NEARBY</span><span className="stamp-star">KHANA</span></div></div>
      </section>
      <section className="house-pick slip-in" aria-label="Today's house pick">
        <div className="house-pick-image-wrap"><img className="house-pick-image" src={foodPhotos.biryani} alt="A bowl of fragrant chicken biryani" fetchPriority="high" /></div>
        <div className="house-pick-copy"><span className="mono house-pick-label">TODAY’S HOUSE PICK</span><h2 className="font-display">Chicken Biryani</h2><p>Thalassery Dum Biryani House · slow dum, warm spice.</p><button className="house-pick-link mono" type="button" onClick={() => onOpen(kitchens[0])}>READ THE MENU <span>↗</span></button></div>
        <span className="house-pick-price mono">₹220</span>
      </section>
      <section className="search-section mt-8" aria-label="Search kitchens">
        <label htmlFor="kitchen-search" className="search-line"><span className="search-icon"><SearchIcon /></span><input id="kitchen-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a dish, a kitchen, a craving" autoComplete="off" /><span className="search-key mono hidden sm:inline">SEARCH ↵</span></label>
      </section>
      <section className="filter-section mt-6" aria-label="Kitchen types"><div className="filter-list" role="group" aria-label="Filter kitchens">
        {filters.map((filter) => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`filter-item ${activeFilter === filter ? 'filter-active' : ''}`} aria-pressed={activeFilter === filter}>{filter}</button>)}
      </div></section>
      <section className="menu-board mt-8 sm:mt-12" aria-labelledby="board-heading">
        <div className="board-head"><div><p className="board-kicker mono">THE NEIGHBORHOOD MENU</p><h2 id="board-heading" className="mt-1 font-display text-[24px] leading-tight tracking-[-0.03em] sm:text-[28px]">Kitchens open now</h2></div><span className="open-stamp stamp mono"><span className="open-dot" /> TAKING ORDERS</span></div>
        <div className="board-columns mono hidden sm:grid" aria-hidden="true"><span>KITCHEN / WHAT THEY DO</span><span>DELIVERY</span></div>
        <div className="kitchen-list" aria-live="polite">{loading ? <LoadingLine /> : visibleKitchens.length ? visibleKitchens.map((kitchen, index) => <KitchenRow key={kitchen.id} kitchen={kitchen} index={index} onOpen={onOpen} />) : <div className="empty-note"><span className="mono text-chilli">NO MATCH ON THIS CHIT</span><p className="mt-2 font-display text-[20px]">Nothing cooking under that name.</p><button className="plain-button mt-3" onClick={() => { setQuery(''); setActiveFilter('All kitchens'); }}>Clear the search</button></div>}</div>
        <div className="board-footer mono"><span>{String(visibleKitchens.length).padStart(2, '0')} KITCHENS IN YOUR NEIGHBORHOOD</span><span className="footer-mark">FRESH FROM THE PASS</span></div>
      </section>
    </>
  );
}

function MenuScreen({ kitchen, cart, onAdd, onChangeQty, onOpenCart, message }) {
  const quantity = (itemId) => cart.find((line) => line.itemId === itemId)?.qty || 0;
  return (
    <main className="subscreen menu-screen screen-reveal">
      <div className="screen-overline mono">KITCHEN MENU <span>·</span> {kitchen.eta} MIN TO YOUR DOOR</div>
      <div className="menu-title-row"><div><h1 className="font-display menu-title">{kitchen.name}</h1><p className="mt-2 text-[12px] text-ink/65">{kitchen.cuisine}</p></div><span className="rating mono"><span className="rating-star">★</span> {kitchen.rating}</span></div>
      <figure className="menu-photo dish-reveal"><img src={kitchenPhoto(kitchen)} alt={`${kitchen.cuisine} from ${kitchen.name}`} loading="lazy" decoding="async" /><figcaption className="mono"><span>FROM THE PASS</span><span>MADE CLOSE · EAT WARM</span></figcaption></figure>
      <div className="menu-notice mono">FRESH FROM THE KITCHEN · PRICES IN INR</div>
      {kitchen.sections.map((section) => <section className="printed-section" key={section.name}><h2 className="section-rule-title mono">{section.name}</h2>{section.items.map((item, itemIndex) => {
        const qty = quantity(item.id);
        return <article className="dish-row dish-reveal" style={{ animationDelay: `${itemIndex * 55}ms` }} key={item.id}>
          <img className="dish-thumb" src={itemPhoto(item)} alt={`Photo of ${item.name}`} loading="lazy" decoding="async" />
          <VegMark veg={item.veg} />
          <div className="dish-info"><h3 className="dish-title font-display">{item.name}</h3><p className="dish-detail">{item.detail}</p></div>
          <div className="dish-action"><span className="dish-price mono">{formatRupees(item.price)}</span>{qty ? <div className="stepper" aria-label={`${item.name} quantity`}><button type="button" onClick={() => onChangeQty(item, -1)} aria-label={`Remove one ${item.name}`}>−</button><span className="mono">{qty}</span><button type="button" onClick={() => onAdd(item)} aria-label={`Add one ${item.name}`}>+</button></div> : <button type="button" className="add-button" onClick={() => onAdd(item)}>ADD</button>}</div>
        </article>;
      })}</section>)}
      {message && <p className="inline-message" role="status">{message}</p>}
      {cart.length > 0 && <button type="button" className="bottom-action" onClick={onOpenCart}><span>VIEW YOUR CHIT · {cart.reduce((sum, line) => sum + line.qty, 0)} ITEMS</span><span>{formatRupees(cart.reduce((sum, line) => sum + line.price * line.qty, 0))} &nbsp; →</span></button>}
      <p className="menu-foot mono">SQUARE · DOT MARKS VEGETARIAN / CHILLI MARKS NON-VEG</p>
    </main>
  );
}

function CartScreen({ cart, couponInput, setCouponInput, couponApplied, setCouponApplied, payment, setPayment, totals, onChangeQty, onCheckout, onExplore, onClear, message }) {
  return (
    <main className="subscreen cart-screen screen-reveal">
      <div className="screen-overline mono">CUSTOMER COPY <span>·</span> ORDER CHIT</div>
      <h1 className="font-display screen-title">Your order, itemised.</h1>
      {!cart.length ? <div className="empty-chit"><span className="empty-index mono">NO. 000</span><h2 className="font-display">Nothing on your chit yet.</h2><p>There’s a kitchen nearby with your name on it.</p><button type="button" className="plain-button mt-6" onClick={onExplore}>Find something good</button></div> : <>
        <div className="bill-kitchen mono"><div><span>FROM THE KITCHEN</span><button type="button" className="clear-chit" onClick={onClear}>CLEAR CHIT</button></div><span>{cart[0].kitchenName}</span></div>
        <div className="bill-lines">{cart.map((line) => <article className="bill-item" key={line.itemId}><div className="bill-item-name"><span className="mono bill-qty">{String(line.qty).padStart(2, '0')} ×</span><span>{line.name}</span></div><div className="bill-item-end"><span className="mono">{formatRupees(line.price * line.qty)}</span><div className="mini-stepper"><button type="button" aria-label={`Remove one ${line.name}`} onClick={() => onChangeQty(line, -1)}>−</button><button type="button" aria-label={`Add one ${line.name}`} onClick={() => onChangeQty(line, 1)}>+</button></div></div></article>)}</div>
        <section className="bill-summary" aria-label="Bill total">
          <div className="bill-calc"><span>Subtotal</span><b>{formatRupees(totals.subtotal)}</b></div>
          {couponApplied && <div className="bill-calc discount-line"><span>Chilli coupon · {couponApplied}</span><b>− {formatRupees(totals.discount)}</b></div>}
          <div className="bill-calc"><span>Delivery fee</span><b>{totals.delivery ? formatRupees(totals.delivery) : 'ON US'}</b></div>
          <div className="bill-calc"><span>GST · 5%</span><b>{formatRupees(totals.tax)}</b></div>
          <div className="bill-total"><span className="mono">TOTAL TO PAY</span><span className="bill-total-leader" /><b className="mono">{formatRupees(totals.total)}</b></div>
        </section>
        <div className="coupon-tear"><div className="coupon-caption mono">TEAR OFF · 10% OFF WITH KHANAFIRST</div><div className="coupon-entry"><input aria-label="Coupon code" value={couponInput} onChange={(event) => { setCouponInput(event.target.value.toUpperCase()); setCouponApplied(''); }} placeholder="TYPE CODE" /><button type="button" onClick={() => setCouponApplied(couponInput.trim() === 'KHANAFIRST' ? 'KHANAFIRST' : '')}>{couponApplied ? 'APPLIED ✓' : 'APPLY'}</button></div>{couponInput && couponInput !== 'KHANAFIRST' && !couponApplied && <p className="coupon-hint" role="status">That one missed. Try KHANAFIRST.</p>}</div>
        <fieldset className="payment-options"><legend className="mono">PAYMENT · PICK ONE</legend>{['UPI', 'Card', 'Wallet', 'Cash on delivery'].map((option) => <label className="payment-choice" key={option}><input type="radio" name="payment" value={option} checked={payment === option} onChange={() => setPayment(option)} /><span className="custom-radio" /><span>{option}</span><span className="payment-note mono">{option === 'UPI' ? 'GPay · PhonePe' : option === 'Card' ? 'Credit / debit' : option === 'Wallet' ? 'Paytm · Amazon' : 'PAY AT DOOR'}</span></label>)}</fieldset>
        {message && <p className="inline-message" role="status">{message}</p>}
        <button type="button" className="primary-order" onClick={onCheckout}><span>PLACE ORDER</span><span className="mono">{formatRupees(totals.total)} →</span></button>
        <p className="secure-note mono">PAYMENT DETAILS ARE ENCRYPTED · NO SURPRISES</p>
      </>}
    </main>
  );
}

function TrackingMap() {
  return <div className="map-slip" role="img" aria-label="Schematic route from the restaurant to your delivery address"><svg viewBox="0 0 340 142" preserveAspectRatio="none"><path className="map-road" d="M-10 26H84l32 26h62l30-28h142M17 151V92l36-34V4M121 148V78l30-26V3M230 145V92l-23-24 33-40V2M302 149V97l-41-31V4M-5 112h75l41-34h93l28 26h117"/><path className="map-route" d="M45 115h63l29-31h51l25-25 34 3 20-22h35"/><circle className="map-origin" cx="45" cy="115" r="6"/><circle className="map-destination" cx="302" cy="40" r="7"/></svg><div className="map-label mono"><span>THALASSERY DUM BIRYANI HOUSE</span><span>YOUR DOOR</span></div><span className="map-stamp mono">ROUTE SLIP · BLR</span></div>;
}

function TrackingScreen({ order, onBackHome, onDownloadReceipt, receiptMessage }) {
  const steps = ['Order placed', 'Preparing', 'Picked up', 'Delivered'];
  const stage = order?.stage ?? 1;
  return (
    <main className="subscreen tracking-screen screen-reveal">
      <div className="screen-overline mono">ORDER TRACKING <span>·</span> {order?.number}</div>
      <section className="order-confirmation slip-in" aria-labelledby="order-confirmation-title">
        <div className="order-confirmation-head">
          <span className="stamp order-placed-stamp">ORDER<br />PLACED</span>
          <div className="order-confirmation-copy">
            <span className="mono">CHIT {order?.number}</span>
            <h2 id="order-confirmation-title" className="font-display">Your order is with the kitchen.</h2>
            <p>The pass has your chit. We’re getting it ready.</p>
          </div>
        </div>
        <button type="button" className="plain-button confirmation-download" onClick={onDownloadReceipt}>
          <span>DOWNLOAD CUSTOMER BILL</span><span className="mono">PDF ↓</span>
        </button>
        {receiptMessage && <p className="mono tracking-receipt-message" role="status">{receiptMessage}</p>}
      </section>
      <div className="tracking-title-row"><div><p className="mono tracking-caption">EXPECTED AT YOUR DOOR IN</p><h1 className="eta-big mono">{stage >= 3 ? '00' : order?.eta ?? 28}<span>{stage >= 3 ? ' MIN' : ' MIN'}</span></h1></div><span className="stamp status-stamp">{steps[stage].toUpperCase()}</span></div>
      <TrackingMap />
      <section className="timeline" aria-label="Order progress">{steps.map((step, index) => <div className={`timeline-step ${index < stage ? 'step-done' : ''} ${index === stage ? 'step-current' : ''}`} key={step}><span className="timeline-node" aria-hidden="true"><span /></span><div className="timeline-copy"><span className="timeline-title">{step}</span>{index === stage && <span className="timeline-current mono">CURRENT STATUS</span>}</div><time className="timeline-time mono">{index < stage ? order?.times?.[index] ?? 'DONE' : index === stage ? 'NOW' : '— —'}</time></div>)}</section>
      <div className="tracking-note"><span className="mono">KITCHEN NOTE</span><p>{stage === 0 ? 'Your order is on the chit. The kitchen has been notified.' : stage === 1 ? 'The kitchen has your order and is getting it just right.' : stage === 2 ? 'Your delivery partner has picked up the order.' : 'At your door. Best enjoyed while it’s hot.'}</p></div>
      <button type="button" className="plain-button tracking-home" onClick={onBackHome}>Back to the neighborhood</button>
    </main>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All kitchens');
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('home');
  const [selectedKitchen, setSelectedKitchen] = useState(null);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState('');
  const [payment, setPayment] = useState('UPI');
  const [order, setOrder] = useState(null);
  const [receiptMessage, setReceiptMessage] = useState('');
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const currentTime = useMemo(() => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()), []);
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
    const discount = couponApplied === 'KHANAFIRST' ? Math.min(Math.round(subtotal * 0.1), 100) : 0;
    const delivery = subtotal === 0 || subtotal >= 500 ? 0 : 25;
    const tax = Math.round((subtotal - discount) * 0.05);
    return { subtotal, discount, delivery, tax, total: subtotal - discount + delivery + tax };
  }, [cart, couponApplied]);

  useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 420); return () => window.clearTimeout(timer); }, []);
  useEffect(() => watchAuth(setUser, (error) => setAuthMessage(explainAuthError(error))), []);
  const visibleKitchens = useMemo(() => kitchens.filter((kitchen) => {
    const needle = query.trim().toLowerCase();
    return (!needle || `${kitchen.name} ${kitchen.cuisine} ${kitchen.sections.flatMap((section) => section.items.map((item) => item.name)).join(' ')}`.toLowerCase().includes(needle)) && (activeFilter === 'All kitchens' || kitchen.tags.includes(activeFilter));
  }), [query, activeFilter]);

  function goHome() { setScreen('home'); setMessage(''); }
  function openKitchen(kitchen) { setSelectedKitchen(kitchen); setMessage(''); setScreen('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function openCart() { setMessage(''); setScreen('cart'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function updateQuantity(item, delta) {
    const itemId = item.id ?? item.itemId;
    if (delta > 0 && !cart.some((line) => line.itemId === itemId) && cart.some((line) => line.kitchenId !== selectedKitchen?.id)) {
      setMessage('One kitchen per chit. Finish or clear the current order first.');
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.itemId === itemId);
      if (existing) return current.map((line) => line.itemId === itemId ? { ...line, qty: Math.max(0, line.qty + delta) } : line).filter((line) => line.qty > 0);
      if (delta < 0 || !selectedKitchen) return current;
      return [...current, { itemId, kitchenId: selectedKitchen.id, kitchenName: selectedKitchen.name, name: item.name, price: item.price, qty: 1 }];
    });
    setMessage('');
  }
  function placeOrder() {
    if (!cart.length) return;
    const now = new Date();
    const stamp = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
    const orderedKitchen = kitchens.find((kitchen) => kitchen.id === cart[0].kitchenId);
    const receipt = {
      number: `KH-${String(now.getTime()).slice(-6)}`,
      kitchen: cart[0].kitchenName,
      createdAt: now.toISOString(),
      time: stamp,
      customerName: user?.displayName || 'Guest',
      items: cart.map((item) => ({ ...item })),
      totals: { ...totals },
      coupon: couponApplied,
      payment,
      eta: orderedKitchen?.eta ?? 28,
      stage: 1,
      times: [stamp],
    };
    setReceiptMessage('Your customer bill is ready to download.');
    setOrder(receipt);
    setCart([]);
    setCouponApplied('');
    setCouponInput('');
    setScreen('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function redownloadReceipt() {
    if (!order) return;
    try {
      downloadOrderReceipt(order);
      setReceiptMessage('Your customer bill PDF is downloading.');
    } catch {
      setReceiptMessage('The bill could not be downloaded. Please try again.');
    }
  }
  async function handleGoogleSignIn() {
    setAuthBusy(true);
    setAuthMessage('');
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        setUser(signedInUser);
        setAuthOpen(false);
      }
    } catch (error) {
      setAuthMessage(explainAuthError(error));
    } finally {
      setAuthBusy(false);
    }
  }
  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
      setAuthMessage('');
    } catch (error) {
      setAuthMessage(explainAuthError(error));
    }
  }

  return (
    <ErrorBoundary>
      <div className="paper-grain min-h-screen bg-paper text-ink">
        <div className="mx-auto min-h-screen w-full max-w-[1120px] px-6 pb-10 sm:px-8 lg:px-12">
          <AppHeader screen={screen} onBack={goHome} cartCount={cartCount} onOpenCart={openCart} />
          <AccountStrip user={user} onSignIn={() => { setAuthMessage(''); setAuthOpen(true); }} onSignOut={handleSignOut} />
          {screen === 'home' && <HomeScreen query={query} setQuery={setQuery} activeFilter={activeFilter} setActiveFilter={setActiveFilter} loading={loading} visibleKitchens={visibleKitchens} onOpen={openKitchen} />}
          {screen === 'menu' && selectedKitchen && <MenuScreen kitchen={selectedKitchen} cart={cart} onAdd={(item) => updateQuantity(item, 1)} onChangeQty={updateQuantity} onOpenCart={openCart} message={message} />}
          {screen === 'cart' && <CartScreen cart={cart} couponInput={couponInput} setCouponInput={setCouponInput} couponApplied={couponApplied} setCouponApplied={setCouponApplied} payment={payment} setPayment={setPayment} totals={totals} onChangeQty={updateQuantity} onCheckout={placeOrder} onExplore={goHome} onClear={() => { setCart([]); setCouponApplied(''); setCouponInput(''); }} message={message} />}
          {screen === 'tracking' && order && <TrackingScreen order={order} onBackHome={goHome} onDownloadReceipt={redownloadReceipt} receiptMessage={receiptMessage} />}
          {authOpen && <SignInDialog busy={authBusy} message={authMessage} onClose={() => setAuthOpen(false)} onGoogleSignIn={handleGoogleSignIn} onGuest={() => setAuthOpen(false)} />}
          <footer className="page-foot mt-12 flex items-center justify-between gap-4 border-t border-dashed border-ink/45 pt-4 mono text-[9px] text-ink/55"><span>GOOD FOOD. GOOD PEOPLE. GOOD CALL.</span><span>BLR · {currentTime}</span></footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
