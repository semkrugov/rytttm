"use client";

import React from "react";
import ProjectPageClient from "./ProjectPageClient";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <ProjectPageClient projectId={id} />;
}
