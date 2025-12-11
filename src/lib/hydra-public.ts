import { Configuration, OAuth2Api } from "@ory/client";

const hydraPublicUrl = process.env.NEXT_PUBLIC_HYDRA_PUBLIC_URL || "http://localhost:4444";

const configuration = new Configuration({
  basePath: hydraPublicUrl,
  baseOptions: {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  },
});

export const hydraPublic = new OAuth2Api(configuration);
