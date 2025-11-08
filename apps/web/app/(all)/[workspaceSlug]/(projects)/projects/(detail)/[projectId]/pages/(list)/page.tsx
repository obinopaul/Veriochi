"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

const ProjectPagesPage = () => {
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;

    router.replace(`/${workspaceSlug.toString()}/projects/${projectId.toString()}/issues`);
  }, [router, workspaceSlug, projectId]);

  return null;
};

export default ProjectPagesPage;
