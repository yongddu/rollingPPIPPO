import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold">행성 롤링페이퍼</h1>
      <p className="max-w-sm text-neutral-500">
        나만의 행성을 만들고, 친구들이 원하는 자리에 메시지를 남기게 해보세요.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800"
      >
        시작하기
      </Link>
    </main>
  );
}
