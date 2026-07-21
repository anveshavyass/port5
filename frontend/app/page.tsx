import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 px-4 py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-[#ff5a1f]">🛵 EatSure · Feedback Intelligence</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">PulseAI</h1>
        <p className="mt-2 text-muted-foreground">
          Tell us how your order went, or dig into what everyone else is saying.
        </p>
      </div>

      <div className="grid w-full gap-6 md:grid-cols-2">
        <Link href="/user" className="group block">
          <Card className="h-full transition-shadow group-hover:shadow-md">
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
          <Card className="h-full transition-shadow group-hover:shadow-md">
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
  );
}
