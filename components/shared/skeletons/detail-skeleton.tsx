import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
