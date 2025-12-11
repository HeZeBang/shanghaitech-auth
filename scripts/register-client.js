// const fetch = require('node-fetch'); // Uncomment if using Node < 18 and have installed node-fetch

const hydraAdminUrl = process.env.HYDRA_ADMIN_URL || "http://localhost:4445";
const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || "auth-code-client";
const clientSecret = process.env.OAUTH_CLIENT_SECRET || "secret";
const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/callback";
const scope = process.env.NEXT_PUBLIC_SCOPE || "openid profile";

async function registerClient() {
  const client = {
    client_id: clientId,
    client_name: process.env.OAUTH_CLIENT_NAME || "Demo Client",
    client_secret: clientSecret,
    grant_types: (process.env.OAUTH_GRANT_TYPES || "authorization_code,refresh_token").split(","),
    redirect_uris: [redirectUri],
    response_types: ["code", "id_token"],
    scope: scope,
    token_endpoint_auth_method: "client_secret_basic",
  };

  try {
    // Check if client exists
    const checkRes = await fetch(`${hydraAdminUrl}/admin/clients/${client.client_id}`);
    if (checkRes.ok) {
      console.log("Client already exists. Updating...");
      const updateRes = await fetch(`${hydraAdminUrl}/admin/clients/${client.client_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
      if (!updateRes.ok) {
        throw new Error(`Failed to update client: ${updateRes.statusText} ${await updateRes.text()}`);
      }
      console.log("Client updated successfully.");
    } else {
      console.log("Creating client...");
      const createRes = await fetch(`${hydraAdminUrl}/admin/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
      if (!createRes.ok) {
        throw new Error(`Failed to create client: ${createRes.statusText} ${await createRes.text()}`);
      }
      console.log("Client created successfully.");
    }
  } catch (error) {
    console.error("Error registering client:", error);
    process.exit(1);
  }
}

registerClient();
