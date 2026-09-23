import { PageHeaderSkeleton } from "@/components/shared/skeletons/page-header-skeleton";
import { CardListSkeleton } from "@/components/shared/skeletons/card-list-skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardListSkeleton count={6} />
    </>
  );
}
