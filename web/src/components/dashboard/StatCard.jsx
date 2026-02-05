import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";

export function StatCard({ title, value, hint, loading, tone = "neutral" }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge tone={tone}>{hint}</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-1/2" />
        ) : (
          <div className="text-2xl font-semibold text-text">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
