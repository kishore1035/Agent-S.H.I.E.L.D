from abc import ABC, abstractmethod


class LlmClient(ABC):
    """Abstract base class for all LLM providers."""

    @abstractmethod
    async def complete(self, prompt: str, system: str | None = None) -> str:
        """Generate text completion for given prompt and optional system instruction."""
        pass
