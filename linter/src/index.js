// src/index.js
import noHardcodedApiKey from "./rules/no-hardcoded-api-key.js";
import noHardcodedPassword from "./rules/no-hardcoded-password.js";
import noSecretInPublicEnv from "./rules/no-secret-in-public-env.js";

export default {
  meta: { name: "eslint-plugin-lab-kit", version: "0.4.0" },
  rules: {
    "no-hardcoded-api-key": noHardcodedApiKey,
    "no-hardcoded-password": noHardcodedPassword,
    "no-secret-in-public-env": noSecretInPublicEnv
  }
};
