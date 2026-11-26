"use client";

import {
  ApplicationDetail,
  ApplicationStatus,
} from "src/types/applicationResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import {
  PaginatedTable,
  PaginatedTablePaginationInfo,
  PaginatedTableResponse,
} from "src/components/core/PaginatedTable";
import { TableCellData } from "src/components/core/TableWithResponsiveHeader";

export interface ApplicationsTableProps {
  initialData: PaginatedTableResponse<ApplicationDetail>;
  initialPage: number;
}

const NoStartedApplications = () => {
  const t = useTranslations("Applications.noApplicationsMessage");

  return (
    <div className="margin-bottom-15">
      <div className="font-sans-xl text-bold margin-bottom-3">
        {t("primary")}
      </div>
      <div>{t("secondary")}</div>
    </div>
  );
};

export const ApplicationsTable = ({
  initialData,
  initialPage,
}: ApplicationsTableProps) => {
  const t = useTranslations();

  const headerContent: TableCellData[] = useMemo(
    () => [
      { cellData: t("Applications.tableHeadings.closeDate") },
      { cellData: t("Applications.tableHeadings.status") },
      { cellData: t("Applications.tableHeadings.applicationName") },
      { cellData: t("Applications.tableHeadings.type") },
      { cellData: t("Applications.tableHeadings.opportunity") },
    ],
    [t],
  );

  const mapRow = useCallback(
    (application: ApplicationDetail): TableCellData[] => [
      { cellData: formatDate(application.competition.closing_date) },
      {
        cellData:
          application.application_status === ApplicationStatus.IN_PROGRESS
            ? t("Applications.tableContents.draft")
            : t("Applications.tableContents.submitted"),
      },
      {
        cellData: (
          <a href={`/workspace/applications/${application.application_id}`}>
            {application.application_name}
          </a>
        ),
      },
      {
        cellData: application.organization
          ? application.organization.sam_gov_entity.legal_business_name
          : t("Applications.tableContents.individual"),
      },
      {
        cellData: (
          <div>
            <a
              href={`/opportunity/${application.competition.opportunity.opportunity_id}`}
            >
              {application.competition.opportunity.opportunity_title}
            </a>
            <div className="font-sans-3xs">
              <span className="text-bold">
                {t("Applications.tableContents.agency")}{" "}
              </span>
              {application.competition.opportunity.agency_name}
            </div>
          </div>
        ),
      },
    ],
    [t],
  );

  const fetchPage = useCallback(
    async (
      page: number,
    ): Promise<PaginatedTableResponse<ApplicationDetail>> => {
      const response = await fetch("/api/user/applications/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageOffset: page }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch applications page ${page}`);
      }

      return (await response.json()) as PaginatedTableResponse<ApplicationDetail>;
    },
    [],
  );

  const renderSummary = useCallback(
    (paginationInfo: PaginatedTablePaginationInfo) => (
      <span className="font-sans-lg text-bold">
        {t("Applications.numApplications", {
          num: paginationInfo.total_records,
        })}
      </span>
    ),
    [t],
  );

  const getRowKey = useCallback(
    (application: ApplicationDetail) => application.application_id,
    [],
  );

  return (
    <PaginatedTable<ApplicationDetail>
      fetchPage={fetchPage}
      headerContent={headerContent}
      mapRow={mapRow}
      getRowKey={getRowKey}
      errorMessage={t("Applications.errorMessage")}
      emptyState={<NoStartedApplications />}
      initialPage={initialPage}
      initialData={initialData}
      renderSummary={renderSummary}
    />
  );
};

export default ApplicationsTable;
