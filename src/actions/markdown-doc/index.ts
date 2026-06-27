import { createAction } from "@/actions/core/Action";
import { markdownDocExecutor } from "./executor";
import { markdownDocPlanner } from "./planner";
import { markdownDocReporter } from "./reporter";
import { markdownDocValidator } from "./validator";

export const markdownDocAction = createAction({
  metadata: {
    id: "markdown-doc",
    name: "Update Markdown Doc",
    description: "Plan and apply updates to repository markdown documentation files.",
    version: "1.0.0",
    category: "documentation",
  },
  planner: markdownDocPlanner,
  validator: markdownDocValidator,
  executor: markdownDocExecutor,
  reporter: markdownDocReporter,
});

export { planMarkdownDocAction } from "./planMarkdownDocAction";
export { executeMarkdownDocAction } from "./executeMarkdownDocAction";
