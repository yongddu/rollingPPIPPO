"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  async function signInWith(provider: "google" | "kakao") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Kakao only grants account_email to business-verified apps, so we
        // request nickname/profile image only — Supabase would otherwise ask
        // for account_email by default and Kakao rejects the whole request.
        ...(provider === "kakao" && {
          scopes: "profile_nickname profile_image",
        }),
      },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">내 행성 만들기</h1>
      <p className="text-sm text-neutral-500">
        로그인하면 나만의 행성을 만들 수 있어요.
      </p>
      <div className="mt-4 flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => signInWith("google")}
          className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50"
        >
          Google로 로그인
        </button>
        <button
          onClick={() => signInWith("kakao")}
          className="rounded-full bg-[#FEE500] px-6 py-3 font-medium text-black hover:brightness-95"
        >
          카카오로 로그인
        </button>
      </div>
    </main>
  );
}
