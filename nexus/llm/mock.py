from .base import LlmClient


class MockLlmClient(LlmClient):
    """Deterministic mock LLM driver for tests and offline execution."""

    def __init__(self):
        self._rules: list[tuple[str, str]] = []

    def add_rule(self, pattern: str, response: str) -> "MockLlmClient":
        self._rules.append((pattern, response))
        return self

    async def complete(self, prompt: str, system: str | None = None) -> str:
        prompt_lower = prompt.lower()
        for pattern, response in self._rules:
            if pattern.lower() in prompt_lower:
                return response

        return f"Mock response for: {prompt}"
