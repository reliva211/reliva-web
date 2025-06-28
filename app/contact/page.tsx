import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 rounded shadow bg-card border">
        <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
        <p className="mb-6 text-muted-foreground">
          This is a placeholder Contact Us page. You can add a contact form or
          more info here later.
        </p>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
