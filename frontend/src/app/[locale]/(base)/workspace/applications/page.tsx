import { UnauthorizedError } from "src/errors";
import {
  APPLICATIONS_PAGE_SIZE,
  fetchApplications,
  PaginatedApplicationsResult,
} from "src/services/fetch/fetchers/userApplicationsFetcher";
import { LocalizedPageProps } from "src/types/intl";

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PropsWithChildren } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";
import ApplicationsTable from "src/components/workspace/ApplicationsTable";

interface ApplicationsPageProps extends LocalizedPageProps {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
}

const parseInitialPage = (rawPage?: string | string[]): number => {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  if (!value || !/^\d+$/.test(value)) {
    return 1;
  }
  const parsed = Number.parseInt(value, 10);
  return parsed > 0 ? parsed : 1;
};

const ApplicationsPageWrapper = ({ children }: PropsWithChildren) => {
  const t = useTranslations("Applications");
  return (
    <GridContainer>
      <Breadcrumbs
        breadcrumbList={[
          {
            title: t("breadcrumbWorkspace"),
            path: `/workspace`,
          },
          {
            title: t("breadcrumbApplications"),
          },
        ]}
      />
      <h1 className="margin-top-0 margin-bottom-7">{t("pageHeading")}</h1>
      {children}
    </GridContainer>
  );
};

const ApplicationsErrorPage = () => {
  const t = useTranslations("Applications");

  return (
    <ApplicationsPageWrapper>
      <div className="margin-bottom-15">
        <Alert slim={true} headingLevel="h6" noIcon={true} type="error">
          {t("errorMessage")}
        </Alert>
      </div>
    </ApplicationsPageWrapper>
  );
};

export default async function Applications({
  params,
  searchParams,
}: ApplicationsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialPage = parseInitialPage(resolvedSearchParams?.page);

  let initialData: PaginatedApplicationsResult;
  try {
    initialData = await fetchApplications(initialPage, APPLICATIONS_PAGE_SIZE);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    return <ApplicationsErrorPage />;
  }

  return (
    <ApplicationsPageWrapper>
      <ApplicationsTable initialData={initialData} initialPage={initialPage} />
    </ApplicationsPageWrapper>
  );
}
