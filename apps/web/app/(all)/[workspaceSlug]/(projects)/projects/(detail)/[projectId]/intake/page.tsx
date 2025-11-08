"use client";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

const ProjectInboxPage = observer(() => {
  /// router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();

  useEffect(() => {
    if (workspaceSlug && projectId) {
      router.replace(`/${workspaceSlug}/projects/${projectId}`);
    }
  }, [router, workspaceSlug, projectId]);

  if (!workspaceSlug || !projectId)
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-custom-text-300">Redirecting…</span>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <PageHead title="Inbox" />
      <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-custom-text-300">
        <span>The project inbox has been removed. Redirecting you to project work items.</span>
      </div>
    </div>
  );
});

export default ProjectInboxPage;
