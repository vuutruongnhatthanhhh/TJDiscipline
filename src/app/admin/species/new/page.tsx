import Link from "next/link";
import { SpeciesForm } from "../../species-form";
import type { SpeciesKind } from "@/lib/species";

export default async function NewSpeciesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const initialKind: SpeciesKind = kind === "plant" ? "plant" : "pet";

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="text-sm font-bold text-text-muted">
        ← Danh sách
      </Link>
      <SpeciesForm mode="create" initialKind={initialKind} />
    </div>
  );
}
