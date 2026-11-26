import { readError } from "src/errors";
import {
  APPLICATIONS_PAGE_SIZE,
  fetchApplications,
} from "src/services/fetch/fetchers/userApplicationsFetcher";

const parsePageParam = (rawPage: unknown): number => {
  const parsed =
    typeof rawPage === "number"
      ? rawPage
      : typeof rawPage === "string"
        ? Number.parseInt(rawPage, 10)
        : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

export const listApplications = async (request: Request) => {
  try {
    let pageOffset = 1;
    try {
      const body = (await request.json()) as { pageOffset?: unknown };
      pageOffset = parsePageParam(body?.pageOffset);
    } catch {
      const url = new URL(request.url, "http://localhost");
      pageOffset = parsePageParam(url.searchParams.get("page"));
    }

    const result = await fetchApplications(pageOffset, APPLICATIONS_PAGE_SIZE);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to fetch applications: ${message}`,
      },
      { status },
    );
  }
};
