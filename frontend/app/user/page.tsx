import { ReviewForm } from "@/components/ReviewForm";
import { Card, CardTitle } from "@/components/ui/card";
import { BackToHome } from "@/components/BackToHome";

export default function UserPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-4">
      <BackToHome />
      <Card className="w-full">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-2xl">
            🛵
          </div>
          <div>
            <CardTitle className="mb-0.5 text-lg">Share your feedback about EatSure</CardTitle>
            <p className="text-sm text-muted-foreground">We read every single one — takes less than a minute.</p>
          </div>
        </div>
        <ReviewForm variant="user" />
      </Card>
    </main>
  );
}
