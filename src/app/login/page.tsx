import { hydraAdmin } from "@/lib/hydra";
import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { login_challenge } = await searchParams;

  if (!login_challenge || typeof login_challenge !== "string") {
    return <div>Error: Missing login_challenge</div>;
  }

  try {
    const { data: loginRequest } = await hydraAdmin.getOAuth2LoginRequest({
      loginChallenge: login_challenge,
    });

    if (loginRequest.skip) {
      const { data: acceptResponse } = await hydraAdmin.acceptOAuth2LoginRequest({
        loginChallenge: login_challenge,
        acceptOAuth2LoginRequest: {
          subject: loginRequest.subject || "",
        },
      });

      if (acceptResponse.redirect_to) {
        redirect(acceptResponse.redirect_to);
      }
    }
  } catch (error: any) {
    // NEXT_REDIRECT is a special error thrown by redirect()
    if (error?.name === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("Error fetching login request:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className="p-10 space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>Failed to fetch login request details.</p>
        <details className="bg-gray-100 p-4 rounded text-sm">
          <summary className="cursor-pointer font-semibold">Error Details</summary>
          <pre className="mt-2 overflow-auto">{errorMessage}</pre>
        </details>
        <p className="text-sm text-gray-600">
          Challenge: <code>{login_challenge}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm challenge={login_challenge} />
      </div>
    </div>
  );
}
