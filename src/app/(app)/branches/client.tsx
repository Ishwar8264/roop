"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { BranchCard } from "@/features/branch/components/branch-card";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import type { BranchResponse } from "@/features/branch/types";

export function BranchesClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [citySearch, setCitySearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBranches({
    city: citySearch || undefined,
    includeInactive,
    page,
    limit: 20,
  });

  const handleEdit = (branch: BranchResponse) => {
    router.push(`/branches/${branch.id}/edit`);
  };

  const handleAdd = () => {
    router.push("/branches/new");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            {t("branches.title")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("branches.subtitle")}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("branches.addBranch")}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("branches.searchByCity")}
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="includeInactive"
            checked={includeInactive}
            onCheckedChange={setIncludeInactive}
          />
          <Label htmlFor="includeInactive" className="text-sm">
            {t("branches.includeInactive")}
          </Label>
        </div>
      </div>

      {/* Branch List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : data?.branches && data.branches.length > 0 ? (
        <div className="space-y-3">
          {data.branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} onEdit={handleEdit} />
          ))}
          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ←
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("branches.page")} {page} {t("branches.of")}{" "}
                {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                →
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-lg">
            {t("branches.noBranches")}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t("branches.noBranchesDesc")}
          </p>
        </div>
      )}
    </div>
  );
}
