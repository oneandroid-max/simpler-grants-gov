/**
 * @jest-environment node
 */
import { UnauthorizedError } from "src/errors";
import { APPLICATIONS_PAGE_SIZE } from "src/services/fetch/fetchers/userApplicationsFetcher";

import { listApplications } from "./handler";

const mockFetchApplications = jest.fn();

jest.mock("src/services/fetch/fetchers/userApplicationsFetcher", () => ({
  APPLICATIONS_PAGE_SIZE: 25,
  fetchApplications: (...args: unknown[]): unknown =>
    mockFetchApplications(...args),
}));

describe("listApplications handler", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns 200 with paginated applications for requested pageOffset", async () => {
    const payload = {
      data: [{ application_id: "app-1" }],
      paginationInfo: {
        page_offset: 2,
        page_size: APPLICATIONS_PAGE_SIZE,
        total_pages: 3,
        total_records: 60,
      },
    };
    mockFetchApplications.mockResolvedValue(payload);

    const req = new Request("http://localhost/api/user/applications/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageOffset: 2 }),
    });

    const resp = await listApplications(req);
    expect(resp.status).toBe(200);
    expect(mockFetchApplications).toHaveBeenCalledWith(
      2,
      APPLICATIONS_PAGE_SIZE,
    );
    expect(await resp.json()).toEqual(payload);
  });

  it("defaults to page 1 when body is invalid", async () => {
    mockFetchApplications.mockResolvedValue({
      data: [],
      paginationInfo: {
        page_offset: 1,
        page_size: APPLICATIONS_PAGE_SIZE,
        total_pages: 0,
        total_records: 0,
      },
    });

    const req = new Request("http://localhost/api/user/applications/list", {
      method: "POST",
      body: "not-json",
    });

    const resp = await listApplications(req);
    expect(resp.status).toBe(200);
    expect(mockFetchApplications).toHaveBeenCalledWith(
      1,
      APPLICATIONS_PAGE_SIZE,
    );
  });

  it("returns mapped error status when fetchApplications throws", async () => {
    mockFetchApplications.mockRejectedValue(
      new UnauthorizedError("No session"),
    );

    const req = new Request("http://localhost/api/user/applications/list", {
      method: "POST",
      body: JSON.stringify({ pageOffset: 1 }),
    });

    const resp = await listApplications(req);
    expect(resp.status).toBe(401);
  });
});
