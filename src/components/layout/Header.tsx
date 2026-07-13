"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, User, ShoppingCart, Search, ShoppingBag, History, Home, Settings, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CartSheet } from '@/components/cart/CartSheet';
import { WishlistSheet } from '@/components/wishlist/WishlistSheet';
import { HistorySheet } from '@/components/history/HistorySheet';
import { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useProduct } from '@/hooks/use-product';
import { ProfileSheet } from '@/components/profile/ProfileSheet';
import { useTenant } from '@/components/providers/TenantContext';
import { AddressSheet } from '@/components/address/AddressSheet';
import { useAuth } from '@/hooks/use-auth';
import { CompanyOrdersSheet } from '@/components/admin/CompanyOrdersSheet';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/admin/orders', label: 'Company Orders', icon: ClipboardList },
  { href: '/admin/inventory', label: 'Admin', icon: Settings },
];

const Header = ({ companyName = "ManaBuy", fetchAllAtOnce = true }: { companyName?: string, fetchAllAtOnce?: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { wishlist } = useWishlist();
  const { cart, getCartItemsCount, companyDetails } = useCart();
  const cartItemCount = getCartItemsCount();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { products: allProducts, categories, activeCategoryId, setActiveCategoryId } = useProduct();
  const tenant = useTenant();
  const { text } = tenant;
  const isChandra = tenant.id.toLowerCase().includes('chandra') || tenant.id.toLowerCase().includes('suta');

  /* Hydration fix: Ensure client-only values match server on first render */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use shared auth hook
  const { isLoggedIn, userRole, isOwner } = useAuth();

  // Safe cart count
  const displayCartCount = mounted ? cartItemCount : 0;

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleScroll = () => {
      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleProductClick = (productId: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/product/${productId}`);
  };

  const handleNavClick = (id: string) => {
    setActiveCategoryId(id);
    if (pathname !== '/') {
      router.push(`/?category=${id}`);
    } else {
      const element = document.getElementById('shop-now');
      if (element) {
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const handleSearchIconClick = () => {
    if (pathname !== '/') {
      router.push('/');
      setTimeout(() => {
        const activeSearchInput = document.getElementById('category-search-input');
        if (activeSearchInput) {
          activeSearchInput.focus();
          const y = activeSearchInput.getBoundingClientRect().top + window.pageYOffset - 120;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 500);
    } else {
      const activeSearchInput = document.getElementById('category-search-input');
      if (activeSearchInput) {
        activeSearchInput.focus();
        const y = activeSearchInput.getBoundingClientRect().top + window.pageYOffset - 120;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        const element = document.getElementById('shop-now');
        if (element) {
          const yOffset = -100;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    }
  };

  const sutaNavItems = [
    { label: 'SAREE', value: 'saree' },
    { label: 'BLOUSE', value: 'blouse' },
    { label: 'LEHENGA', value: 'lehenga' },
    { label: 'KURTA', value: 'kurta' },
    { label: 'MEN', value: 'men' },
  ];

  const displayNavItems = useMemo(() => {
    if (categories.length > 0) {
      return categories.map(cat => ({
        label: cat.name.toUpperCase(),
        id: cat.id
      }));
    }
    return sutaNavItems.map(item => ({
      label: item.label,
      id: item.value
    }));
  }, [categories]);

  return (
    <>
      {isChandra && (
        <div className="w-full bg-black text-[#faf8f5] text-[10px] md:text-[11px] uppercase font-semibold tracking-[0.25em] py-2.5 overflow-hidden whitespace-nowrap relative select-none">
          <div className="inline-block animate-marquee pr-4">
            <span className="mx-8">{companyDetails?.companyMessage || "✨ CELEBRATE THE FESTIVE SEASON WITH CHANDRA SHOPPING MALL • FLAT 10% OFF ON YOUR FIRST ORDER • FREE SHIPPING OVER ₹999 ✨"}</span>
            <span className="mx-8">{companyDetails?.companyMessage || "✨ CELEBRATE THE FESTIVE SEASON WITH CHANDRA SHOPPING MALL • FLAT 10% OFF ON YOUR FIRST ORDER • FREE SHIPPING OVER ₹999 ✨"}</span>
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            .animate-marquee {
              display: inline-block;
              animation: marquee 30s linear infinite;
            }
          `}</style>
        </div>
      )}

      <header className={cn(
        "sticky top-0 z-40 w-full border-b shadow-sm",
        isChandra 
          ? "bg-[#faf7f2]/85 backdrop-blur-md border-[#eadeca]/50 text-stone-900" 
          : "bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b"
      )}>
        <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 duration-300">
            {companyDetails?.logo ? (
              <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10 bg-background group">
                <Image
                  src={companyDetails.logo}
                  alt={companyName}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ) : (
              <div className={cn(
                "flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl text-primary-foreground",
                isChandra ? "bg-black" : "bg-gradient-to-br from-primary to-primary/80"
              )}>
                <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
              </div>
            )}
            <span className={cn(
              "font-headline text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80",
              companyDetails?.logo ? "hidden md:block" : "block",
              isChandra && "font-sans uppercase tracking-[0.1em] font-semibold text-black bg-none bg-clip-border text-black"
            )}>
              {companyName}
            </span>
          </Link>

          {/* Centered links for Suta layout */}
          {isChandra && (
            <div className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-[0.25em] text-[#2a2a2a] mx-4">
              {displayNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "hover:text-primary transition-colors cursor-pointer relative py-2 uppercase",
                    activeCategoryId === item.id && "text-primary border-b-2 border-primary"
                  )}
                >
                  {item.label}
                </button>
              ))}
              <Link href="/about-us" className="hover:text-primary transition-colors cursor-pointer relative py-2 uppercase">
                ABOUT US
              </Link>
            </div>
          )}

          {/* Old Search Bar (Only render when NOT isChandra) */}
          {!isChandra && !(pathname === '/' && !fetchAllAtOnce) && !pathname.startsWith('/product/') && (
            <div className="relative flex-1 mx-2 md:mx-4 w-full max-w-md lg:max-w-lg" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={text.searchPlaceholder || "Search products, brands, and more..."}
                className="pl-10 rounded-full bg-secondary/50 border-transparent focus:bg-background focus:border-input transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              />

              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 bg-card border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Products
                      </div>
                      {searchResults.map(product => {
                        const fallbackImage = PlaceHolderImages.find(i => i.id === product.imageId) || { imageUrl: '' };
                        const displayImage = product.productImage || (product.images && product.images.length > 0 ? product.images[0] : '') || fallbackImage.imageUrl || '';

                        return (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                            onClick={() => handleProductClick(product.id)}
                          >
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary relative">
                              <img src={displayImage} alt={product.name} className="object-cover w-full h-full" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-foreground line-clamp-1">{product.name}</h4>
                              <p className="text-xs text-muted-foreground">₹{product.price}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <nav className="flex items-center gap-2 text-sm font-medium">
            <div className='hidden md:flex items-center gap-2'>
              {/* Chandra Search Toggle Button */}
              {isChandra && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearchIconClick}
                  className="rounded-full transition-all duration-300 w-10 h-10 md:w-12 md:h-12 text-[#2a2a2a] hover:bg-black/5"
                >
                  <Search className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
                </Button>
              )}

              {navItems.map(({ href, label, icon: Icon }) => {
                if (label === 'Admin' && (!isLoggedIn || !isOwner)) return null;
                if ((label === 'Cart' || label === 'Wishlist' || label === 'Home') && isOwner) return null;
                if (label === 'Home' && isChandra) return null;

                const isActive = pathname === href;

                if (label === 'Company Orders') {
                  if (!isLoggedIn || !isOwner) return null;
                  return (
                    <CompanyOrdersSheet key={label}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                          "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                          !isActive && (isChandra ? "text-[#2a2a2a] hover:bg-black/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                        )}
                      >
                        <div className="cursor-pointer font-normal">
                          {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={1.5} />}
                        </div>
                      </Button>
                    </CompanyOrdersSheet>
                  );
                }

                if (label === 'Cart') {
                  return (
                    <CartSheet key={label}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                          "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                          !isActive && (isChandra ? "text-[#2a2a2a] hover:bg-black/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                        )}
                      >
                        <div className="cursor-pointer font-normal">
                          {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={1.5} />}
                          {displayCartCount > 0 && (
                            <span className={cn(
                              "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in",
                              isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                            )}>
                              {displayCartCount}
                            </span>
                          )}
                        </div>
                      </Button>
                    </CartSheet>
                  );
                }

                if (label === 'Wishlist') {
                  return (
                    <WishlistSheet key={label}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                          "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                          !isActive && (isChandra ? "text-[#2a2a2a] hover:bg-black/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                        )}
                      >
                        <div className="cursor-pointer font-normal">
                          {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={1.5} />}
                          {mounted && wishlist.length > 0 && (
                            <span className={cn(
                              "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in",
                              isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                            )}>
                              {wishlist.length}
                            </span>
                          )}
                        </div>
                      </Button>
                    </WishlistSheet>
                  );
                }

                if (label === 'Admin') {
                  return (
                    <Button
                      key={label}
                      variant={isActive ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                        !isActive && (isChandra ? "text-[#2a2a2a] hover:bg-black/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                      )}
                      onClick={() => {
                        window.location.href = href;
                      }}
                    >
                      {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={1.5} />}
                    </Button>
                  );
                }

                return (
                  <Button
                    key={label}
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                      !isActive && (isChandra ? "text-[#2a2a2a] hover:bg-black/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                    )}
                    asChild
                  >
                    <Link href={href} aria-label={label}>
                      {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={1.5} />}
                    </Link>
                  </Button>
                );
              })}
              {isLoggedIn && userRole?.includes('CUSTOMER') && (
                <HistorySheet>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-full transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                      isChandra ? "text-[#2a2a2a] hover:bg-black/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <History className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
                  </Button>
                </HistorySheet>
              )}
            </div>
            {isLoggedIn ? (
              <ProfileSheet>
                <Button
                  variant={pathname === '/profile' ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "rounded-full transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                    !pathname.startsWith('/profile') && (isChandra ? "text-[#2a2a2a] hover:bg-black/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                  )}
                >
                  <div className="cursor-pointer">
                    <User className={cn("h-5 w-5 md:h-6 md:w-6", pathname === '/profile' && "fill-current")} strokeWidth={1.5} />
                  </div>
                </Button>
              </ProfileSheet>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                  isChandra ? "text-[#2a2a2a] hover:bg-black/5" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => {
                  window.dispatchEvent(new Event('open-login-popup'));
                }}
              >
                <div className="cursor-pointer">
                  <User className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
                </div>
              </Button>
            )}
          </nav>
        </div>
        <AddressSheet />
      </header>
    </>
  );
};

export default Header;
