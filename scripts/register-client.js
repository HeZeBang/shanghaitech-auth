// const fetch = require('node-fetch'); // Uncomment if using Node < 18 and have installed node-fetch

const hydraAdminUrl = process.env.HYDRA_ADMIN_URL || "http://localhost:4445";

async function registerClient() {
  const client = {
    client_id: "auth-code-client",
    client_name: "Demo Client",
    client_secret: "secret",
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: ["http://localhost:3000/callback"],
    response_types: ["code", "id_token"],
    scope: "openid profile email",
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
