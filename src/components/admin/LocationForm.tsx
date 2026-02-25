"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
}

interface LocationFormProps {
  location: Location;
  onSaved: () => void;
}

export function LocationForm({ location, onSaved }: LocationFormProps) {
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address);
  const [phone, setPhone] = useState(location.phone);
  const [email, setEmail] = useState(location.email ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Naam is verplicht";
    if (!address.trim()) newErrors.address = "Adres is verplicht";
    if (!phone.trim()) newErrors.phone = "Telefoon is verplicht";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Ongeldig e-mailadres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("locations")
        .update({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
        })
        .eq("id", location.id);

      if (error) throw error;

      setSuccess(true);
      onSaved();
    } catch (err) {
      setErrors({
        form:
          err instanceof Error ? err.message : "Er ging iets mis bij het opslaan",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Naam"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <Input
        label="Adres"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={errors.address}
      />
      <Input
        label="Telefoon"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
      />
      <Input
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      {errors.form && (
        <p className="text-sm text-red-500" role="alert">
          {errors.form}
        </p>
      )}

      {success && (
        <p className="text-sm text-basilico">
          Locatiegegevens succesvol opgeslagen
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          Opslaan
        </Button>
      </div>
    </form>
  );
}
