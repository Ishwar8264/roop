/**
 * Purpose: Branch holiday management panel
 * Responsibility: Let admins add and remove branch holidays from the branch UI
 * Important Notes:
 *   - Client component for form state and mutation feedback
 *   - Auth is sent through HttpOnly same-origin cookies
 */

"use client";

import { useReducer, useCallback } from "react";
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

type HolidayManagerState = {
  holidays: BranchHolidayResponse[];
  showForm: boolean;
  date: string;
  reasonHi: string;
  reasonEn: string;
  isAdding: boolean;
  removingId: string | null;
};

type HolidayManagerAction =
  | { type: "toggleForm" }
  | { type: "hideForm" }
  | { type: "setDate"; value: string }
  | { type: "setReasonHi"; value: string }
  | { type: "setReasonEn"; value: string }
  | { type: "setAdding"; value: boolean }
  | { type: "setRemovingId"; value: string | null }
  | { type: "addHoliday"; value: BranchHolidayResponse }
  | { type: "removeHoliday"; value: string };

function holidayManagerReducer(
  state: HolidayManagerState,
  action: HolidayManagerAction
): HolidayManagerState {
  switch (action.type) {
    case "toggleForm":
      return { ...state, showForm: !state.showForm };
    case "hideForm":
      return { ...state, showForm: false };
    case "setDate":
      return { ...state, date: action.value };
    case "setReasonHi":
      return { ...state, reasonHi: action.value };
    case "setReasonEn":
      return { ...state, reasonEn: action.value };
    case "setAdding":
      return { ...state, isAdding: action.value };
    case "setRemovingId":
      return { ...state, removingId: action.value };
    case "addHoliday":
      return {
        ...state,
        holidays: [...state.holidays, action.value],
        date: "",
        reasonHi: "",
        reasonEn: "",
        showForm: false,
      };
    case "removeHoliday":
      return {
        ...state,
        holidays: state.holidays.filter((holiday) => holiday.id !== action.value),
      };
    default:
      return state;
  }
}

export function HolidayManager({ branchId, initialHolidays, onMutated }: HolidayManagerProps) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [state, dispatch] = useReducer(holidayManagerReducer, {
    holidays: initialHolidays,
    showForm: false,
    date: "",
    reasonHi: "",
    reasonEn: "",
    isAdding: false,
    removingId: null,
  });

  const handleAdd = useCallback(async () => {
    if (!state.date || !state.reasonHi.trim()) return;
    dispatch({ type: "setAdding", value: true });
    try {
      const res = await fetch(`/api/branches/${branchId}/holidays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          date: state.date,
          reasonHi: state.reasonHi.trim(),
          reasonEn: state.reasonEn.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error");

      toast.success(t("branches.holidayAdded") ?? "Holiday added");
      dispatch({ type: "addHoliday", value: json.data });
      onMutated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      dispatch({ type: "setAdding", value: false });
    }
  }, [state.date, state.reasonHi, state.reasonEn, branchId, t, onMutated]);

  const handleRemove = useCallback(async (holidayId: string) => {
    if (!confirm(t("branches.removeHolidayConfirm"))) return;
    dispatch({ type: "setRemovingId", value: holidayId });
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
      dispatch({ type: "removeHoliday", value: holidayId });
      onMutated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      dispatch({ type: "setRemovingId", value: null });
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
              onClick={() => dispatch({ type: "toggleForm" })}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              {t("branches.addHoliday")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {state.showForm && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("branches.holidayDate")}</Label>
              <Input
                type="date"
                value={state.date}
                onChange={(e) =>
                  dispatch({ type: "setDate", value: e.target.value })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("branches.holidayReason")}
              </Label>
              <Input
                value={state.reasonHi}
                onChange={(e) =>
                  dispatch({ type: "setReasonHi", value: e.target.value })
                }
                placeholder="छुट्टी का कारण"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("branches.holidayReasonEn")}
              </Label>
              <Input
                value={state.reasonEn}
                onChange={(e) =>
                  dispatch({ type: "setReasonEn", value: e.target.value })
                }
                placeholder="Reason (optional)"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={state.isAdding || !state.date || !state.reasonHi.trim()}
                className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {state.isAdding ? t("common.loading") : t("common.save")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dispatch({ type: "hideForm" })}
                className="h-7 text-xs"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        {state.holidays.length > 0 ? (
          <div className="space-y-1.5">
            {state.holidays.map((h) => (
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
                    disabled={state.removingId === h.id}
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
