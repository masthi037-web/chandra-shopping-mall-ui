import type { Category } from '@/lib/types';

export const categories: Category[] = [
  {
    id: 'saree',
    name: 'Saree',
    categoryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400',
    catalogs: [
      {
        id: 'mulmul-saree',
        name: 'Mulmul Saree',
        catalogueImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=400',
        products: [
          {
            id: 's1',
            name: 'Whispering Breeze Mulmul Saree',
            price: 1850,
            imageId: 'saree-1',
            description: 'Ultra-soft, lightweight handcrafted Mulmul cotton saree, dipped in rich indigo natural dyes and print blocks.',
            rating: 4.8,
            deliveryTime: '2-3 days',
            deliveryCost: 50,
            createdAt: '2026-01-01T00:00:00Z',
            famous: true,
            ingredients: '100% Organic Mulmul Cotton',
            bestBefore: 'Lifetime Keep',
            instructions: 'Dry clean recommended. Hand wash separately in cold water with mild detergent.',
            productStatus: 'ACTIVE',
            images: [
              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'
            ],
            pricing: [
              {
                id: 's1-p1',
                price: 1850,
                quantity: 'Standard Fit',
                sizeStatus: 'ACTIVE',
                sizeColours: [
                  { id: 's1-sc1', name: 'Indigo Blue', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
                  { id: 's1-sc2', name: 'Emerald Green', price: 150, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800' }
                ]
              }
            ],
            colors: [
              { id: 'c-blue', name: 'Indigo Blue', colourStatus: 'ACTIVE', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
              { id: 'c-green', name: 'Emerald Green', colourStatus: 'ACTIVE', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800' }
            ]
          },
          {
            id: 's2',
            name: 'Classic Crimson Mulmul Saree',
            price: 2100,
            imageId: 'saree-2',
            description: 'Stunning deep crimson Mulmul cotton saree, finished with handwoven golden zari borders for festive elegance.',
            rating: 4.9,
            deliveryTime: '2-3 days',
            deliveryCost: 50,
            createdAt: '2026-01-01T00:00:00Z',
            famous: true,
            ingredients: 'Pure Mulmul Cotton & Golden Zari threads',
            bestBefore: 'Lifetime Keep',
            instructions: 'Dry clean only to maintain zari luster.',
            productStatus: 'ACTIVE',
            images: [
              'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800'
            ],
            pricing: [
              {
                id: 's2-p1',
                price: 2100,
                quantity: 'Standard Fit',
                sizeStatus: 'ACTIVE',
                sizeColours: [
                  { id: 's2-sc1', name: 'Ruby Crimson', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'silk-saree',
        name: 'Silk Saree',
        catalogueImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400',
        products: [
          {
            id: 's3',
            name: 'Royal Kanjeevaram Silk Saree',
            price: 8500,
            imageId: 'saree-3',
            description: 'Heavy, luxurious Kanjeevaram pure silk saree with elaborate temple border motifs and pure gold thread weaving.',
            rating: 4.9,
            deliveryTime: '3-5 days',
            deliveryCost: 100,
            createdAt: '2026-01-02T00:00:00Z',
            famous: true,
            ingredients: '100% Pure Mulberry Silk & Gold Zari',
            bestBefore: 'Generational Keepsake',
            instructions: 'Dry clean only. Store wrapped in soft muslin fabric away from light.',
            productStatus: 'ACTIVE',
            images: [
              'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'
            ],
            pricing: [
              {
                id: 's3-p1',
                price: 8500,
                quantity: 'Standard Fit',
                sizeStatus: 'ACTIVE',
                sizeColours: [
                  { id: 's3-sc1', name: 'Royal Magenta', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'blouse',
    name: 'Blouse',
    categoryImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400',
    catalogs: [
      {
        id: 'designer-blouse',
        name: 'Designer Blouse',
        catalogueImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400',
        products: [
          {
            id: 'b1',
            name: 'Gilded Blossom Designer Blouse',
            price: 1500,
            imageId: 'blouse-1',
            description: 'Elegantly tailored sweetheart-neck blouse featuring intricate golden floral embroidery and padded bust support.',
            rating: 4.7,
            deliveryTime: '2-4 days',
            deliveryCost: 50,
            createdAt: '2026-01-03T00:00:00Z',
            famous: true,
            ingredients: 'Silk Cotton blend with Gold thread embroidery',
            bestBefore: 'Lifetime Keep',
            instructions: 'Dry clean recommended.',
            productStatus: 'ACTIVE',
            images: [
              'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800'
            ],
            pricing: [
              { id: 'b1-size-s', price: 1500, quantity: 'Size S (36)', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'b1-sc-s-g', name: 'Golden Glow', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800' }] },
              { id: 'b1-size-m', price: 1550, quantity: 'Size M (38)', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'b1-sc-m-g', name: 'Golden Glow', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800' }] },
              { id: 'b1-size-l', price: 1600, quantity: 'Size L (40)', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'b1-sc-l-g', name: 'Golden Glow', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800' }] }
            ],
            colors: [
              { id: 'c-gold', name: 'Golden Glow', colourStatus: 'ACTIVE', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'lehenga',
    name: 'Lehenga',
    categoryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400',
    catalogs: [
      {
        id: 'festive-lehenga',
        name: 'Festive Lehenga',
        catalogueImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400',
        products: [
          {
            id: 'lh1',
            name: 'Crimson Velvet Festive Lehenga',
            price: 18500,
            imageId: 'lehenga-1',
            description: 'Premium heavyweight silk-velvet lehenga skirt paired with a matching heavily embellished blouse and organza dupatta.',
            rating: 4.9,
            deliveryTime: '5-7 days',
            deliveryCost: 150,
            createdAt: '2026-01-04T00:00:00Z',
            famous: true,
            ingredients: 'Pure Silk Velvet skirt, Organza Dupatta',
            bestBefore: 'Generational Keepsake',
            instructions: 'Dry clean only. Iron inside-out with warm iron only.',
            productStatus: 'ACTIVE',
            images: [
              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'
            ],
            pricing: [
              { id: 'lh1-s', price: 18500, quantity: 'Custom Size S', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'lh1-sc-s-r', name: 'Royal Red', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' }] },
              { id: 'lh1-m', price: 19000, quantity: 'Custom Size M', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'lh1-sc-m-r', name: 'Royal Red', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' }] }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'kurta',
    name: 'Kurta',
    categoryImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400',
    catalogs: [
      {
        id: 'womens-kurta',
        name: 'Womens Kurta',
        catalogueImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400',
        products: [
          {
            id: 'k1',
            name: 'Sunset Yellow Mulmul Kurti',
            price: 2200,
            imageId: 'kurta-1',
            description: 'Breezy and comfortable yellow Mulmul kurti featuring beautiful hand-embroidered chikankari designs.',
            rating: 4.8,
            deliveryTime: '2-4 days',
            deliveryCost: 50,
            createdAt: '2026-01-05T00:00:00Z',
            famous: false,
            ingredients: '100% Mulmul Cotton',
            bestBefore: 'Lifetime Keep',
            instructions: 'Handwash separately in cold water.',
            productStatus: 'ACTIVE',
            images: [
              'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'
            ],
            pricing: [
              { id: 'k1-s', price: 2200, quantity: 'Size S', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'k1-sc-s-y', name: 'Marigold Yellow', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800' }] },
              { id: 'k1-m', price: 2200, quantity: 'Size M', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'k1-sc-m-y', name: 'Marigold Yellow', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800' }] },
              { id: 'k1-l', price: 2200, quantity: 'Size L', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'k1-sc-l-y', name: 'Marigold Yellow', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800' }] }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'men',
    name: 'Men',
    categoryImage: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=400',
    catalogs: [
      {
        id: 'menswear',
        name: 'Menswear',
        catalogueImage: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=400',
        products: [
          {
            id: 'm1',
            name: 'Premium Tussar Silk Kurta',
            price: 3800,
            imageId: 'mens-1',
            description: 'Classic handcrafted Tussar silk kurta for men, featuring high-neck mandarin collars and sophisticated thread patterns.',
            rating: 4.8,
            deliveryTime: '3-5 days',
            deliveryCost: 50,
            createdAt: '2026-01-06T00:00:00Z',
            famous: true,
            ingredients: 'Handspun Tussar Silk',
            bestBefore: 'Lifetime Keep',
            instructions: 'Dry clean recommended.',
            productStatus: 'ACTIVE',
            images: [
              'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=800'
            ],
            pricing: [
              { id: 'm1-s', price: 3800, quantity: 'Size S (38)', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'm1-sc-s-t', name: 'Golden Beige', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=800' }] },
              { id: 'm1-m', price: 3800, quantity: 'Size M (40)', sizeStatus: 'ACTIVE', sizeColours: [{ id: 'm1-sc-m-t', name: 'Golden Beige', price: 0, sizeColourStatus: 'ACTIVE', productPics: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=800' }] }
            ]
          }
        ]
      }
    ]
  }
];
