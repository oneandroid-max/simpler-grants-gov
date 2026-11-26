"server-only";

import { MissingAuthError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import { PaginationInfo } from "src/types/apiResponseTypes";
import {
  ApplicationDetail,
  UserApplicationsApiResponse,
} from "src/types/applicationResponseTypes";

export const APPLICATIONS_PAGE_SIZE = 25;

export interface PaginatedApplicationsResult {
  data: ApplicationDetail[];
  paginationInfo: PaginationInfo;
}

export const getApplications = async (
  userId: string,
  pageOffset = 1,
  pageSize = APPLICATIONS_PAGE_SIZE,
): Promise<PaginatedApplicationsResult> => {
  const safePageOffset =
    Number.isInteger(pageOffset) && pageOffset > 0 ? pageOffset : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0
      ? pageSize
      : APPLICATIONS_PAGE_SIZE;

  const body = {
    pagination: {
      page_offset: safePageOffset,
      page_size: safePageSize,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "descending",
        },
      ],
    },
  };
  const subPath = `${userId}/applications`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    body,
  });
  const json = (await resp.json()) as Partial<UserApplicationsApiResponse>;
  const data = json.data ?? [];
  const paginationInfo: PaginationInfo = json.pagination_info ?? {
    page_offset: safePageOffset,
    page_size: safePageSize,
    total_pages: data.length > 0 ? 1 : 0,
    total_records: data.length,
    order_by: "created_at",
    sort_direction: "descending",
  };
  return {
    data,
    paginationInfo,
  };
};

export const fetchApplications = async (
  pageOffset = 1,
  pageSize = APPLICATIONS_PAGE_SIZE,
): Promise<PaginatedApplicationsResult> => {
  const session = await getSession();
  if (!session?.token) {
    throw new MissingAuthError("No user token present to fetch applications");
  }
  return getApplications(session.user_id, pageOffset, pageSize);
};
