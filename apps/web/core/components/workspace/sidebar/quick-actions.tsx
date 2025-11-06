import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, SIDEBAR_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AddIcon } from "@plane/propel/icons";
// components
import { SidebarAddButton } from "@/components/sidebar/add-button";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { AppSearch } from "@/plane-web/components/workspace/sidebar/app-search";

export const SidebarQuickActions = observer(() => {
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const canCreateProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <>
      <div className="flex items-center justify-between gap-2 cursor-pointer">
        <SidebarAddButton
          label={
            <>
              <AddIcon className="size-4" />
              <span className="text-sm font-medium truncate max-w-[145px]">{t("create_project")}</span>
            </>
          }
          onClick={() => toggleCreateProjectModal(true)}
          disabled={!canCreateProject}
          data-ph-element={SIDEBAR_TRACKER_ELEMENTS.CREATE_PROJECT_BUTTON}
        />
        <AppSearch />
      </div>
    </>
  );
});
