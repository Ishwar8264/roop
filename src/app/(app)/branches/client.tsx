"use client";

import { useState, useCallback } from "react";
import { MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchCard } from "@/features/branch/components/branch-card";
import { BranchFormDialog } from "@/features/branch/components/branch-form-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import type { BranchResponse, BranchListResponse } from "@/features/branch/types";

interface BranchesClientProps {
  initialData: BranchListResponse;
}

export function BranchesClient({ initialData }: BranchesClientProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [citySearch, setCitySearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BranchListResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);

  // ---- Client-side refetch for filters/pagination ----

  const refetch = useCallback(async (overrides?: { city?: string; includeInactive?: boolean; page?: number }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const city = overrides?.city ?? citySearch;
      const inactive = overrides?.includeInactive ?? includeInactive;
      const p = overrides?.page ?? page;
      if (city) params.set("city", city);
      if (inactive) params.set("includeInactive", "true");
      params.set("page", String(p));
      params.set("limit", "20");

      const res = await fetch(`/api/branches?${params.toString()}`, {
        credentials: "same-origin",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  }, [citySearch, includeInactive, page]);

  const handleEdit = (branch: BranchResponse) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBranch(null);
    setDialogOpen(true);
  };

  const handleMutated = () => {
    refetch();
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
            onChange={(e) => setCitySearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refetch()}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="includeInactive"
            checked={includeInactive}
            onCheckedChange={(checked) => {
              setIncludeInactive(checked);
              setPage(1);
              setTimeout(() => refetch({ includeInactive: checked, page: 1 }), 0);
            }}
          />
          <Label htmlFor="includeInactive" className="text-sm">
            {t("branches.includeInactive")}
          </Label>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t("common.search") ?? "Search"}
        </Button>
      </div>

      {/* Branch List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      ) : data.branches && data.branches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              variant={isAdmin ? "admin" : "app"}
              onEdit={handleEdit}
              onMutated={handleMutated}
            />
          ))}
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

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const newPage = page - 1;
              setPage(newPage);
              setTimeout(() => refetch({ page: newPage }), 0);
            }}
          >
            ←
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("branches.page")} {page} {t("branches.of")} {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => {
              const newPage = page + 1;
              setPage(newPage);
              setTimeout(() => refetch({ page: newPage }), 0);
            }}
          >
            →
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <BranchFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={editingBranch}
        onMutated={handleMutated}
      />
    </div>
  );
}
