"use client";

import React from "react";
import TaskDetailPageClient from "./TaskDetailPageClient";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <TaskDetailPageClient taskId={id} />;
}
