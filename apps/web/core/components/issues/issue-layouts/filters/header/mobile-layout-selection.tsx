import { ISSUE_LAYOUTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { EIssueLayoutTypes } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";

export const MobileLayoutSelection = ({
  layouts,
  onChange,
  activeLayout,
}: {
  layouts: EIssueLayoutTypes[];
  onChange: (layout: EIssueLayoutTypes) => void;
  activeLayout?: EIssueLayoutTypes;
  isMobile?: boolean;
}) => {
  const { t } = useTranslation();
  const activeLayoutLabelKey = activeLayout
    ? ISSUE_LAYOUTS.find((layout) => layout.key === activeLayout)?.i18n_title
    : undefined;
  const buttonLabel = activeLayoutLabelKey ? t(activeLayoutLabelKey) : t("common.layout");
  const fallbackLayout = ISSUE_LAYOUTS.find((layout) => layouts.includes(layout.key))?.key;
  const buttonLayout = activeLayout ?? fallbackLayout;
  return (
    <CustomMenu
      maxHeight={"md"}
      className="flex flex-grow justify-center text-sm text-custom-text-200"
      placement="bottom-start"
      customButton={
        <Button variant="neutral-primary" size="sm" className="relative px-2" aria-label={buttonLabel}>
          {buttonLayout ? (
            <IssueLayoutIcon layout={buttonLayout} size={14} strokeWidth={2} className="h-3.5 w-3.5" />
          ) : (
            <span aria-hidden="true" className="block h-3.5 w-3.5" />
          )}
        </Button>
      }
      customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
      closeOnSelect
    >
      {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout, index) => (
        <CustomMenu.MenuItem
          key={index}
          onClick={() => {
            onChange(layout.key);
          }}
          className="flex items-center gap-2"
        >
          <IssueLayoutIcon layout={layout.key} className="h-3 w-3" />
          <div className="text-custom-text-300">{t(layout.i18n_label)}</div>
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
};
