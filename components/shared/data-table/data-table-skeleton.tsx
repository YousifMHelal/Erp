import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { DataTableSkeletonProps } from "@/types";

export function DataTableSkeleton({ columnCount, rowCount = 6 }: DataTableSkeletonProps) {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="hover:bg-transparent">
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <TableCell key={colIndex} style={{ height: "var(--density-row-height)" }}>
                <Skeleton className="h-4 w-full max-w-32" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
