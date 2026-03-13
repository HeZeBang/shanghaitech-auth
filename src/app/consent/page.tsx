import { hydraAdmin } from "@/lib/hydra";
import { Button } from "@/components/ui/button";
import { submitConsent } from "./actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { sessionStore } from "@/lib/session-store";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { consent_challenge } = await searchParams;

  if (!consent_challenge || typeof consent_challenge !== "string") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm space-y-4 border p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600">Invalid Request</h1>
          <p>Missing consent challenge parameter.</p>
          <Link href="/" className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  let consentRequest;
  let error: string | null = null;

  try {
    const response = await hydraAdmin.getOAuth2ConsentRequest({
      consentChallenge: consent_challenge,
    });
    consentRequest = response.data;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch consent request";
    console.error("Error fetching consent request:", err);
  }

  if (error || !consentRequest) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm space-y-6 border p-6 rounded-lg shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-red-600">Error</h1>
            <p className="text-gray-500">Failed to fetch consent request details.</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded p-4 text-sm space-y-2">
            <p className="font-semibold text-red-800">Details:</p>
            <code className="block bg-white p-2 rounded text-xs text-red-600 overflow-auto">
              {error || "Unknown error"}
            </code>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm space-y-2">
            <p className="font-semibold text-yellow-800">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-700 text-xs">
              <li>Ensure Hydra is running and accessible at {process.env.HYDRA_ADMIN_URL || "http://localhost:4445"}</li>
              <li>Check that the login process completed successfully</li>
              <li>Try logging in again from the beginning</li>
              <li>Check browser console for more details</li>
            </ul>
          </div>

          <Link href="/" className="inline-block w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-center">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Fetch email from session store
  const session = sessionStore.get(consentRequest.subject ?? "");
  const emailFromSession = session?.email ?? "";

  if (consentRequest.skip) {
    try {
      const acceptResponse = await hydraAdmin.acceptOAuth2ConsentRequest({
        consentChallenge: consent_challenge,
        acceptOAuth2ConsentRequest: {
          grant_scope: consentRequest.requested_scope,
          grant_access_token_audience: consentRequest.requested_access_token_audience,
          session: {
            id_token: {
              sid: consentRequest.subject,
              name: consentRequest.subject,
            },
          },
        },
      });

      if (acceptResponse.data.redirect_to) {
        redirect(acceptResponse.data.redirect_to);
      }
    } catch (err: any) {
      // NEXT_REDIRECT is a special error thrown by redirect()
      if (err?.name === 'NEXT_REDIRECT') {
        throw err;
      }
      console.error("Error auto-accepting consent:", err);
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6 border p-6 rounded-lg shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Consent Required</h1>
          <p className="text-gray-500">
            Application <strong>{consentRequest.client?.client_name || consentRequest.client?.client_id}</strong> wants to access your account.
          </p>
        </div>

        <form action={submitConsent} className="space-y-4">
          <input type="hidden" name="challenge" value={consent_challenge} />

          <div className="space-y-2">
            <p className="font-medium">Requested Scopes:</p>
            {consentRequest.requested_scope?.map((scope) => (
              <div key={scope} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={scope}
                  name="grant_scope"
                  value={scope}
                  defaultChecked
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
                <input type="hidden" name="grant_scope" value={scope} />
                <label htmlFor={scope} className="text-sm font-medium leading-none text-gray-500">
                  {scope}
                </label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
              {!emailFromSession && (
                <span className="text-red-500 ml-1">(auto-fetch failed, please enter manually)</span>
              )}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={emailFromSession}
              readOnly={!!emailFromSession}
              required
              pattern=".+@(alumni\.|)shanghaitech\.edu\.cn$"
              title="Must end with @shanghaitech.edu.cn or @alumni.shanghaitech.edu.cn"
              placeholder="username@shanghaitech.edu.cn"
              className={`w-full rounded border px-3 py-2 text-sm ${
                emailFromSession
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : "bg-white"
              }`}
            />
          </div>

          <div className="flex items-center space-x-2">
             <input type="checkbox" id="remember" name="remember" defaultChecked />
             <label htmlFor="remember" className="text-sm">Remember my decision</label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="w-full">Allow</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
