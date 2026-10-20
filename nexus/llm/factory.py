import os
from .base import LlmClient
from .mock import MockLlmClient
from .api import ApiLlmClient
from .anthropic import AnthropicLlmClient
from .ollama import OllamaLlmClient


def create_llm_client(preferred: str | None = None) -> LlmClient:
    """Auto-detects and instantiates the appropriate LLM provider client."""
    pref = (preferred or "").lower().strip()

    if pref == "mock":
        return _build_default_mock()

    if pref == "ollama":
        return OllamaLlmClient()

    if pref == "anthropic" or (not pref and "ANTHROPIC_API_KEY" in os.environ):
        key = os.environ.get("ANTHROPIC_API_KEY", "")
        return AnthropicLlmClient(api_key=key)

    if pref == "openai" or (not pref and "OPENAI_API_KEY" in os.environ):
        key = os.environ.get("OPENAI_API_KEY", "")
        return ApiLlmClient(api_key=key)

    return _build_default_mock()


def _build_default_mock() -> MockLlmClient:
    mock = MockLlmClient()
    mock.add_rule("clean csv", "data cleaned: 50 records ready")
    mock.add_rule("code", "def solve():\n    return 'solved successfully'\nprint(solve())")
    mock.add_rule("research", "Key findings: architecture verified and operational")
    mock.add_rule("deploy", "echo 'deployment script validated'")
    return mock
