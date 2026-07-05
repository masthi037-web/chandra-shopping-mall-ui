"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Catalog, ProductWithImage } from '@/lib/types';
import { cn, resolveImageUrl, slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, Settings, Loader2, Search, ArrowRight, ShieldCheck, RotateCcw, Truck } from 'lucide-react';
import CatalogGrid from '@/components/products/CatalogGrid';
import { ProductGrid } from '@/components/products/ProductGrid';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { fetchProductsByCategoryAction } from '@/actions/product.actions';
import { ProductCard } from '@/components/products/ProductCard';

import { CompanyDetails } from '@/lib/api-types';
import { ProductInitializer } from '@/components/providers/ProductInitializer';
import { useProduct } from '@/hooks/use-product';
import { useTenant } from '@/components/providers/TenantContext';
import { FeaturesCarousel } from '@/components/home/FeaturesCarousel';
import { CouponCarousel } from '@/components/home/CouponCarousel';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import SectionDivider from '@/components/common/SectionDivider';
import { TrendingCarousel } from '@/components/home/TrendingCarousel';
import { categories as mockCategories } from '@/data/products';

interface HomeClientProps {
    initialCategories: Category[];
    companyDetails: CompanyDetails | null;
    fetchAllAtOnce: boolean;
}

export default function HomeClient({ initialCategories, companyDetails, fetchAllAtOnce }: HomeClientProps) {
    const router = useRouter();

    const { categories, setCategories, isCategoryExpired, markCategoryAsFetched, activeCategoryId, setActiveCategoryId } = useProduct();
    const tenant = useTenant();
    const { theme, categoryPage, text, typography, homeLayout } = tenant;
    const categoryShape = theme?.categoryFrame || 'circle';

    const getShapeClass = (shape: string) => {
        switch (shape) {
            case 'square': return 'rounded-xl';
            case 'squircle': return 'rounded-[2rem]';
            default: return 'rounded-full';
        }
    };

    const shapeClass = getShapeClass(categoryShape);

    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Category-specific Search query
    const [categorySearchQuery, setCategorySearchQuery] = useState('');

    useEffect(() => {
        const checkAuth = () => {
            const storedLogin = localStorage.getItem('isLoggedIn') === 'true';
            const storedRole = localStorage.getItem('userRole');
            setIsLoggedIn(storedLogin);
            setUserRole(storedRole);
        };

        checkAuth();
        window.addEventListener('auth-change', checkAuth);
        return () => window.removeEventListener('auth-change', checkAuth);
    }, []);

    // Set first category as active on load if none selected
    useEffect(() => {
        if (categories.length > 0 && !activeCategoryId) {
            setActiveCategoryId(categories[0].id);
        }
    }, [categories, activeCategoryId, setActiveCategoryId]);

    // Clear search query when category changes
    useEffect(() => {
        setCategorySearchQuery('');
    }, [activeCategoryId]);

    const handleCategoryClick = (categoryId: string) => {
        if (categoryPage) {
            const category = categories.find(c => c.id === categoryId);
            const urlSlug = category ? slugify(category.name) : categoryId;
            router.push(`/category/${urlSlug}`);
        } else {
            setActiveCategoryId(categoryId);

            setTimeout(() => {
                const element = document.getElementById('first-category-products');
                if (element) {
                    const yOffset = -80;
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 100);
        }
    };

    const isChandra = tenant.id.toLowerCase().includes('chandra') || tenant.id.toLowerCase().includes('suta');

    const imageMap = useMemo(() => new Map(PlaceHolderImages.map(img => [img.id, img])), []);

    // Bestseller Sarees selector
    const bestsellerSarees: ProductWithImage[] = useMemo(() => {
        const activeCats = categories.length > 0 ? categories : mockCategories;
        // Try to find Saree category first
        const sareeCats = activeCats.filter(c => c.name.toLowerCase().includes('saree'));
        const prods = sareeCats.length > 0 
            ? sareeCats.flatMap(c => c.catalogs.flatMap(cat => cat.products)) 
            : activeCats.flatMap(c => c.catalogs.flatMap(cat => cat.products));

        return prods
            .filter(p => p.famous)
            .slice(0, 8)
            .map(p => {
                const image = imageMap.get(p.imageId);
                return {
                    ...p,
                    imageHint: image?.imageHint || 'product image',
                    imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || 'https://picsum.photos/seed/' + p.id + '/400/600')
                } as ProductWithImage;
            });
    }, [categories, imageMap]);

    // --- Dynamic Category Product Grid Logic ---
    const firstCategoryId = categories.length > 0 ? categories[0].id : undefined;

    // If categoryPage is false, display the selected category. Otherwise, always display the first.
    const currentActiveCategoryId = categoryPage ? firstCategoryId : (activeCategoryId || firstCategoryId);
    const activeCategory = categories.find(c => c.id === currentActiveCategoryId);

    const [isLoadingCategory, setIsLoadingCategory] = useState<Record<string, boolean>>({});
    const fetchingRef = useRef<Record<string, boolean>>({});
    const mountTime = useRef(Date.now());

    const loadCategoryData = useCallback(async (categoryId: string) => {
        if (!categoryId || categoryId === 'undefined' || categoryId === 'null') return;
        const currentCategories = useProduct.getState().categories;
        if (!currentCategories || currentCategories.length === 0) return;

        const category = currentCategories.find(c => c.id === categoryId);
        if (!category) return;

        const expired = isCategoryExpired(categoryId);
        const serverCat = initialCategories.find(ic => ic.id === categoryId);
        const hasServerCatalogs = serverCat && serverCat.catalogs.length > 0;
        const isPreLoaded = !!hasServerCatalogs;
        const state = useProduct.getState();
        const timestampExists = state.categoryTimestamps && !!state.categoryTimestamps[categoryId];
        const shouldSkipAsPreloaded = isPreLoaded && !timestampExists;

        const timeSinceMount = Date.now() - mountTime.current;
        const isFreshMount = timeSinceMount < 10000;

        if ((category.catalogs.length === 0 || expired) && !isLoadingCategory[categoryId] && !fetchingRef.current[categoryId] && !shouldSkipAsPreloaded) {
            if (isPreLoaded && isFreshMount) return;

            fetchingRef.current[categoryId] = true;
            setIsLoadingCategory(prev => ({ ...prev, [categoryId]: true }));
            try {
                const fetchedCategory = await fetchProductsByCategoryAction(categoryId, companyDetails?.deliveryBetween);
                if (fetchedCategory) {
                    setCategories(prev => prev.map(c => c.id === categoryId ? {
                        ...c,
                        ...fetchedCategory,
                        name: fetchedCategory.name || c.name,
                        categoryImage: fetchedCategory.categoryImage || c.categoryImage,
                        catalogs: fetchedCategory.catalogs
                    } : c));
                    markCategoryAsFetched(categoryId);
                    return fetchedCategory;
                }
            } catch (error) {
                console.error("Failed to load category", error);
            } finally {
                fetchingRef.current[categoryId] = false;
                setIsLoadingCategory(prev => ({ ...prev, [categoryId]: false }));
            }
        }
    }, [initialCategories, companyDetails?.deliveryBetween, isLoadingCategory, isCategoryExpired, markCategoryAsFetched, setCategories]);

    useEffect(() => {
        if (activeCategoryId) {
            loadCategoryData(activeCategoryId);
        }
    }, [activeCategoryId, categories.length > 0]);

    const catalogs: Catalog[] = activeCategory ? activeCategory.catalogs : [];
    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);

    useEffect(() => {
        if (activeCategory && activeCategory.catalogs.length > 0) {
            if (!selectedCatalogId || !activeCategory.catalogs.some(c => c.id === selectedCatalogId)) {
                setSelectedCatalogId(activeCategory.catalogs[0].id);
            }
        }
    }, [activeCategory, selectedCatalogId]);

    const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId);

    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [searchDropdownResults, setSearchDropdownResults] = useState<ProductWithImage[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    const allCategoryProducts: ProductWithImage[] = useMemo(() => {
        return activeCategory ? activeCategory.catalogs.flatMap(catalog =>
            catalog.products.map(p => {
                const image = imageMap.get(p.imageId);
                return {
                    ...p,
                    imageHint: image?.imageHint || 'product image',
                    imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || '')
                };
            })
        ) : [];
    }, [activeCategory, imageMap]);

    const fallbackProducts: ProductWithImage[] = useMemo(() => {
        if (allCategoryProducts.length > 0) return allCategoryProducts;
        return mockCategories.flatMap(category =>
            category.catalogs.flatMap(catalog =>
                catalog.products.map(p => {
                    const image = imageMap.get(p.imageId);
                    return {
                        ...p,
                        imageHint: image?.imageHint || 'product image',
                        imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || 'https://picsum.photos/seed/' + p.id + '/400/600')
                    } as ProductWithImage;
                })
            )
        );
    }, [allCategoryProducts, imageMap]);

    const allNewArrivals: ProductWithImage[] = useMemo(() => {
        return activeCategory ? activeCategory.catalogs.flatMap(c => c.products)
            .filter(p => {
                const created = new Date(p.createdAt);
                const now = new Date();
                return (Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60)) <= 48;
            })
            .map(p => {
                const image = imageMap.get(p.imageId);
                return {
                    ...p,
                    imageHint: image?.imageHint || 'product image',
                    imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || '')
                }
            })
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            : [];
    }, [activeCategory, imageMap]);
    const newArrivals = useMemo(() => allNewArrivals.slice(0, 5), [allNewArrivals]);

    const allFamousProducts: ProductWithImage[] = useMemo(() => {
        return activeCategory ? activeCategory.catalogs.flatMap(c => c.products)
            .filter(p => p.famous)
            .map(p => {
                const image = imageMap.get(p.imageId);
                return {
                    ...p,
                    imageHint: image?.imageHint || 'product image',
                    imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || '')
                }
            })
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            : [];
    }, [activeCategory, imageMap]);
    const famousProducts = useMemo(() => allFamousProducts.slice(0, 8), [allFamousProducts]);

    const baseProducts: ProductWithImage[] = useMemo(() => {
        if (selectedCatalog) {
            return selectedCatalog.products.map(p => {
                const image = imageMap.get(p.imageId);
                return {
                    ...p,
                    imageHint: image?.imageHint || 'product image',
                    imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || '')
                };
            });
        }
        if (activeCategory) {
            return activeCategory.catalogs.flatMap(catalog =>
                catalog.products.map(p => {
                    const image = imageMap.get(p.imageId);
                    return {
                        ...p,
                        imageHint: image?.imageHint || 'product image',
                        imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || '')
                    };
                })
            );
        }
        return [];
    }, [selectedCatalog, activeCategory, imageMap]);

    const filteredNewArrivals = useMemo(() => {
        if (!categorySearchQuery.trim()) return newArrivals;
        return newArrivals.filter(p => p.name.toLowerCase().includes(categorySearchQuery.toLowerCase()));
    }, [newArrivals, categorySearchQuery]);

    const filteredFamousProducts = useMemo(() => {
        if (!categorySearchQuery.trim()) return famousProducts;
        return famousProducts.filter(p => p.name.toLowerCase().includes(categorySearchQuery.toLowerCase()));
    }, [famousProducts, categorySearchQuery]);

    const filteredBaseProducts = useMemo(() => {
        if (!categorySearchQuery.trim()) return baseProducts;
        return baseProducts.filter(p => p.name.toLowerCase().includes(categorySearchQuery.toLowerCase()));
    }, [baseProducts, categorySearchQuery]);

    useEffect(() => {
        if (searchQuery.trim() && activeCategory) {
            const results = allCategoryProducts.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchDropdownResults(results);
            setShowSearchDropdown(true);
        } else {
            setSearchDropdownResults(prev => prev.length === 0 ? prev : []);
            setShowSearchDropdown(prev => prev === false ? prev : false);
        }
    }, [searchQuery, activeCategory, allCategoryProducts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchProductClick = (productId: string) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        router.push(`/product/${productId}`);
    };

    // --- End First Category Product Grid Logic ---

    // If OWNER, do not show home screen content
    if (userRole?.includes('OWNER')) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4">
                <div className="h-20 w-20 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                    <Settings className="h-10 w-10 text-teal-600" />
                </div>
                <h1 className="text-2xl font-bold font-headline text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                    Please use the Profile Sidebar {'>'} Settings to access your admin controls.
                </p>
                <div className="mt-8 flex gap-4">
                    <Button variant="outline" onClick={() => window.dispatchEvent(new Event('open-profile-sidebar'))}>
                        Open Sidebar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Hero Section - Rendered in Server Component */}

            <div className="space-y-12 pb-20">
                {/* Initialize Global Store Once Data is Ready */}
                {initialCategories.length > 0 && (
                    <ProductInitializer categories={initialCategories} companyDetails={companyDetails} />
                )}

                {isLoggedIn && userRole?.includes('CUSTOMER') && companyDetails?.companyPhone && (
                    <WhatsAppButton phoneNumber={companyDetails.companyPhone} companyName={companyDetails.companyName} />
                )}
                <CouponCarousel companyCoupon={companyDetails?.companyCoupon} />
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <FeaturesCarousel features={companyDetails?.features} />
                </div>

                {/* ── Stats Strip (modern layout only) ── */}
                {homeLayout === 'modern' && (
                    <div className="container mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <div className="grid grid-cols-3 divide-x divide-border/40 border border-border/40 rounded-2xl overflow-hidden bg-card">
                            {[
                                { value: "1k+", label: "Products" },
                                { value: "50k+", label: "Happy Customers" },
                                { value: "4.9★", label: "Average Rating" },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center py-7 px-4">
                                    <div className="text-2xl md:text-4xl font-black text-foreground mb-1 tracking-tight">{stat.value}</div>
                                    <div className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Bento "Why Shop With Us" (modern layout only) ── */}
                {homeLayout === 'modern' && (
                    <div className="container mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        {/* Section label */}
                        <div className="flex flex-col items-center text-center mb-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Why Choose Us</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                                Shopping made <span className="text-primary">effortless</span>
                            </h2>
                            <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
                                We bring the best products at unbeatable prices — fast delivery, easy returns, and secure payments.
                            </p>
                        </div>

                        {/* Bento grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Free delivery */}
                            <div className="bg-secondary/60 border border-border/40 rounded-2xl p-6">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-foreground text-base leading-tight">Free Delivery</h3>
                                <p className="text-xs text-muted-foreground mt-1">On orders above ₹499</p>
                            </div>

                            {/* Stats card */}
                            <div className="bg-secondary/60 border border-border/40 rounded-2xl p-6">
                                <div className="text-4xl font-black text-foreground mb-1 tracking-tight">1.2k</div>
                                <h3 className="font-bold text-foreground text-base leading-tight">Daily Deliveries</h3>
                                <p className="text-xs text-muted-foreground mt-1">Fresh orders, every single day</p>
                            </div>

                            {/* Blue CTA card — full height on desktop */}
                            <div className="bg-primary rounded-2xl p-6 flex flex-col justify-between col-span-2 md:col-span-1">
                                <div>
                                    <h3 className="text-lg font-black text-white leading-snug mb-2">Shop the latest trends today</h3>
                                    <p className="text-white/70 text-xs leading-relaxed">Exclusive deals updated daily. New arrivals every week.</p>
                                </div>
                                <a href="#shop-now" className="mt-4 flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-all rounded-full px-4 py-2.5 w-fit">
                                    <span className="text-white font-semibold text-xs">Browse Now</span>
                                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                                        <ArrowRight className="w-3 h-3 text-primary" />
                                    </div>
                                </a>
                            </div>

                            {/* Easy returns — spans 2 cols on mobile */}
                            <div className="bg-secondary/60 border border-border/40 rounded-2xl p-6 col-span-2 md:col-span-1">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                    <RotateCcw className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="font-bold text-foreground text-base leading-tight">Easy Returns</h3>
                                <p className="text-xs text-muted-foreground mt-1">10-day hassle-free return policy. No questions asked.</p>
                            </div>

                            {/* Secure payments */}
                            <div className="bg-secondary/60 border border-border/40 rounded-2xl p-6">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="font-bold text-foreground text-base leading-tight">Secure Payments</h3>
                                <p className="text-xs text-muted-foreground mt-1">100% safe &amp; encrypted transactions</p>
                            </div>
                        </div>
                    </div>
                )}

                <SectionDivider />

                {fallbackProducts.length > 0 && (
                    <TrendingCarousel products={fallbackProducts} />
                )}

                <SectionDivider />

                <div className="container mx-auto px-4 space-y-24">
                    {/* Categories Section */}
                    <section id="shop-now" className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 scroll-mt-24">
                        <div className="flex flex-col items-center justify-center mb-8 text-center">
                            {isChandra ? (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="flex items-center gap-3 justify-center text-rose-500 font-bold mb-2">
                                        <span className="text-xl">♥</span>
                                        <h2 className="text-3xl font-serif uppercase tracking-[0.15em] text-[#1a1a1a]">
                                            Dipped in Love
                                        </h2>
                                        <span className="text-xl">♥</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs md:text-sm tracking-wide font-serif max-w-md mx-auto">
                                        India's most loved Artisanal brand, handcrafted by 17000+ artisans
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {homeLayout === 'modern' && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Shop by Category</span>
                                        </div>
                                    )}
                                    <h2
                                        className={cn(
                                            "font-headline transition-all duration-500",
                                            homeLayout === 'modern' ? "text-3xl md:text-4xl font-black tracking-tight" : "text-3xl",
                                            tenant.id.toLowerCase().includes('anantha') && "text-4xl uppercase tracking-tighter font-bold"
                                        )}
                                        style={{
                                            fontWeight: typography?.heading.weight || '900',
                                            letterSpacing: homeLayout === 'modern' ? '-0.03em' : (typography?.heading.letterSpacing || '-0.05em')
                                        }}
                                    >
                                        Discover Collections
                                    </h2>
                                    <p className={cn(
                                        "text-muted-foreground mt-1 text-sm",
                                        tenant.id.toLowerCase().includes('anantha') && "font-display uppercase tracking-[0.3em] text-[10px]"
                                    )}>
                                        Explore our curated range of products
                                    </p>
                                </>
                            )}
                        </div>

                        {categories.length > 0 ? (
                            <div className="space-y-12">
                                {/* Category Tabs/Bubbles */}
                                <div className="flex overflow-x-auto pb-4 gap-4 md:gap-6 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth md:justify-center">
                                    {(tenant.id.toLowerCase().includes('sandhya') ? categories.slice(0, 2) : categories).map(category => (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategoryClick(category.id)}
                                            className="relative group flex flex-col items-center gap-3 min-w-[100px] transition-all duration-300"
                                        >
                                            <div className={cn(
                                                "rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden h-24 w-24 md:h-32 md:w-32 border-2",
                                                !categoryPage && currentActiveCategoryId === category.id
                                                    ? "border-amber-500 scale-105 shadow-md shadow-amber-500/10"
                                                    : "border-transparent bg-secondary text-muted-foreground group-hover:border-amber-400 group-hover:scale-105"
                                            )}>
                                                {category.categoryImage ? (
                                                    <img
                                                        src={resolveImageUrl(category.categoryImage)}
                                                        alt={category.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Sparkles className="w-6 h-6" />
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-xs md:text-sm font-semibold transition-colors text-center leading-tight max-w-[100px] md:max-w-[120px] break-words whitespace-normal px-1",
                                                isChandra ? "font-serif text-[#1a1a1a]" : (tenant.id.toLowerCase().includes('anantha') ? "font-display uppercase tracking-widest text-[10px]" : "line-clamp-2"),
                                                !categoryPage && currentActiveCategoryId === category.id ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                                            )}>
                                                {category.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-secondary/20 rounded-3xl border border-dashed border-border">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">No categories found</h3>
                                    <p className="text-muted-foreground">Please check back later for new arrivals.</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {isChandra && bestsellerSarees.length > 0 && (
                        <>
                            <SectionDivider />
                            <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-serif tracking-[0.15em] uppercase text-[#1a1a1a]">Bestseller Sarees</h2>
                                    <div className="w-12 h-0.5 bg-amber-500 mx-auto mt-3" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                    {bestsellerSarees.map(product => (
                                        <div key={product.id} className="transition-all hover:translate-y-[-4px] duration-300">
                                            <ProductCard product={product} hideDescription={true} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {isChandra && (
                        <>
                            <SectionDivider />
                            <div className="w-full overflow-hidden rounded-2xl relative shadow-md group">
                                <div className="h-[200px] md:h-[300px] w-full relative bg-amber-950">
                                    <img
                                        src={companyDetails?.banner || "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1920"}
                                        alt="Promo Banner"
                                        className="object-cover w-full h-full opacity-70 group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 z-10 flex items-center justify-center text-center px-6">
                                        <div className="max-w-xl text-white space-y-3">
                                            <span className="text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase text-amber-300 block">Celebrate Festivities</span>
                                            <h2 className="text-2xl md:text-4xl font-serif italic text-white leading-tight">Celebrate Rath Yatra Collection</h2>
                                            <p className="text-[11px] md:text-xs font-light text-white/90 max-w-sm mx-auto leading-relaxed">
                                                From temple visits to family gatherings, find beautiful drapes that move with every celebration.
                                            </p>
                                            <div className="pt-2">
                                                <button 
                                                    onClick={() => {
                                                        const element = document.getElementById('shop-now');
                                                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    className="px-6 py-2 bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300 shadow-md"
                                                >
                                                    Shop Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    <SectionDivider />

                    {/* Dynamic Category Highlights Section */}
                    {activeCategoryId && activeCategory && (
                        <section id="first-category-products" className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 pb-24">
                            <div className="flex items-center justify-between mb-8">
                                <h3 
                                    className="text-2xl font-headline flex items-center gap-2"
                                    style={{ 
                                        fontWeight: typography?.heading.weight || '900',
                                        letterSpacing: typography?.heading.letterSpacing || '-0.05em'
                                    }}
                                >
                                    <span className="w-1.5 h-6 rounded-full bg-primary/80 block"></span>
                                    {activeCategory.name} Highlights
                                </h3>
                            </div>

                            {isLoadingCategory[activeCategoryId] ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="ml-2 text-muted-foreground">Loading products...</span>
                                </div>
                            ) : (
                                <>
                                    {(!fetchAllAtOnce || isChandra) && (
                                        <div className="flex justify-center mb-8 px-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                            <div className="relative w-full max-w-md group" ref={searchRef}>
                                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                    <Search className={cn("h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300", isChandra && "group-focus-within:text-amber-500")} />
                                                </div>
                                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10" />
                                                <input
                                                    id="category-search-input"
                                                    type="text"
                                                    placeholder={`Search in ${activeCategory.name}...`}
                                                    value={isChandra ? categorySearchQuery : searchQuery}
                                                    onChange={(e) => {
                                                        if (isChandra) {
                                                            setCategorySearchQuery(e.target.value);
                                                        } else {
                                                            setSearchQuery(e.target.value);
                                                        }
                                                    }}
                                                    onFocus={() => !isChandra && searchQuery.trim() && setShowSearchDropdown(true)}
                                                    className={cn(
                                                        "w-full pl-12 pr-4 py-4 bg-background border border-border/50 shadow-md focus:shadow-primary/10 rounded-full transition-all duration-300 outline-none text-base placeholder:text-muted-foreground/60",
                                                        isChandra ? "focus:border-amber-500" : "focus:bg-background focus:border-primary/30"
                                                    )}
                                                />

                                                {/* Search Dropdown */}
                                                {!isChandra && showSearchDropdown && (
                                                    <div className="absolute top-full left-0 w-full mt-2 bg-card border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left max-h-[60vh] overflow-y-auto">
                                                        {searchDropdownResults.length > 0 ? (
                                                            <div className="py-2">
                                                                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                                    Products
                                                                 </div>
                                                                {searchDropdownResults.map(product => (
                                                                    <div
                                                                        key={product.id}
                                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                                                                        onClick={() => handleSearchProductClick(product.id)}
                                                                    >
                                                                        <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary relative">
                                                                            <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-1">{product.name}</h4>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <p className="text-xs text-foreground font-semibold">
                                                                                    ₹{product.priceAfterDiscount && product.priceAfterDiscount < product.price ? product.priceAfterDiscount : product.price}
                                                                                </p>
                                                                                {product.priceAfterDiscount && product.priceAfterDiscount < product.price && (
                                                                                    <p className="text-[10px] text-muted-foreground line-through">
                                                                                        ₹{product.price}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="p-8 text-center text-muted-foreground">
                                                                <p>No results found in "{activeCategory.name}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Exclusive Offers Block */}
                                    {activeCategory && activeCategory.catalogs.flatMap(c => c.products).filter(p => p.productOffer && String(p.productOffer) !== "0").length > 0 && (
                                        <div className="mb-16 relative">
                                            <SectionDivider className="mb-12" />
                                            <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
                                            <div className="flex items-center justify-between mb-6 relative">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 duration-1000"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                                    </div>
                                                    <div>
                                                        <h3 
                                                            className={cn(
                                                                "text-2xl font-headline text-foreground leading-none animate-in slide-in-from-left-4 duration-500",
                                                                tenant.id.toLowerCase().includes('anantha') && "text-3xl tracking-tight"
                                                            )}
                                                            style={{ 
                                                                fontWeight: typography?.heading.weight || '900',
                                                                letterSpacing: typography?.heading.letterSpacing || '-0.05em'
                                                            }}
                                                        >
                                                            Exclusive Offers
                                                        </h3>
                                                        <p className={cn(
                                                            "text-sm text-muted-foreground mt-1 animate-in slide-in-from-left-4 duration-500 delay-100",
                                                            tenant.id.toLowerCase().includes('anantha') && "font-display uppercase tracking-[0.2em] text-[10px]"
                                                        )}>
                                                            Limited time deals just for you
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex overflow-x-auto items-stretch gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                                {(() => {
                                                    const rawOffers = activeCategory ? activeCategory.catalogs.flatMap(c => c.products)
                                                        .filter(p => p.productOffer && String(p.productOffer) !== "0") : [];
                                                    const offerProducts = rawOffers
                                                        .filter(p => !categorySearchQuery.trim() || p.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                                                        .sort((a, b) => {
                                                            const getVal = (s?: string) => {
                                                                const m = s?.match(/(\d+)/);
                                                                return m ? parseInt(m[0]) : 0;
                                                            };
                                                            return getVal(b.productOffer) - getVal(a.productOffer);
                                                        })
                                                        .map(p => {
                                                            const image = imageMap.get(p.imageId);
                                                            return {
                                                                ...p,
                                                                imageHint: image?.imageHint || 'product image',
                                                                imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || '')
                                                            };
                                                        });

                                                    return offerProducts.map((product, index) => (
                                                        <div
                                                            key={product.id}
                                                            className="w-[280px] md:w-[320px] flex-shrink-0 snap-center h-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                                                            style={{ animationDelay: `${index * 100}ms` }}
                                                        >
                                                            <ProductCard product={product} hideDescription={true} />
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* New Arrivals Block */}
                                    {filteredNewArrivals.length > 0 && (
                                        <div id="new-arrivals" className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 scroll-mt-24">
                                            <SectionDivider className="mb-12" />
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                                    </div>
                                                    <div>
                                                        <h3 
                                                            className="text-2xl font-headline text-foreground leading-none"
                                                            style={{ 
                                                                fontWeight: typography?.heading.weight || '900',
                                                                letterSpacing: typography?.heading.letterSpacing || '-0.05em'
                                                            }}
                                                        >
                                                            Freshly Dropped
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground mt-1">Just in: {activeCategory?.name}'s latest</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex overflow-x-auto items-stretch gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                                {filteredNewArrivals.map((product) => (
                                                    <div key={product.id} className="w-[280px] md:w-[320px] flex-shrink-0 snap-center h-full flex flex-col">
                                                        <ProductCard product={product} hideDescription={true} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Famous Products Block / Signature Selection */}
                                    {filteredFamousProducts.length > 0 && (
                                        <div className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                                            <SectionDivider className="mb-12" />
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                                    </div>
                                                    <div>
                                                        <h3 
                                                            className={cn(
                                                                "text-2xl font-headline text-foreground leading-none",
                                                                tenant.id.toLowerCase().includes('anantha') && "text-3xl tracking-tight"
                                                            )}
                                                            style={{ 
                                                                fontWeight: typography?.heading.weight || '900',
                                                                letterSpacing: typography?.heading.letterSpacing || '-0.05em'
                                                            }}
                                                        >
                                                            Signature Selection
                                                        </h3>
                                                        <p className={cn(
                                                            "text-sm text-muted-foreground mt-1",
                                                            tenant.id.toLowerCase().includes('anantha') && "font-display uppercase tracking-[0.2em] text-[10px]"
                                                        )}>
                                                            Timeless favorites & bestsellers
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex overflow-x-auto items-stretch gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                                {filteredFamousProducts.map((product) => (
                                                    <div key={product.id} className="w-[280px] md:w-[320px] flex-shrink-0 snap-center h-full flex flex-col">
                                                        <ProductCard product={product} hideDescription={true} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <SectionDivider className="my-12" />

                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold flex items-center gap-2">
                                            <span className="w-1.5 h-6 rounded-full bg-primary/80 block"></span>
                                            {activeCategory?.name} Catalogs
                                        </h3>
                                    </div>

                                    <CatalogGrid
                                        catalogs={tenant.id.toLowerCase().includes('sandhya') ? catalogs.slice(0, 1) : catalogs}
                                        selectedCatalogId={selectedCatalogId}
                                        onSelectCatalog={(id) => {
                                            setSelectedCatalogId(id);
                                            if (tenant.id.toLowerCase().includes('sandhya')) {
                                                setTimeout(() => {
                                                    const element = document.getElementById('catalog-products');
                                                    if (element) {
                                                        const yOffset = -100;
                                                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                                        window.scrollTo({ top: y, behavior: 'smooth' });
                                                    }
                                                }, 200);
                                            }
                                        }}
                                    />
                                    {filteredBaseProducts.length > 0 && (
                                        <div id="catalog-products" className="mt-12 scroll-mt-24">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-2xl font-bold font-headline">
                                                        {selectedCatalog?.name || `All Products in ${activeCategory?.name}`}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm mt-1">
                                                        {filteredBaseProducts.length} items available
                                                    </p>
                                                </div>
                                            </div>
                                            <ProductGrid products={filteredBaseProducts} />
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
} // HMR Touch comment to clear dev server cache
