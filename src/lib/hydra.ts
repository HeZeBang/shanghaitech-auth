import { Configuration, OAuth2Api } from "@ory/client";

const hydraAdminUrl = process.env.HYDRA_ADMIN_URL || "http://localhost:4445";

const configuration = new Configuration({
  basePath: hydraAdminUrl,
});

export const hydraAdmin = new OAuth2Api(configuration);
