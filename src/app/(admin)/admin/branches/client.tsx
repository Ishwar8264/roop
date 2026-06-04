"use client";

import { useState } from "react";
import { MapPin, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useToggleBranch } from "@/features/branch/hooks/use-toggle-branch";
import { BranchFormDialog } from "@/features/branch/components/branch-form-dialog";
import { BranchStatusBadge } from "@/features/branch/components/branch-status-badge";
import { useTranslation } from "@/i18n/use-translation";
import Link from "next/link";

export function AdminBranchesClient() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useBranches({
    city: search || undefined,
    includeInactive: showInactive,
  });
  const toggleBranch = useToggleBranch();

  const branches = data?.branches ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.branches.title")}</h2>
          <p className="text-muted-foreground">{t("admin.branches.subtitle")}</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          {t("branches.addBranch")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("branches.searchByCity")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
              <Label htmlFor="show-inactive" className="text-sm">{t("branches.includeInactive")}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : branches.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("branches.noBranches")}</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {branches.map((branch) => (
            <Card key={branch.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">{branch.nameEn || branch.nameHi}</span>
                      <BranchStatusBadge isActive={branch.isActive} />
                    </div>
                    <p className="text-sm text-muted-foreground">{branch.city} — {branch.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">{branch.openTime} - {branch.closeTime} | {branch.phone}</p>
                  </div>
                  <Switch checked={branch.isActive} onCheckedChange={() => toggleBranch.mutate(branch.id)} disabled={toggleBranch.isPending} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BranchFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
