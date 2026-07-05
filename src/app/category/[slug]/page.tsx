import { headers } from 'next/headers';
import { fetchCategories } from '@/services/product.service';
import { fetchCompanyDetails } from '@/services/company.service';
import CategoryClient from '@/components/category/CategoryClient';
import { resolveTenantConfig } from '@/config/tenant-config';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    if (!slug) {
        notFound();
    }

    const headersList = await headers();
    const headerDomain = headersList.get("x-company-domain");
    const companyDomain = (headerDomain && headerDomain !== 'localhost') ? headerDomain : 'babaihomefoods';

    const company = await fetchCompanyDetails(companyDomain);
    const tenantConfig = resolveTenantConfig(companyDomain);

    const categories = (company && company.companyId)
        ? await fetchCategories(company.companyId, company.deliveryBetween, tenantConfig.fetchAllAtOnce ?? true)
        : [];

    return (
        <div className="bg-background min-h-screen">
            <CategoryClient
                slug={slug}
                initialCategories={categories}
                companyDetails={company}
                fetchAllAtOnce={tenantConfig.fetchAllAtOnce ?? true}
            />
        </div>
    );
}
