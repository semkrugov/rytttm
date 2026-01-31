"use client";

import React from "react";
import AddTaskPageClient from "./AddTaskPageClient";

export default function AddTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <AddTaskPageClient projectId={id} />;
}
