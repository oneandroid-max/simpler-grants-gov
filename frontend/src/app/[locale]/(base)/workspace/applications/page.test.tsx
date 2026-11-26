import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Applications from "src/app/[locale]/(base)/workspace/applications/page";
import { UnauthorizedError } from "src/errors";
import { PaginatedApplicationsResult } from "src/services/fetch/fetchers/userApplicationsFetcher";
import {
  ApplicationDetail,
  ApplicationStatus,
} from "src/types/applicationResponseTypes";
import { DeepPartial } from "src/utils/testing/commonTestUtils";
import { localeParams } from "src/utils/testing/intlMocks";

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/workspace/applications",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const makeResult = (
  items: DeepPartial<ApplicationDetail>[],
  overrides?: Partial<PaginatedApplicationsResult["paginationInfo"]>,
): PaginatedApplicationsResult => ({
  data: items as ApplicationDetail[],
  paginationInfo: {
    page_offset: 1,
    page_size: 25,
    total_pages: items.length > 0 ? 1 : 0,
    total_records: items.length,
    order_by: "created_at",
    sort_direction: "descending",
    ...overrides,
  },
});

const applications = jest.fn().mockResolvedValue(makeResult([]));

jest.mock("src/services/fetch/fetchers/userApplicationsFetcher", () => ({
  APPLICATIONS_PAGE_SIZE: 25,
  fetchApplications: (...args: unknown[]) =>
    applications(...args) as Promise<PaginatedApplicationsResult>,
}));

const mockBreadcrumbs = jest.fn();

jest.mock("src/components/core/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: { breadcrumbList: { title: string; path: string }[] }) => {
    mockBreadcrumbs(props);
    return <nav data-testid="mock-breadcrumbs" />;
  },
}));

describe("Applications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("no applications have been saved", () => {
    beforeEach(() => {
      applications.mockResolvedValue(makeResult([]));
    });

    it("passes the correct breadcrumbs", async () => {
      const component = await Applications({ params: localeParams });
      render(component);

      expect(screen.getByTestId("mock-breadcrumbs")).toBeInTheDocument();

      expect(mockBreadcrumbs).toHaveBeenCalledWith({
        breadcrumbList: [
          {
            title: "breadcrumbWorkspace",
            path: "/workspace",
          },
          {
            title: "breadcrumbApplications",
          },
        ],
      });
    });

    it("renders correct text", async () => {
      const component = await Applications({ params: localeParams });
      render(component);

      expect(await screen.findByText("primary")).toBeVisible();
      expect(await screen.findByText("secondary")).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      const component = await Applications({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("there was error fetching applications", () => {
    beforeEach(() => {
      applications.mockRejectedValue(new Error("failure"));
    });

    it("general errors render an alert", async () => {
      applications.mockRejectedValue(new Error("failure"));
      const component = await Applications({ params: localeParams });
      render(component);

      expect(await screen.findByTestId("alert")).toBeVisible();
    });

    it("unauthorized errors continue up the stack", async () => {
      applications.mockRejectedValue(
        new UnauthorizedError("No active session"),
      );
      await expect(Applications({ params: localeParams })).rejects.toThrow();
    });

    it("passes accessibility scan", async () => {
      applications.mockRejectedValue(new Error("failure"));
      const component = await Applications({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("an application is returned", () => {
    let basicApplication: DeepPartial<ApplicationDetail>;
    beforeEach(() => {
      basicApplication = {
        application_id: "1a4d247b-ca08-4855-bdcd-e48432cd6d71",
        application_name: "first!!!",
        application_status: ApplicationStatus.IN_PROGRESS,
        competition: {
          closing_date: "2025-11-11",
          competition_id: "642a4dda-8c13-4bc6-bbae-1a0d133d90a6",
          competition_title: "Truth common can board.",
          is_open: true,
          opening_date: "2025-10-26",
          opportunity: {
            agency_name: "Health Resources and Services Administration",
            opportunity_id: "c9e472ab-2561-4ac3-b514-63781bc6a404",
            opportunity_title: "Local Pilot-equivalent Opportunity",
          },
        },
      };
    });

    it("fetches the requested page from searchParams with pageSize 25", async () => {
      applications.mockResolvedValue(
        makeResult([basicApplication], {
          page_offset: 2,
          total_pages: 3,
          total_records: 52,
        }),
      );
      const component = await Applications({
        params: localeParams,
        searchParams: Promise.resolve({ page: "2" }),
      });
      render(component);

      expect(applications).toHaveBeenCalledWith(2, 25);
      expect(await screen.findByText("first!!!")).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      applications.mockResolvedValue(makeResult([basicApplication]));
      const component = await Applications({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });

    it("renders headings", async () => {
      applications.mockResolvedValue(makeResult([basicApplication]));
      const component = await Applications({ params: localeParams });
      render(component);

      expect(
        screen.getAllByText("Applications.tableHeadings.closeDate"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("Applications.tableHeadings.status"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("Applications.tableHeadings.applicationName"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("Applications.tableHeadings.type"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("Applications.tableHeadings.opportunity"),
      ).toHaveLength(2);
    });

    it("renders close date", async () => {
      applications.mockResolvedValue(makeResult([basicApplication]));
      const component = await Applications({ params: localeParams });
      render(component);

      expect(await screen.findByText("November 11, 2025")).toBeVisible();
    });

    it("renders application filing name", async () => {
      applications.mockResolvedValue(makeResult([basicApplication]));
      const component = await Applications({ params: localeParams });
      render(component);

      expect(await screen.findByText("first!!!")).toBeVisible();
    });

    it("renders opportunity name and agency", async () => {
      applications.mockResolvedValue(makeResult([basicApplication]));
      const component = await Applications({ params: localeParams });
      render(component);

      expect(
        await screen.findByText("Local Pilot-equivalent Opportunity"),
      ).toBeVisible();
      expect(
        await screen.findByText("Health Resources and Services Administration"),
      ).toBeVisible();
    });

    describe("renders status", () => {
      it("if in draft", async () => {
        applications.mockResolvedValue(makeResult([basicApplication]));
        const component = await Applications({ params: localeParams });
        render(component);

        expect(
          await screen.findByText("Applications.tableContents.draft"),
        ).toBeVisible();
      });

      it("if submitted", async () => {
        applications.mockResolvedValue(
          makeResult([
            {
              ...basicApplication,
              application_status: ApplicationStatus.SUBMITTED,
            },
          ]),
        );
        const component = await Applications({ params: localeParams });
        render(component);

        expect(
          await screen.findByText("Applications.tableContents.submitted"),
        ).toBeVisible();
      });

      it("if approved", async () => {
        applications.mockResolvedValue(
          makeResult([
            {
              ...basicApplication,
              application_status: ApplicationStatus.ACCEPTED,
            },
          ]),
        );
        const component = await Applications({ params: localeParams });
        render(component);

        expect(
          await screen.findByText("Applications.tableContents.submitted"),
        ).toBeVisible();
      });
    });

    describe("renders type", () => {
      it("if started as an individual", async () => {
        applications.mockResolvedValue(makeResult([basicApplication]));
        const component = await Applications({ params: localeParams });
        render(component);

        expect(
          await screen.findByText("Applications.tableContents.individual"),
        ).toBeVisible();
      });

      it("if started as an organization", async () => {
        applications.mockResolvedValue(
          makeResult([
            {
              ...basicApplication,
              organization: {
                sam_gov_entity: { legal_business_name: "Great Organization" },
              },
            },
          ]),
        );
        const component = await Applications({ params: localeParams });
        render(component);

        expect(await screen.findByText("Great Organization")).toBeVisible();
      });
    });
  });
});
