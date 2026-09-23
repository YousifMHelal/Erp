import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton";
import { StatCardSkeleton } from "@/components/shared/skeletons/stat-card-skeleton";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <DataTableSkeleton columnCount={5} />
    </>
  );
}
