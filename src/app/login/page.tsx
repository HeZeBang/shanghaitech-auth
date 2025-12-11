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
  } catch (error) {
    console.error("Error fetching login request:", error);
    return <div>Error fetching login request details</div>;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm challenge={login_challenge} />
      </div>
    </div>
  );
}
