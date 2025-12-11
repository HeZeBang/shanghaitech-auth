import Link from "next/link";

export default function Home() {
  // Construct the OAuth2 Authorization URL
  // In a real app, you would use a library to generate this to handle state, nonce, etc.
  const hydraUrl = "http://localhost:4444/oauth2/auth";
  const params = new URLSearchParams({
    client_id: "auth-code-client",
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: "http://localhost:3000/callback",
    state: "random-state-string",
  });

  const loginUrl = `${hydraUrl}?${params.toString()}`;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">ShanghaiTech Auth Demo</h1>
        <p className="text-lg text-center sm:text-left max-w-md">
          This is a demonstration of a custom Identity Provider using Ory Hydra and Next.js.
        </p>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            href={loginUrl}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Login with Hydra
          </a>
        </div>
        
        <div className="text-sm text-gray-500 mt-8">
          <p>Steps to test:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Ensure Docker containers are running (`docker-compose up`)</li>
            <li>Ensure this Next.js app is running (`npm run dev`)</li>
            <li>Ensure the OAuth Client is registered (see README)</li>
            <li>Click the button above to start the flow</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
