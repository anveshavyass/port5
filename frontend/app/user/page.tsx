import { ReviewForm } from "@/components/ReviewForm";
import { Card, CardTitle } from "@/components/ui/card";

export default function UserPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
      <Card className="w-full">
        <CardTitle className="text-lg">Share your feedback about EatSure</CardTitle>
        <ReviewForm variant="user" />
      </Card>
    </main>
  );
}
