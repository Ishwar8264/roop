"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHolidays } from "@/features/branch/hooks/use-holidays";
import { useAddHoliday } from "@/features/branch/hooks/use-add-holiday";
import { useRemoveHoliday } from "@/features/branch/hooks/use-remove-holiday";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";
import { Skeleton } from "@/components/ui/skeleton";

export function HolidayManager({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const { data: holidays, isLoading } = useHolidays(branchId);
  const addHoliday = useAddHoliday(branchId);
  const removeHoliday = useRemoveHoliday(branchId);

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [reasonHi, setReasonHi] = useState("");
  const [reasonEn, setReasonEn] = useState("");

  const handleAdd = () => {
    if (!date || !reasonHi.trim()) return;
    addHoliday.mutate(
      {
        date,
        reasonHi: reasonHi.trim(),
        reasonEn: reasonEn.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDate("");
          setReasonHi("");
          setReasonEn("");
          setShowForm(false);
        },
      }
    );
  };

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
                disabled={
                  addHoliday.isPending || !date || !reasonHi.trim()
                }
                className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {addHoliday.isPending
                  ? t("common.loading")
                  : t("common.save")}
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

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : holidays && holidays.length > 0 ? (
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
                    onClick={() => {
                      if (confirm(t("branches.removeHolidayConfirm")))
                        removeHoliday.mutate(h.id);
                    }}
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
