"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

export async function createPlanet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "");
  const requestedSlug = String(formData.get("slug") ?? "");

  if (!title) {
    redirect("/new?error=title-required");
  }

  const baseSlug = slugify(requestedSlug || title) || crypto.randomUUID().slice(0, 8);
  let slug = baseSlug;
  let attempt = 0;

  while (attempt < 5) {
    const { error } = await supabase.from("planets").insert({
      owner_id: user.id,
      title,
      slug,
      deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
    });

    if (!error) {
      redirect(`/${slug}`);
    }

    // unique constraint violation on slug — try a suffixed variant
    if (error.code === "23505") {
      attempt += 1;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      continue;
    }

    redirect("/new?error=create-failed");
  }

  redirect("/new?error=create-failed");
}
