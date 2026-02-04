"use client";

import { use } from "react";
import ProjectTasksPageClient from "./ProjectTasksPageClient";

export default function ProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProjectTasksPageClient projectId={id} />;
}
