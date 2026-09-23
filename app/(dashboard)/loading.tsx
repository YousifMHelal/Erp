import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton";
import { DashboardSkeleton } from "@/components/shared/skeletons/dashboard-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <DashboardSkeleton />
    </>
  );
}
