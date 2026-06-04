"use client";

import { useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaves } from "@/features/staff/hooks/use-leaves";
import { useAddLeave } from "@/features/staff/hooks/use-add-leave";
import { useRemoveLeave } from "@/features/staff/hooks/use-remove-leave";
import { useTranslation } from "@/i18n/use-translation";

interface LeaveManagerProps {
  staffId: string;
}

export function LeaveManager({ staffId }: LeaveManagerProps) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const { data: leaves, isLoading } = useLeaves(staffId);
  const addLeave = useAddLeave(staffId);
  const removeLeave = useRemoveLeave(staffId);

  const handleAdd = () => {
    if (!leaveDate) return;
    addLeave.mutate(
      { date: leaveDate, reason: leaveReason.trim() || undefined },
      {
        onSuccess: () => {
          setLeaveDate("");
          setLeaveReason("");
          setShowAddForm(false);
        },
      }
    );
  };

  const handleRemove = (leaveId: string) => {
    if (confirm(t("staff.removeLeaveConfirm"))) {
      removeLeave.mutate(leaveId);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {t("staff.leaves")}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("staff.addLeave")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Leave Form */}
        {showAddForm && (
          <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <div className="space-y-1.5">
              <Label htmlFor="leaveDate">{t("staff.leaveDate")}</Label>
              <Input
                id="leaveDate"
                type="date"
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leaveReason">{t("staff.leaveReason")}</Label>
              <Input
                id="leaveReason"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder={t("staff.leaveReasonPlaceholder")}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={addLeave.isPending || !leaveDate}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {addLeave.isPending ? t("common.loading") : t("common.save")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        {/* Leave List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : leaves && leaves.length > 0 ? (
          <div className="space-y-2">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between p-2.5 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{leave.date}</span>
                  {leave.reason && (
                    <span className="text-xs text-muted-foreground">
                      — {leave.reason}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(leave.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("staff.noLeaves")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
