import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { listApplications } from "./handler";

export const POST = respondWithTraceAndLogs(listApplications);
