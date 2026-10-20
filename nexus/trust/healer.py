from .sandbox import SandboxRunner
from nexus.error import SelfHealExhaustedError
from nexus.llm import LlmClient


class SelfHealer:
    """Automated security guard and code repair loop."""

    def __init__(self, sandbox: SandboxRunner, llm: LlmClient):
        self.sandbox = sandbox
        self.llm = llm

    async def execute_with_healing(self, initial_code: str, max_retries: int = 3) -> str:
        current_code = initial_code

        for attempt in range(max_retries + 1):
            result = await self.sandbox.run_code(current_code)

            if result.exit_code == 0:
                return result.stdout

            if attempt == max_retries:
                raise SelfHealExhaustedError(
                    max_retries,
                    f"Exit code: {result.exit_code}, stderr: {result.stderr.strip()}",
                )

            # Ask LLM to repair the code based on error trace
            prompt = (
                f"The following Python code failed in the sandbox with exit code {result.exit_code}.\n"
                f"STDERR:\n{result.stderr}\n\n"
                f"CODE:\n{current_code}\n\n"
                "Please fix the code and return ONLY the executable Python code without markdown tags or explanation."
            )
            system = "You are an automated code repair system. Output pure, correct Python code."

            fixed = await self.llm.complete(prompt, system=system)
            # Strip markdown formatting if any was returned
            fixed = fixed.strip()
            if fixed.startswith("```python"):
                fixed = fixed[len("```python"):].strip()
            if fixed.startswith("```"):
                fixed = fixed[len("```"):].strip()
            if fixed.endswith("```"):
                fixed = fixed[:-3].strip()

            current_code = fixed

        raise SelfHealExhaustedError(max_retries, "Exhausted all retry attempts.")
