/**
 * AWS Lambda entry point.
 * Wraps the Express app with serverless-http so Lambda can invoke it directly.
 *
 * Handler: dist/lambda.handler
 */
import serverless from "serverless-http";
import { app } from "./http.js";
export const handler = serverless(app);
//# sourceMappingURL=lambda.js.map