import httpx
from .base import LlmClient
from nexus.error import LlmError


class AnthropicLlmClient(LlmClient):
    """Anthropic Claude API client using Messages format."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.anthropic.com/v1",
        model: str = "claude-3-5-sonnet-20241022",
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def complete(self, prompt: str, system: str | None = None) -> str:
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        payload = {
            "model": self.model,
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            payload["system"] = system

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data["content"][0]["text"]
            except Exception as e:
                raise LlmError(f"Anthropic API completion failed: {e}") from e
