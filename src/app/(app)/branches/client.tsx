/**
 * Purpose: Branch listing client screen.
 * Responsibility: Render branch filters, cards, pagination, and admin form dialog.
 * Important Notes: Related UI state is grouped in a reducer to avoid cascading local updates.
 */

"use client";

import { useReducer, useCallback } from "react";
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

type BranchesState = {
  citySearch: string;
  includeInactive: boolean;
  page: number;
  data: BranchListResponse;
  isLoading: boolean;
  dialogOpen: boolean;
  editingBranch: BranchResponse | null;
};

type BranchesAction =
  | { type: "setCitySearch"; value: string }
  | { type: "setIncludeInactive"; value: boolean }
  | { type: "setPage"; value: number }
  | { type: "setData"; value: BranchListResponse }
  | { type: "setLoading"; value: boolean }
  | { type: "openAddDialog" }
  | { type: "openEditDialog"; value: BranchResponse }
  | { type: "setDialogOpen"; value: boolean };

function branchesReducer(state: BranchesState, action: BranchesAction): BranchesState {
  switch (action.type) {
    case "setCitySearch":
      return { ...state, citySearch: action.value };
    case "setIncludeInactive":
      return { ...state, includeInactive: action.value, page: 1 };
    case "setPage":
      return { ...state, page: action.value };
    case "setData":
      return { ...state, data: action.value };
    case "setLoading":
      return { ...state, isLoading: action.value };
    case "openAddDialog":
      return { ...state, editingBranch: null, dialogOpen: true };
    case "openEditDialog":
      return { ...state, editingBranch: action.value, dialogOpen: true };
    case "setDialogOpen":
      return { ...state, dialogOpen: action.value };
    default:
      return state;
  }
}

export function BranchesClient({ initialData }: BranchesClientProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [state, dispatch] = useReducer(branchesReducer, {
    citySearch: "",
    includeInactive: false,
    page: 1,
    data: initialData,
    isLoading: false,
    dialogOpen: false,
    editingBranch: null,
  });

  // ---- Client-side refetch for filters/pagination ----

  const refetch = useCallback(async (overrides?: { city?: string; includeInactive?: boolean; page?: number }) => {
    dispatch({ type: "setLoading", value: true });
    try {
      const params = new URLSearchParams();
      const city = overrides?.city ?? state.citySearch;
      const inactive = overrides?.includeInactive ?? state.includeInactive;
      const p = overrides?.page ?? state.page;
      if (city) params.set("city", city);
      if (inactive) params.set("includeInactive", "true");
      params.set("page", String(p));
      params.set("limit", "20");

      const res = await fetch(`/api/branches?${params.toString()}`, {
        credentials: "same-origin",
      });
      const json = await res.json();
      if (json.success && json.data) {
        dispatch({ type: "setData", value: json.data });
      }
    } catch {
      // Keep existing data on error
    } finally {
      dispatch({ type: "setLoading", value: false });
    }
  }, [state.citySearch, state.includeInactive, state.page]);

  const handleEdit = (branch: BranchResponse) => {
    dispatch({ type: "openEditDialog", value: branch });
  };

  const handleAdd = () => {
    dispatch({ type: "openAddDialog" });
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
            value={state.citySearch}
            onChange={(e) =>
              dispatch({ type: "setCitySearch", value: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && refetch()}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="includeInactive"
            checked={state.includeInactive}
            onCheckedChange={(checked) => {
              dispatch({ type: "setIncludeInactive", value: checked });
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
      {state.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      ) : state.data.branches && state.data.branches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.data.branches.map((branch) => (
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
      {state.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={state.page <= 1}
            onClick={() => {
              const newPage = state.page - 1;
              dispatch({ type: "setPage", value: newPage });
              setTimeout(() => refetch({ page: newPage }), 0);
            }}
          >
            ←
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("branches.page")} {state.page} {t("branches.of")} {state.data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={state.page >= state.data.totalPages}
            onClick={() => {
              const newPage = state.page + 1;
              dispatch({ type: "setPage", value: newPage });
              setTimeout(() => refetch({ page: newPage }), 0);
            }}
          >
            →
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <BranchFormDialog
        open={state.dialogOpen}
        onOpenChange={(open) => dispatch({ type: "setDialogOpen", value: open })}
        branch={state.editingBranch}
        onMutated={handleMutated}
      />
    </div>
  );
}
