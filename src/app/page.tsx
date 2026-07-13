
import { headers } from 'next/headers';
import Image from 'next/image';
import { Metadata } from 'next';
import { fetchCategories } from '@/services/product.service';
import { fetchCompanyDetails } from '@/services/company.service';
import HomeClient from '@/components/home/HomeClient';
import { ShopNowButton } from '@/components/home/ShopNowButton';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { resolveTenantConfig } from '@/config/tenant-config';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const headerDomain = headersList.get("x-company-domain");
  const companyDomain = (headerDomain && headerDomain !== 'localhost') ? headerDomain : 'chandra-shopping';
  
  const tenantConfig = resolveTenantConfig(companyDomain);
  
  if (!tenantConfig.seo) {
    return {
      title: 'ManaBuy',
      description: 'A modern e-commerce experience.',
    };
  }

  return {
    title: tenantConfig.seo.title,
    description: tenantConfig.seo.description,
    keywords: tenantConfig.seo.keywords,
    verification: {
      google: tenantConfig.seo.googleVerification,
    },
    openGraph: {
      title: tenantConfig.seo.title,
      description: tenantConfig.seo.description,
      images: tenantConfig.seo.ogImage ? [{ url: tenantConfig.seo.ogImage }] : [],
    }
  };
}

export default async function Home() {
  const headersList = await headers();
  // Middleware handles extraction and localhost fallback
  const headerDomain = headersList.get("x-company-domain");
  // FORCE HARDCODED FOR DEBUGGING IF NEEDED
  const companyDomain = (headerDomain && headerDomain !== 'localhost') ? headerDomain : 'chandra-shopping';

  // Chained Data Fetching: Company -> Products
  const company = await fetchCompanyDetails(companyDomain);
  const tenantConfig = resolveTenantConfig(companyDomain);

  // Prepare Media for Carousel from company.banner
  const bannerContent = company?.banner ? company.banner.split('&&&') : [];
  
  const carouselMedia: { url: string; type: 'image' | 'video' }[] = bannerContent.map(url => {
    // Detect video by extension or specific pattern
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes('video');
    return {
      url,
      type: isVideo ? 'video' as const : 'image' as const
    };
  });

  // Fallback to picsum if empty
  if (carouselMedia.length === 0 || (carouselMedia.length === 1 && carouselMedia[0].url.includes('picsum.photos'))) {
    if (tenantConfig.id.toLowerCase().includes('chandra')) {
      carouselMedia.length = 0;
      carouselMedia.push(
        {
          url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1920",
          type: 'image'
        },
        {
          url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1920",
          type: 'image'
        },
        {
          url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1920",
          type: 'image'
        }
      );
    } else {
      carouselMedia.push({
        url: "https://picsum.photos/seed/homepage-banner/1920/1080",
        type: 'image'
      });
    }
  }

  console.log(`[InitialLoad] Domain: ${companyDomain}`);
  console.log(`[InitialLoad] fetchAllAtOnce: ${tenantConfig.fetchAllAtOnce ?? true}`);

  // Use companyId if available, otherwise empty array (or handle error)
  if (company?.companyId) {
    console.log(`[InitialLoad] Calling fetchCategories for companyId: ${company.companyId}`);
  }

  const categories = (company && company.companyId)
    ? await fetchCategories(company.companyId, company.deliveryBetween, tenantConfig.fetchAllAtOnce ?? true)
    : [];

  return (
    <div className="bg-transparent min-h-screen">
      {/* Hero Section */}
            {tenantConfig.homeLayout === 'fashion' ? (
        <section className="relative w-full h-[75vh] min-h-[450px] overflow-hidden flex items-center bg-[#faf6f0]">
          <HeroCarousel media={carouselMedia} />
          {/* Elegant minimalist overlays */}
          <div className="absolute inset-0 bg-black/20 z-20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8f5ee]/50 via-transparent to-black/30 z-20 pointer-events-none" />

          {/* Centered copy */}
          <div className="absolute inset-0 bg-black/10 z-20 flex items-center justify-center text-center px-4">
            <div className="max-w-3xl space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-1000">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.35em] text-[#faf8f5] drop-shadow-md block">
                {company?.companyName || tenantConfig.name}
              </span>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#faf8f5] leading-tight tracking-wide drop-shadow-xl capitalize italic">
                {tenantConfig.text.heroTitle || "Timeless"}
                <span className="block font-sans not-italic font-bold tracking-widest text-[14px] md:text-[18px] uppercase text-[#eada3c] mt-2 tracking-[0.25em]">{tenantConfig.text.heroTitleHighlight || "Elegance"}</span>
              </h1>
              
              <p className="text-xs md:text-sm text-white/90 font-light max-w-md mx-auto leading-relaxed drop-shadow-md font-serif">
                {tenantConfig.text.heroDescription || "Experience the grace of hand-woven sarees and traditional apparel tailored for you."}
              </p>

              <div className="pt-4 flex justify-center">
                <a
                  href="#shop-now"
                  className="inline-flex items-center justify-center px-8 py-3 border border-white text-white text-[11px] font-bold uppercase tracking-[0.25em] bg-transparent hover:bg-white hover:text-black transition-all duration-300 shadow-lg"
                >
                  DISCOVER COLLECTION
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : tenantConfig.homeLayout === 'modern' ? (
        /* ── Cevira-style Modern Hero ── */
        <section className="relative w-full min-h-[90vh] overflow-hidden flex items-center bg-[#08101e]">
          <HeroCarousel media={carouselMedia} />
          {/* Heavy gradient on left so text is always readable, fades to photo on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08101e] via-[#08101e]/85 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08101e]/70 to-transparent z-20 pointer-events-none" />

          {/* LEFT-aligned hero content */}
          <div className="relative z-30 w-full px-6 md:px-12 lg:px-24 py-28 md:py-40">
            <div className="max-w-xl">
              {/* Eyebrow badge */}
              <div className="flex items-center gap-2.5 mb-7">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                  {company?.companyName || tenantConfig.name}
                </span>
              </div>

              {/* Big bold headline */}
              <h1 className="text-5xl md:text-7xl lg:text-[88px] font-black text-white leading-[0.93] tracking-[-0.03em] mb-6">
                {tenantConfig.text.heroTitle}
                <br />
                <span className="text-primary">{tenantConfig.text.heroTitleHighlight}</span>
              </h1>

              {/* Subtext */}
              <p className="text-sm md:text-base text-white/50 mb-10 max-w-sm leading-relaxed">
                {tenantConfig.text.heroDescription}
              </p>

              {/* Split CTA — outline pill + blue circle arrow (Cevira pattern) */}
              <a href="#shop-now" className="inline-flex items-center gap-3 group">
                <span className="px-8 py-3.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300">
                  Shop Now
                </span>
                <span className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 group-hover:scale-110 group-hover:shadow-primary/60 transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-white" />
                </span>
              </a>
            </div>
          </div>

          {/* Floating social proof card — bottom right (Cevira signature) */}
          <div className="absolute bottom-10 right-6 md:right-14 z-30 bg-primary rounded-2xl p-5 shadow-2xl shadow-primary/30 w-[200px] md:w-[215px]">
            <p className="text-[30px] font-black text-white leading-none">4.9<span className="text-lg ml-0.5">★</span></p>
            <p className="text-white/70 text-[11px] font-medium mt-0.5 mb-4">Trusted by shoppers</p>
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2 shrink-0">
                {['bg-amber-300', 'bg-sky-300', 'bg-emerald-300', 'bg-rose-300'].map((cls, i) => (
                  <div key={i} className={cn("w-7 h-7 rounded-full border-2 border-primary", cls)} />
                ))}
                <div className="w-7 h-7 rounded-full border-2 border-primary bg-emerald-500 flex items-center justify-center text-white text-[9px] font-black">+</div>
              </div>
              <div>
                <p className="text-white text-[10px] font-bold leading-tight">50K+ happy</p>
                <p className="text-white/60 text-[9px] leading-tight">verified reviews</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ── Original Centered Hero ── */
        <section className="group relative w-full h-[65vh] md:h-[85vh] min-h-[450px] md:min-h-[600px] overflow-hidden flex items-center">
          <HeroCarousel media={carouselMedia} />

          <div className="absolute inset-0 bg-black/30 z-20 flex items-center justify-center text-center px-4">
            <div className="max-w-4xl w-full space-y-8 animate-in fade-in zoom-in-95 duration-1000">
              <div className="flex flex-col items-center space-y-3">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/90">
                  Welcome to {company?.companyName || 'Sandhya Collections'}
                </span>
                <div className="w-12 h-[1px] bg-white/30" />
              </div>

              <h1
                className="text-4xl md:text-6xl font-headline tracking-tighter text-white leading-tight drop-shadow-2xl"
                style={{
                  fontWeight: tenantConfig.typography?.heading.weight || '900',
                  letterSpacing: tenantConfig.typography?.heading.letterSpacing || '-0.05em'
                }}
              >
                {tenantConfig.text.heroTitle} <br />
                <span className="drop-shadow-sm">{tenantConfig.text.heroTitleHighlight}</span>
              </h1>

              <p className="text-sm md:text-lg text-white/90 font-medium max-w-xl mx-auto leading-relaxed drop-shadow-lg">
                {tenantConfig.text.heroDescription}
              </p>

              <div className="pt-6 flex justify-center">
                <a
                  href="#shop-now"
                  className="inline-flex items-center justify-center px-10 py-4 bg-primary text-primary-foreground text-sm md:text-base font-bold uppercase tracking-widest rounded-full shadow-2xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all duration-300"
                >
                  Shop Now
                </a>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />
        </section>
      )}


      <HomeClient
        initialCategories={categories}
        companyDetails={company}
        fetchAllAtOnce={tenantConfig.fetchAllAtOnce ?? true}
      />
    </div>
  );
}
