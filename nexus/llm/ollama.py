import httpx
from .base import LlmClient
from nexus.error import LlmError


class OllamaLlmClient(LlmClient):
    """Local Ollama model client."""

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama3",
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def complete(self, prompt: str, system: str | None = None) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }
        if system:
            payload["system"] = system

        async with httpx.AsyncClient(timeout=90.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data["response"]
            except Exception as e:
                raise LlmError(f"Ollama completion failed: {e}") from e
