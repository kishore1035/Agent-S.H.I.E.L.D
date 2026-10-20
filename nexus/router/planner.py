from pydantic import BaseModel, Field


class Subtask(BaseModel):
    id: str
    description: str
    tags: list[str] = Field(default_factory=list)


class TaskPlanner:
    """Decomposes a complex user task into specialized subtasks."""

    def decompose(self, task_prompt: str) -> list[Subtask]:
        prompt_lower = task_prompt.lower()
        subtasks: list[Subtask] = []

        if any(w in prompt_lower for w in ["data", "csv", "sql", "analyze", "metrics", "clean"]):
            subtasks.append(
                Subtask(
                    id="subtask-data",
                    description=f"Process and analyze data for: {task_prompt}",
                    tags=["data", "csv", "transform"],
                )
            )

        if any(w in prompt_lower for w in ["code", "python", "script", "program", "function", "write"]):
            subtasks.append(
                Subtask(
                    id="subtask-code",
                    description=f"Generate and verify code for: {task_prompt}",
                    tags=["code", "python", "fix"],
                )
            )

        if any(w in prompt_lower for w in ["deploy", "ops", "bash", "docker", "server"]):
            subtasks.append(
                Subtask(
                    id="subtask-ops",
                    description=f"Configure deployment and operations for: {task_prompt}",
                    tags=["ops", "bash", "deploy"],
                )
            )

        # Default or research subtask if needed
        if not subtasks or any(w in prompt_lower for w in ["research", "report", "summary", "explain"]):
            subtasks.append(
                Subtask(
                    id="subtask-research",
                    description=f"Research context and synthesize findings for: {task_prompt}",
                    tags=["research", "summary", "docs"],
                )
            )

        return subtasks
