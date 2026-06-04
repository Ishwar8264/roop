"use client";

import { Plus, Trash2, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffServices } from "@/features/staff/hooks/use-staff-services";
import { useRemoveStaffService } from "@/features/staff/hooks/use-remove-staff-service";
import { useTranslation } from "@/i18n/use-translation";
import { useLocaleStore } from "@/i18n/locale-store";
import type { StaffServiceItemResponse } from "@/features/staff/types";

interface ServiceListProps {
  staffId: string;
}

export function ServiceList({ staffId }: ServiceListProps) {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { data: services, isLoading } = useStaffServices(staffId);
  const removeService = useRemoveStaffService(staffId);

  const handleRemove = (serviceId: string) => {
    if (confirm(t("staff.removeServiceConfirm"))) {
      removeService.mutate(serviceId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("staff.services")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scissors className="h-4 w-4 text-primary" />
          {t("staff.services")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {services && services.length > 0 ? (
          <div className="space-y-2">
            {services.map((svc: StaffServiceItemResponse) => (
              <div
                key={svc.id}
                className="flex items-center justify-between p-2.5 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">
                    {locale === "hi" ? svc.nameHi : svc.nameEn}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      ₹{svc.price}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {svc.durationMinutes}min
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemove(svc.serviceId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Scissors className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("staff.noServices")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
