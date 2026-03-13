import { hydraPublic } from "@/lib/hydra-public";
import Link from "next/link";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code, error, error_description } = await searchParams;

  if (error) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold text-red-600">OAuth Error</h1>
        <p>Error: {error}</p>
        <p>Description: {error_description}</p>
        <Link href="/" className="text-blue-500 hover:underline mt-4 block">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!code || typeof code !== "string") {
    return <div className="p-10">No code provided.</div>;
  }

  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || "auth-code-client";
  const clientSecret = process.env.OAUTH_CLIENT_SECRET || "secret";
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/callback";

  let tokenData;
  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await hydraPublic.oauth2TokenExchange({
      grantType: "authorization_code",
      code: code,
      redirectUri: redirectUri,
      clientId: clientId,
    }, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
      }
    });
    tokenData = response.data;
  } catch (err: any) {
    console.error("Token exchange failed", err.response?.data || err.message);
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold text-red-600">Token Exchange Failed</h1>
        <pre className="bg-gray-100 p-4 rounded mt-4 overflow-auto">
          {JSON.stringify(err.response?.data || err.message, null, 2)}
        </pre>
        <Link href="/" className="text-blue-500 hover:underline mt-4 block">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-green-600">Login Successful!</h1>
      <p>You have successfully authenticated via Ory Hydra.</p>

      <div className="border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">ID Token Claims (User Info)</h2>
        <pre className="bg-slate-950 text-slate-50 p-4 rounded overflow-auto text-sm">
          {tokenData.id_token
            ? JSON.stringify(JSON.parse(atob(tokenData.id_token.split('.')[1])), null, 2)
            : "No ID Token returned"}
        </pre>
      </div>

      <div className="border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Full Token Response</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(tokenData, null, 2)}
        </pre>
      </div>

      <Link href="/" className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
        Start Again
      </Link>
    </div>
  );
}
