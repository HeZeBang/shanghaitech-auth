import { hydraAdmin } from "@/lib/hydra";
import { Button } from "@/components/ui/button";
import { submitConsent } from "./actions";
import { redirect } from "next/navigation";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { consent_challenge } = await searchParams;

  if (!consent_challenge || typeof consent_challenge !== "string") {
    return <div>Error: Missing consent_challenge</div>;
  }

  try {
    const { data: consentRequest } = await hydraAdmin.getOAuth2ConsentRequest({
      consentChallenge: consent_challenge,
    });

    // If skip is true, we can auto-accept
    if (consentRequest.skip) {
       const { data: acceptResponse } = await hydraAdmin.acceptOAuth2ConsentRequest({
        consentChallenge: consent_challenge,
        acceptOAuth2ConsentRequest: {
          grant_scope: consentRequest.requested_scope,
          grant_access_token_audience: consentRequest.requested_access_token_audience,
          session: {
             id_token: {
                email: "user@example.com", // In real app, fetch based on consentRequest.subject
                name: "Zhang San",
             }
          }
        },
      });

      if (acceptResponse.redirect_to) {
        redirect(acceptResponse.redirect_to);
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
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor={scope} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {scope}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
               <input type="checkbox" id="remember" name="remember" defaultChecked />
               <label htmlFor="remember" className="text-sm">Remember my decision</label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="w-full">Allow</Button>
              {/* You would also implement a Reject button/action */}
            </div>
          </form>
        </div>
      </div>
    );

  } catch (error) {
    console.error("Error fetching consent request:", error);
    return <div>Error fetching consent request details</div>;
  }
}
