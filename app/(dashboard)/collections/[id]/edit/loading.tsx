import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton";
import { DetailSkeleton } from "@/components/shared/skeletons/detail-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <DetailSkeleton />
    </>
  );
}
