import { MissingAuthError } from "src/errors";
import {
  APPLICATIONS_PAGE_SIZE,
  fetchApplications,
  getApplications,
} from "src/services/fetch/fetchers/userApplicationsFetcher";

const fetchUserMock = jest.fn();
const fetchUserWithMethodMock = jest.fn();
const mockGetSession = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchUserWithMethod: (type: string) =>
    fetchUserWithMethodMock(type) as unknown,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

describe("getApplications", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchUserWithMethod with 25-row pagination defaults and returns data + paginationInfo", async () => {
    const pagination_info = {
      page_offset: 1,
      page_size: APPLICATIONS_PAGE_SIZE,
      total_pages: 3,
      total_records: 60,
      order_by: "created_at",
      sort_direction: "descending",
    };
    fetchUserMock.mockReturnValue({
      json: () => ({ data: [{ fake: "applications" }], pagination_info }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await getApplications("1");

    expect(result).toEqual({
      data: [{ fake: "applications" }],
      paginationInfo: pagination_info,
    });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/applications",
      body: {
        pagination: {
          page_offset: 1,
          page_size: APPLICATIONS_PAGE_SIZE,
          sort_order: [
            {
              order_by: "created_at",
              sort_direction: "descending",
            },
          ],
        },
      },
    });
  });

  it("passes custom pageOffset and pageSize and falls back for invalid numbers", async () => {
    fetchUserMock.mockReturnValue({
      json: () => ({ data: [] }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await getApplications("1", 3, 10);

    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/applications",
      body: {
        pagination: {
          page_offset: 3,
          page_size: 10,
          sort_order: [
            {
              order_by: "created_at",
              sort_direction: "descending",
            },
          ],
        },
      },
    });
    expect(result.paginationInfo.page_offset).toBe(3);
    expect(result.paginationInfo.total_pages).toBe(0);
  });
});

describe("fetchApplications", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchApplications with requested pageOffset and returns paginated result", async () => {
    const pagination_info = {
      page_offset: 2,
      page_size: APPLICATIONS_PAGE_SIZE,
      total_pages: 4,
      total_records: 85,
      order_by: "created_at",
      sort_direction: "descending",
    };
    mockGetSession.mockResolvedValue({ token: "faketoken", user_id: "1" });
    fetchUserMock.mockReturnValue({
      json: () => ({ data: [{ fake: "applications" }], pagination_info }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await fetchApplications(2);

    expect(result).toEqual({
      data: [{ fake: "applications" }],
      paginationInfo: pagination_info,
    });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/applications",
      body: {
        pagination: {
          page_offset: 2,
          page_size: APPLICATIONS_PAGE_SIZE,
          sort_order: [
            {
              order_by: "created_at",
              sort_direction: "descending",
            },
          ],
        },
      },
    });
  });

  it("throws MissingAuthError if user token is not present", async () => {
    mockGetSession.mockResolvedValue({});

    await expect(fetchApplications()).rejects.toThrow(MissingAuthError);
  });
});
