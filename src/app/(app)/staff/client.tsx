"use client";

import { useState } from "react";
import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffs } from "@/features/staff/hooks/use-staffs";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { StaffCard } from "@/features/staff/components/staff-card";
import { StaffFormDialog } from "@/features/staff/components/staff-form-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import type { StaffResponse } from "@/features/staff/types";

export function StaffClient() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffResponse | null>(null);

  const { data, isLoading } = useStaffs({
    branchId: branchFilter || undefined,
    specialization: search || undefined,
    isAvailable: showAvailableOnly ? true : undefined,
    page,
    limit: 20,
  });

  const { data: branchesData } = useBranches({ limit: 100 });

  const handleEdit = (staff: StaffResponse) => {
    setEditingStaff(staff);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t("staff.title")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("staff.subtitle")}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("staff.addStaff")}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("staff.searchBySpec")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => {
            setBranchFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">{t("staff.allBranches")}</option>
          {branchesData?.branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nameEn} — {b.city}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Switch
            id="availableOnly"
            checked={showAvailableOnly}
            onCheckedChange={setShowAvailableOnly}
          />
          <Label htmlFor="availableOnly" className="text-sm">
            {t("staff.availableOnly")}
          </Label>
        </div>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : data?.staff && data.staff.length > 0 ? (
        <div className="space-y-3">
          {data.staff.map((staff) => (
            <StaffCard key={staff.id} staff={staff} onEdit={handleEdit} />
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
          <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-lg">{t("staff.noStaff")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("staff.noStaffDesc")}
          </p>
        </div>
      )}

      {/* Form Dialog */}
      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={editingStaff}
      />
    </div>
  );
}
