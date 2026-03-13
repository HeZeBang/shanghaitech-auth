const hydraAdminUrl = process.env.HYDRA_ADMIN_URL || "http://localhost:4445";
const clientId = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID || "auth-code-client";
const clientSecret = process.env.CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET || "secret";
const redirectUri = process.env.REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/callback";
const scope = process.env.CLIENT_SCOPE || process.env.NEXT_PUBLIC_SCOPE || "openid profile email";
const clientName = process.env.CLIENT_NAME || process.env.OAUTH_CLIENT_NAME || "ShanghaiTech Auth";
const grantTypes = (process.env.GRANT_TYPES || process.env.OAUTH_GRANT_TYPES || "authorization_code,refresh_token").split(",");

async function registerClient() {
  const client = {
    client_id: clientId,
    client_name: clientName,
    client_secret: clientSecret,
    grant_types: grantTypes,
    redirect_uris: [redirectUri],
    response_types: ["code", "id_token"],
    scope: scope,
    token_endpoint_auth_method: "client_secret_basic",
  };

  console.log(`Registering client "${clientId}" at ${hydraAdminUrl}...`);

  try {
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
