'use client';

import type { Catalog } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn, resolveImageUrl } from '@/lib/utils';
import { useTenant } from '@/components/providers/TenantContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Trash2, Loader2 } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface CatalogGridProps {
  catalogs: Catalog[];
  selectedCatalogId: string | null;
  onSelectCatalog: (catalogId: string) => void;
}

const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));

export default function CatalogGrid({ catalogs, selectedCatalogId, onSelectCatalog }: CatalogGridProps) {
  return (
    <div className="w-full">
      {/* Mobile/Tablet Scroll View */}
      <div className="md:hidden">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-6 pb-4 px-4">
            {catalogs.map((catalog) => (
              <CatalogItem
                key={catalog.id}
                catalog={catalog}
                imageMap={imageMap}
                selectedCatalogId={selectedCatalogId}
                onSelectCatalog={onSelectCatalog}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Desktop Grid/Centered View */}
      <div className="hidden md:flex flex-wrap justify-center gap-8 pb-4">
        {catalogs.map((catalog) => (
          <CatalogItem
            key={catalog.id}
            catalog={catalog}
            imageMap={imageMap}
            selectedCatalogId={selectedCatalogId}
            onSelectCatalog={onSelectCatalog}
          />
        ))}
      </div>
    </div>
  );
}

// Extracted for reuse
function CatalogItem({ catalog, imageMap, selectedCatalogId, onSelectCatalog }: {
  catalog: Catalog;
  imageMap: Map<string, any>;
  selectedCatalogId: string | null;
  onSelectCatalog: (id: string) => void;
}) {
  const firstProductImageId = catalog.products[0]?.imageId;
  const image = firstProductImageId ? imageMap.get(firstProductImageId) : undefined;
  const isSelected = catalog.id === selectedCatalogId;
  const tenant = useTenant();
  const theme = tenant.theme;
  const catalogueShape = theme?.catalogueFrame || 'circle';

  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role && role.includes('OWNER')) {
      setIsAdmin(true);
    }
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the catalogue "${catalog.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await adminService.deleteCatalogue(catalog.id);
      toast({
        title: "Success",
        description: "Catalogue deleted successfully.",
      });
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete catalogue. Please try again.",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  };

  const getShapeClass = (shape: string) => {
    switch (shape) {
      case 'square': return 'rounded-xl';
      case 'squircle': return 'rounded-[2rem]';
      default: return 'rounded-full';
    }
  };

  const shapeClass = getShapeClass(catalogueShape);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-start gap-3 text-center transition-all group focus:outline-none",
        "w-28 sm:w-32"
      )}
    >
      <button
        onClick={() => onSelectCatalog(catalog.id)}
        className={cn(
          catalogueShape === 'circle' ? "rounded-full" : shapeClass,
          "relative w-28 h-28 sm:w-32 sm:h-32 overflow-hidden shadow-2xl transition-all duration-500",
          tenant.id.toLowerCase().includes('anantha') 
            ? "border-[6px] border-primary scale-100 group-hover:scale-105" 
            : cn("border-4 border-white group-hover:scale-105 group-hover:shadow-xl", isSelected ? "border-primary" : "border-transparent")
        )}
      >
        <Image
          src={resolveImageUrl(catalog.catalogueImage || image?.imageUrl) || `https://picsum.photos/seed/${catalog.id}/300/300`}
          alt={catalog.name}
          fill
          className="object-cover"
          data-ai-hint={image?.imageHint || 'product category'}
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
      </button>
      <span className={cn(
        "font-semibold text-xs sm:text-base -mt-1 whitespace-normal break-words leading-tight w-full px-1 transition-colors duration-300",
        tenant.id.toLowerCase().includes('anantha') ? "text-primary font-display uppercase tracking-widest text-[10px] sm:text-xs" : "text-foreground line-clamp-2",
        isSelected && !tenant.id.toLowerCase().includes('anantha') && "text-primary"
      )}>
        {catalog.name}
      </span>

      {isAdmin && (
        <Button
          variant="destructive"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute -top-1 -right-1 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Delete Catalogue"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
