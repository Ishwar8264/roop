"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStaffs } from "@/features/staff/hooks/use-staffs";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { StaffCard } from "@/features/staff/components/staff-card";
import { useTranslation } from "@/i18n/use-translation";
import type { StaffResponse } from "@/features/staff/types";

export function AdminStaffClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);

  const { data: branchData } = useBranches({ includeInactive: false });
  const { data, isLoading } = useStaffs({
    branchId: branchFilter !== "all" ? branchFilter : undefined,
    specialization: search || undefined,
    isAvailable: availableOnly || undefined,
  });

  const branches = branchData?.branches ?? [];
  const staffs = data?.staff ?? [];

  const handleEdit = (staff: StaffResponse) => {
    router.push(`/admin/staff/${staff.id}/edit`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.staff.title")}</h2>
          <p className="text-muted-foreground">{t("admin.staff.subtitle")}</p>
        </div>
        <Button
          onClick={() => router.push("/admin/staff/new")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("staff.addStaff")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("staff.searchBySpec")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("staff.allBranches")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("staff.allBranches")}</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.nameEn || branch.nameHi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                id="available-only"
                checked={availableOnly}
                onCheckedChange={setAvailableOnly}
              />
              <Label htmlFor="available-only" className="text-sm">
                {t("staff.availableOnly")}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : staffs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("staff.noStaff")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staffs.map((staff) => (
            <StaffCard key={staff.id} staff={staff} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
