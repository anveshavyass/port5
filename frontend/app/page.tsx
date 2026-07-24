import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/card";
import { FloatingParticles } from "@/components/FloatingParticles";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      <FloatingParticles />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-14 px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-medium text-[#ff5a1f]">🛵 EatSure · Feedback Intelligence</p>
          <h1 className="mt-3 bg-gradient-to-r from-[#ff5a1f] to-rose-600 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            PulseAI
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Tell us how your order went, or dig into what everyone else is saying.
          </p>
        </div>

        <div className="grid w-full gap-6 md:grid-cols-2">
          <Link href="/user" className="group block">
            <Card className="h-full border-orange-100 bg-white/80 backdrop-blur-sm transition-all group-hover:-translate-y-0.5 group-hover:border-orange-200 group-hover:shadow-lg group-hover:shadow-orange-100">
              <div className="text-3xl">🍔</div>
              <CardTitle className="mt-3 text-base">I'm a Customer</CardTitle>
              <p className="text-sm text-muted-foreground">
                Share feedback about a recent order — delivery, food quality, payments, or anything
                else. Takes a few seconds.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-[#ff5a1f] group-hover:underline">
                Leave feedback →
              </span>
            </Card>
          </Link>

          <Link href="/admin" className="group block">
            <Card className="h-full border-orange-100 bg-white/80 backdrop-blur-sm transition-all group-hover:-translate-y-0.5 group-hover:border-orange-200 group-hover:shadow-lg group-hover:shadow-orange-100">
              <div className="text-3xl">📊</div>
              <CardTitle className="mt-3 text-base">I'm on the CX Team</CardTitle>
              <p className="text-sm text-muted-foreground">
                Full analytics: sentiment, categories, urgency, weekly AI summaries, and a chat
                interface over every review.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-[#ff5a1f] group-hover:underline">
                Open dashboard →
              </span>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
