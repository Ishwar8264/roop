/**
 * Purpose: Branch holiday management panel
 * Responsibility: Let admins add and remove branch holidays from the branch UI
 * Important Notes:
 *   - Client component for form state and mutation feedback
 *   - Auth is sent through HttpOnly same-origin cookies
 */

"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";
import { toast } from "sonner";
import type { BranchHolidayResponse } from "@/features/branch/types";

interface HolidayManagerProps {
  branchId: string;
  initialHolidays: BranchHolidayResponse[];
  onMutated?: () => void;
}

export function HolidayManager({ branchId, initialHolidays, onMutated }: HolidayManagerProps) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [holidays, setHolidays] = useState<BranchHolidayResponse[]>(initialHolidays);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [reasonHi, setReasonHi] = useState("");
  const [reasonEn, setReasonEn] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = useCallback(async () => {
    if (!date || !reasonHi.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/branches/${branchId}/holidays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          date,
          reasonHi: reasonHi.trim(),
          reasonEn: reasonEn.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error");

      toast.success(t("branches.holidayAdded") ?? "Holiday added");
      setHolidays((prev) => [...prev, json.data]);
      setDate("");
      setReasonHi("");
      setReasonEn("");
      setShowForm(false);
      onMutated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setIsAdding(false);
    }
  }, [date, reasonHi, reasonEn, branchId, t, onMutated]);

  const handleRemove = useCallback(async (holidayId: string) => {
    if (!confirm(t("branches.removeHolidayConfirm"))) return;
    setRemovingId(holidayId);
    try {
      const res = await fetch(`/api/branches/${branchId}/holidays/${holidayId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error");

      toast.success(t("branches.holidayRemoved") ?? "Holiday removed");
      setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
      onMutated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setRemovingId(null);
    }
  }, [branchId, t, onMutated]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t("branches.holidays")}
          </CardTitle>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              {t("branches.addHoliday")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("branches.holidayDate")}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("branches.holidayReason")}
              </Label>
              <Input
                value={reasonHi}
                onChange={(e) => setReasonHi(e.target.value)}
                placeholder="छुट्टी का कारण"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("branches.holidayReasonEn")}
              </Label>
              <Input
                value={reasonEn}
                onChange={(e) => setReasonEn(e.target.value)}
                placeholder="Reason (optional)"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={isAdding || !date || !reasonHi.trim()}
                className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isAdding ? t("common.loading") : t("common.save")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="h-7 text-xs"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        {holidays.length > 0 ? (
          <div className="space-y-1.5">
            {holidays.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-sm"
              >
                <div>
                  <span className="font-medium">{h.date}</span>
                  <span className="text-muted-foreground ml-2">
                    {locale === "hi"
                      ? h.reasonHi
                      : h.reasonEn || h.reasonHi}
                  </span>
                </div>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={removingId === h.id}
                    onClick={() => handleRemove(h.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("branches.noHolidays")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
