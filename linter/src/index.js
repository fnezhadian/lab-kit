// src/index.js
import noHardcodedApiKey from "./rules/no-hardcoded-api-key.js";

export default {
  meta: { name: "eslint-plugin-lab-kit", version: "0.2.0" },
  rules: {
    "no-hardcoded-api-key": noHardcodedApiKey
  }
};
