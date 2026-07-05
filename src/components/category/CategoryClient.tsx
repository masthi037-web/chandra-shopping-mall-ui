"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Catalog, ProductWithImage, Category } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn, resolveImageUrl, slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CatalogGrid from '@/components/products/CatalogGrid';
import { FilterState } from '@/components/products/FilterSortSheet';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductCard } from '@/components/products/ProductCard';
import { ArrowLeft, Loader2, Search, Sparkles } from 'lucide-react';
import { fetchProductsByCategoryAction } from '@/actions/product.actions';
import { CompanyDetails } from '@/lib/api-types';
import { ProductInitializer } from '@/components/providers/ProductInitializer';
import { useProduct } from '@/hooks/use-product';
import { useTenant } from '@/components/providers/TenantContext';

interface CategoryClientProps {
    slug: string;
    initialCategories: Category[];
    companyDetails: CompanyDetails | null;
    fetchAllAtOnce: boolean;
}

export default function CategoryClient({ slug, initialCategories, companyDetails, fetchAllAtOnce }: CategoryClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tenant = useTenant();

    const { categories, setCategories, isCategoryExpired, markCategoryAsFetched } = useProduct();
    const [isLoadingCategory, setIsLoadingCategory] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    const [searchDropdownResults, setSearchDropdownResults] = useState<ProductWithImage[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);
    const mountTime = useRef(Date.now());
    const fetchingRef = useRef<Record<string, boolean>>({});

    // Find the category based on the slug
    const findCategoryBySlug = useCallback(() => {
        const sourceCats = initialCategories.length > 0 ? initialCategories : categories;
        const matched = sourceCats.find(c => c.id === slug || slugify(c.name) === slug);
        return matched?.id || "";
    }, [slug, initialCategories, categories]);

    const [selectedCategory, setSelectedCategory] = useState<string>(findCategoryBySlug());
    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);

    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(findCategoryBySlug());
        }
    }, [categories, findCategoryBySlug, selectedCategory]);

    useEffect(() => {
        if (!selectedCategory || categories.length === 0) return;

        const category = categories.find(c => c.id === selectedCategory);
        if (category && category.catalogs.length > 0) {
            const paramCatalog = searchParams.get('catalogue');
            const matchedCatalog = paramCatalog
                ? category.catalogs.find(c => c.id === paramCatalog || slugify(c.name) === paramCatalog)
                : null;

            if (matchedCatalog) {
                setSelectedCatalogId(matchedCatalog.id);
            } else if (!selectedCatalogId || !category.catalogs.some(c => c.id === selectedCatalogId)) {
                setSelectedCatalogId(category.catalogs[0].id);
            }
        }
    }, [selectedCategory, categories, searchParams]);

    const loadCategoryData = useCallback(async (categoryId: string) => {
        if (!categoryId || categoryId === 'undefined' || categoryId === 'null') return;

        const state = useProduct.getState();
        const currentCategories = state.categories;

        if (!currentCategories || currentCategories.length === 0) return;

        const category = currentCategories.find(c => c.id === categoryId);
        if (!category) return;

        const expired = isCategoryExpired(categoryId);
        const serverCat = initialCategories.find(ic => ic.id === categoryId);
        const hasServerCatalogs = serverCat && serverCat.catalogs.length > 0;
        const isPreLoaded = !!hasServerCatalogs;
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
                    setCategories(prev => prev.map(c =>
                        c.id === categoryId ? {
                            ...c,
                            ...fetchedCategory,
                            name: fetchedCategory.name || c.name,
                            categoryImage: fetchedCategory.categoryImage || c.categoryImage,
                            catalogs: fetchedCategory.catalogs
                        } : c
                    ));
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
        return category;
    }, [initialCategories, companyDetails?.deliveryBetween, isLoadingCategory, isCategoryExpired, markCategoryAsFetched, setCategories]);

    useEffect(() => {
        if (selectedCategory) loadCategoryData(selectedCategory);
    }, [selectedCategory, categories.length > 0]);


    const [filters, setFilters] = useState<FilterState>({
        sortBy: 'recommended',
        priceRange: [0, 10000],
        minRating: null
    });

    useEffect(() => {
        setFilters({ sortBy: 'recommended', priceRange: [0, 10000], minRating: null });
    }, [selectedCatalogId, selectedCategory]);

    const activeCategory = categories.find(c => c.id === selectedCategory);
    const catalogs: Catalog[] = activeCategory ? activeCategory.catalogs : [];

    const handleSelectCatalog = (catalogId: string) => {
        setSelectedCatalogId(catalogId);
        const catalog = catalogs.find(c => c.id === catalogId);
        const urlSlug = catalog ? slugify(catalog.name) : catalogId;

        const params = new URLSearchParams(searchParams.toString());
        params.set('catalogue', urlSlug);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState(null, '', newUrl);

        setTimeout(() => {
            const element = document.getElementById('products-anchor');
            if (element) {
                const yOffset = -120; // Slightly more offset for better visibility
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const targetY = rect.top + scrollTop + yOffset;
                
                window.scrollTo({
                    top: targetY,
                    behavior: 'smooth'
                });
            }
        }, 300); // Increased timeout to ensure re-render completion
    };

    const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId);
    const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));

    useEffect(() => {
        if (searchQuery.trim() && activeCategory) {
            const allCategoryProducts = activeCategory.catalogs.flatMap(catalog =>
                catalog.products.map(p => {
                    const image = imageMap.get(p.imageId);
                    return {
                        ...p,
                        imageHint: image?.imageHint || 'product image',
                        imageUrl: resolveImageUrl(p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || '')
                    };
                })
            );

            const results = allCategoryProducts.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchDropdownResults(results);
            setShowSearchDropdown(true);
        } else {
            setSearchDropdownResults(prev => prev.length === 0 ? prev : []);
            setShowSearchDropdown(prev => prev === false ? prev : false);
        }
    }, [searchQuery, activeCategory]);

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

    const baseProducts: ProductWithImage[] = (() => {
        if (searchQuery && activeCategory) {
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
    })();

    const filteredProducts = baseProducts
        .filter(p => {
            if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
            if (filters.minRating && p.rating < filters.minRating) return false;
            return true;
        })
        .sort((a, b) => {
            switch (filters.sortBy) {
                case 'price_asc': return a.price - b.price;
                case 'price_desc': return b.price - a.price;
                case 'rating_desc': return b.rating - a.rating;
                case 'newest': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                default: return 0;
            }
        });

    const allNewArrivals: ProductWithImage[] = activeCategory
        ? activeCategory.catalogs.flatMap(c => c.products)
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

    const newArrivals = allNewArrivals.slice(0, 5);

    const allFamousProducts: ProductWithImage[] = activeCategory
        ? activeCategory.catalogs.flatMap(c => c.products)
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

    const famousProducts = allFamousProducts.slice(0, 8);

    return (
        <div className="bg-background min-h-screen pt-20 pb-20">
            {initialCategories.length > 0 && (
                <ProductInitializer categories={initialCategories} companyDetails={companyDetails} />
            )}

            <div className="container mx-auto px-4 space-y-12">

                {/* Dynamic Category Hero */}
                {tenant.id.toLowerCase().includes('anantha') ? (
                    <div className="relative h-[40vh] md:h-[60vh] w-screen left-1/2 right-1/2 -mx-[50vw] mb-16 overflow-hidden group">
                        <div className="absolute inset-0 bg-black/40 z-10" />
                        <img 
                            src={resolveImageUrl(activeCategory?.categoryImage || '') || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop'} 
                            alt={activeCategory?.name}
                            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => router.push('/')} 
                                    className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                                >
                                    <ArrowLeft className="w-5 h-5 text-white" />
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {tenant.id.toLowerCase().includes('anantha') && (
                                    <span className="text-[10px] md:text-xs font-display tracking-[0.4em] uppercase text-primary/80 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100 block">
                                        Exquisite Collection
                                    </span>
                                )}
                                <h1 className={cn(
                                    "text-white font-headline uppercase animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200",
                                    tenant.id.toLowerCase().includes('anantha') 
                                        ? "text-4xl md:text-6xl lg:text-7xl font-medium tracking-[0.2em] leading-[1.1]" 
                                        : "text-5xl md:text-8xl font-bold tracking-tight"
                                )}>
                                    {activeCategory?.name}
                                </h1>
                            </div>
                            <div className="w-24 h-1 bg-primary mt-8 rounded-full animate-in fade-in zoom-in duration-1000 delay-500" />
                        </div>
                        <div className="absolute bottom-12 right-12 z-20 hidden md:block opacity-40">
                            <p className="text-white text-[10px] uppercase tracking-[0.8em] font-display font-medium [writing-mode:vertical-rl] flex items-center gap-4">
                                <span className="w-px h-12 bg-white/50 mb-4" />
                                Anantha Jewellers • Excellence in Every Detail
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="outline" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-sm hover:bg-secondary border-muted">
                            <ArrowLeft className="w-5 h-5 text-foreground" />
                        </Button>
                        <h1 className="text-3xl md:text-4xl font-bold font-headline">{activeCategory?.name || 'Category'}</h1>
                    </div>
                )}

                {activeCategory ? (
                    <div className="space-y-12">
                        {/* Category Search Bar */}
                        {!fetchAllAtOnce && !tenant.id.toLowerCase().includes('anantha') && (
                            <div className={cn(
                                "flex justify-center px-4 animate-in fade-in slide-in-from-top-2 duration-700 delay-500",
                                tenant.id.toLowerCase().includes('anantha') ? "-mt-12 mb-16 relative z-30" : "-mt-4 mb-8"
                            )}>
                                <div className="relative w-full max-w-md group" ref={searchRef}>
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                                    </div>
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10" />
                                    <input
                                        type="text"
                                        placeholder={`Search in ${activeCategory?.name}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                                        className={cn(
                                            "w-full pl-12 pr-4 py-4 bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/10 focus:shadow-primary/20 rounded-full transition-all duration-500 outline-none text-base placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/40",
                                            tenant.id.toLowerCase().includes('anantha') && "border-primary/20"
                                        )}
                                    />

                                    {/* Search Dropdown */}
                                    {showSearchDropdown && (
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
                                                                <p className="text-xs text-muted-foreground">₹{product.price}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    <p>No results found in "{activeCategory?.name}"</p>
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
                                <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
                                <div className="flex items-center justify-between mb-8 relative">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 duration-1000"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "text-2xl font-bold font-headline text-foreground leading-none animate-in slide-in-from-left-4 duration-500",
                                                tenant.id === 'ananthajewellers' && "text-3xl tracking-tight"
                                            )}>
                                                Exclusive Offers
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-2 animate-in slide-in-from-left-4 duration-500 delay-100">
                                                Curated deals for the discerning eye
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex overflow-x-auto items-stretch gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                    {(() => {
                                        const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));
                                        const offerProducts = activeCategory ? activeCategory.catalogs.flatMap(c => c.products)
                                            .filter(p => p.productOffer && String(p.productOffer) !== "0")
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
                                            }) : [];

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
                        {newArrivals.length > 0 && (
                            <div id="new-arrivals" className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 scroll-mt-24">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "text-2xl font-bold font-headline text-foreground leading-none",
                                                tenant.id === 'ananthajewellers' && "text-3xl tracking-tight"
                                            )}>Freshly Dropped</h3>
                                            <p className="text-sm text-muted-foreground mt-2">Just in: {activeCategory?.name}'s latest treasures</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex overflow-x-auto items-stretch gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                    {newArrivals.map((product) => (
                                        <div key={product.id} className="w-[280px] md:w-[320px] flex-shrink-0 snap-center h-full flex flex-col">
                                            <ProductCard product={product} hideDescription={true} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Famous Products Block */}
                        {famousProducts.length > 0 && (
                            <div className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "text-2xl font-bold font-headline text-foreground leading-none",
                                                tenant.id === 'ananthajewellers' && "text-3xl tracking-tight"
                                            )}>Signature Selection</h3>
                                            <p className="text-sm text-muted-foreground mt-2">Timeless favorites & bestsellers</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex overflow-x-auto items-stretch gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                    {famousProducts.map((product) => (
                                        <div key={product.id} className="w-[280px] md:w-[320px] flex-shrink-0 snap-center h-full flex flex-col">
                                            <ProductCard product={product} hideDescription={true} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Catalogs & Products Area */}
                        <div id="product-catalog-section" className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                            {!tenant.id.toLowerCase().includes('anantha') && (
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className={cn(
                                        "font-semibold flex items-center gap-3",
                                        tenant.id.toLowerCase().includes('anantha') ? "text-2xl font-headline" : "text-xl"
                                    )}>
                                        <span className="w-1.5 h-8 rounded-full bg-primary/80 block"></span>
                                        {activeCategory?.name} Catalogs
                                    </h3>
                                </div>
                            )}

                            {isLoadingCategory[selectedCategory] ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="ml-2 text-muted-foreground">Loading products...</span>
                                </div>
                            ) : !searchQuery ? (
                                <CatalogGrid
                                    catalogs={catalogs}
                                    selectedCatalogId={selectedCatalogId}
                                    onSelectCatalog={handleSelectCatalog}
                                />
                            ) : null}

                            {(selectedCatalog || searchQuery || activeCategory) && (
                                <div id="products-anchor" className="mt-16 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-bold font-headline">
                                                {searchQuery
                                                    ? `Search Results in ${activeCategory?.name}`
                                                    : (selectedCatalog?.name || `All Products in ${activeCategory?.name}`)
                                                }
                                            </h3>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                {filteredProducts.length} items {filteredProducts.length !== baseProducts.length ? '(filtered)' : 'available'}
                                            </p>
                                        </div>
                                    </div>
                                    <ProductGrid products={filteredProducts} />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-secondary/20 rounded-3xl border border-dashed border-border">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Category not found</h3>
                            <p className="text-muted-foreground">The selected category could not be loaded.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
