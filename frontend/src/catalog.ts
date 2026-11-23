export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string;
  categoryName: string;
  categorySlug: string;
  inventory: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
};

const photos = {
  coat: 'photo-1539109136881-3be0616acf4b',
  bag: 'photo-1584917865442-de89df76afd3',
  chair: 'photo-1598300056393-4aac492f4344',
  knit: 'photo-1576566588028-4147f3842f27',
  candle: 'photo-1602874801007-bd458bb1b8b6',
  shoes: 'photo-1543163521-1bf539c55dd2',
  table: 'photo-1499933374294-4584851497cc',
  woman: 'photo-1534528741775-53994a69daeb',
};

const photo = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const demoProducts: Product[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'the-atelier-coat',
    name: 'The Atelier Coat',
    description: 'A quietly assured silhouette in double-faced Italian wool. Cut for a generous drape and finished with considered details.',
    price: 890,
    imageUrl: photo(photos.coat),
    categoryName: 'Ready to wear',
    categorySlug: 'ready-to-wear',
    inventory: 12,
    featured: true,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'forma-shoulder-bag',
    name: 'Forma Shoulder Bag',
    description: 'Sculptural lines meet supple Italian leather. Made in a small family-run atelier with a softly structured interior.',
    price: 560,
    imageUrl: photo(photos.bag),
    categoryName: 'Accessories',
    categorySlug: 'accessories',
    inventory: 8,
    featured: true,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'object-no-04-chair',
    name: 'Object No. 04 Chair',
    description: 'An honest study in proportion, crafted from solid ash and hand-finished in a warm, natural oil.',
    price: 1240,
    imageUrl: photo(photos.chair),
    categoryName: 'Objects',
    categorySlug: 'objects',
    inventory: 4,
    featured: true,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'cashmere-crew',
    name: 'Cashmere Crew',
    description: 'A light, beautifully soft layer in traceable cashmere, knitted in Scotland for years of everyday wear.',
    price: 420,
    imageUrl: photo(photos.knit),
    categoryName: 'Ready to wear',
    categorySlug: 'ready-to-wear',
    inventory: 16,
    featured: false,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    slug: 'evening-study-candle',
    name: 'Evening Study Candle',
    description: 'Black tea, cedar, and a hint of bergamot. Hand-poured in small batches with a clean-burning wax blend.',
    price: 68,
    imageUrl: photo(photos.candle),
    categoryName: 'Objects',
    categorySlug: 'objects',
    inventory: 32,
    featured: false,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    slug: 'the-sculpted-flat',
    name: 'The Sculpted Flat',
    description: 'A softly squared toe and a beautifully balanced heel, cut from buttery nappa leather in Portugal.',
    price: 380,
    imageUrl: photo(photos.shoes),
    categoryName: 'Accessories',
    categorySlug: 'accessories',
    inventory: 10,
    featured: false,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    slug: 'travertine-side-table',
    name: 'Travertine Side Table',
    description: 'A monolithic form carved from honed travertine, each piece bearing its own natural variation.',
    price: 980,
    imageUrl: photo(photos.table),
    categoryName: 'Objects',
    categorySlug: 'objects',
    inventory: 3,
    featured: true,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    slug: 'silk-column-dress',
    name: 'Silk Column Dress',
    description: 'Fluid silk falls into a clean, elongating line. A forever piece that moves effortlessly from day to evening.',
    price: 720,
    imageUrl: photo(photos.woman),
    categoryName: 'Ready to wear',
    categorySlug: 'ready-to-wear',
    inventory: 6,
    featured: false,
    rating: 0,
    reviewCount: 0,
  },
];

export const categories = [
  { name: 'Ready to wear', slug: 'ready-to-wear', image: photo(photos.woman, 1200) },
  { name: 'Accessories', slug: 'accessories', image: photo(photos.bag, 1200) },
  { name: 'Objects', slug: 'objects', image: photo(photos.chair, 1200) },
];
