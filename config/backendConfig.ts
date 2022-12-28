import EmailPasswordNode from "supertokens-node/recipe/emailpassword";
import SessionNode from "supertokens-node/recipe/session";
import { appInfo } from "./appInfo";
import { TypeInput } from "supertokens-node/types";

export const backendConfig = (): TypeInput => {
  return {
    framework: "express",
    supertokens: {
      // These are the connection details of the app you created on supertokens.com
      connectionURI:
        "https://dev-cf980a7186d411ed8072c9d8a5b187c0-us-east-1.aws.supertokens.io:3571",
      apiKey: "AmukL8QS-hMwJZGBX26BWlP9MB0w0S",
    },
    appInfo,
    recipeList: [EmailPasswordNode.init(), SessionNode.init()],
    isInServerlessEnv: true,
  };
};
