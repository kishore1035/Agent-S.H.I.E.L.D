import os
import pytest
from nexus.llm import (
    create_llm_client,
    AnthropicLlmClient,
    OllamaLlmClient,
    ApiLlmClient,
    MockLlmClient,
)

def test_llm_factory_precedence(monkeypatch):
    # Default without env vars -> MockLlmClient
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    client_default = create_llm_client()
    assert isinstance(client_default, MockLlmClient)

    # ANTHROPIC_API_KEY set -> AnthropicLlmClient
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key")
    client_ant = create_llm_client()
    assert isinstance(client_ant, AnthropicLlmClient)

    # Explicit preference override
    client_mock = create_llm_client(preferred="mock")
    assert isinstance(client_mock, MockLlmClient)

    client_ollama = create_llm_client(preferred="ollama")
    assert isinstance(client_ollama, OllamaLlmClient)
