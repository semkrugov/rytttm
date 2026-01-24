export type ExtractResult =
  | { is_task: false }
  | {
      is_task: true;
      task_data: {
        title: string;
        assignee: string | null;
        deadline: string | null;
        priority: "low" | "medium" | "high";
        description: string;
      };
    };

export function safeJsonParse(text: string): ExtractResult {
  try {
    const parsed = JSON.parse(text);

    if (parsed && typeof parsed === "object" && parsed.is_task === false) {
      return { is_task: false };
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.is_task === true &&
      parsed.task_data &&
      typeof parsed.task_data.title === "string" &&
      (parsed.task_data.assignee === null || typeof parsed.task_data.assignee === "string") &&
      (parsed.task_data.deadline === null || typeof parsed.task_data.deadline === "string") &&
      (parsed.task_data.priority === "low" ||
        parsed.task_data.priority === "medium" ||
        parsed.task_data.priority === "high") &&
      typeof parsed.task_data.description === "string"
    ) {
      return parsed as ExtractResult;
    }

    return { is_task: false };
  } catch {
    return { is_task: false };
  }
}
