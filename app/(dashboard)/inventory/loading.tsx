import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton";
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <DataTableSkeleton columnCount={8} />
    </>
  );
}
