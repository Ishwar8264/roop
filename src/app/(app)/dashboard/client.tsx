/**
 * Purpose: Dashboard client component
 * Responsibility: Display user welcome, quick actions, loyalty points
 * Important Notes:
 *   - Client component — uses auth store
 *   - AppShell already provides header + bottom nav
 *   - AuthProvider handles redirect if not authenticated — no need for local check
 */

"use client";

import { useRouter } from "next/navigation";
import { Calendar, Sparkles, User, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

export function DashboardClient() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">
          नमस्ते{user?.name ? `, ${user.name}` : ""}!
        </h2>
        <p className="text-muted-foreground">आज आपके लिए क्या कर सकते हैं?</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => router.push("/services")}
        >
          <CardContent className="p-5 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">सेवाएं देखें</h3>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => router.push("/bookings")}
        >
          <CardContent className="p-5 text-center">
            <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">मेरी बुकिंग</h3>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => router.push("/offers")}
        >
          <CardContent className="p-5 text-center">
            <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">ऑफ़र</h3>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          onClick={() => router.push("/profile")}
        >
          <CardContent className="p-5 text-center">
            <User className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">प्रोफ़ाइल</h3>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Points */}
      {(user?.loyaltyPoints ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-primary to-rose-700 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">लॉयल्टी पॉइंट</p>
                <p className="text-2xl font-bold">{user?.loyaltyPoints}</p>
              </div>
              <Sparkles className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
