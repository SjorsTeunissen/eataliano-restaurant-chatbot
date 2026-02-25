"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Ongeldige inloggegevens");
      setPassword("");
      setIsLoading(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-base shadow-warm-md p-space-7">
        <h1 className="font-headline text-2xl text-oven mb-6 text-center">
          Admin Inloggen
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="E-mailadres"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Wachtwoord"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" isLoading={isLoading}>
            Inloggen
          </Button>
        </form>
      </div>
    </div>
  );
}
