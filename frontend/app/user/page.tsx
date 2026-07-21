import { ReviewForm } from "@/components/ReviewForm";
import { Card, CardTitle } from "@/components/ui/card";
import { BackToHome } from "@/components/BackToHome";

export default function UserPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-4">
      <BackToHome />
      <Card className="w-full">
        <CardTitle className="text-lg">Share your feedback about EatSure</CardTitle>
        <ReviewForm variant="user" />
      </Card>
    </main>
  );
}
