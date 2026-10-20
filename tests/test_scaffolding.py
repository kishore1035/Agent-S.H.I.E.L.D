import pytest
from nexus.error import (
    NexusError,
    RouterError,
    WorkerError,
    SandboxError,
    SelfHealExhaustedError,
    BlackboardError,
    CryptoError,
    LlmError,
)

def test_nexus_error_hierarchy():
    err = WorkerError("Agent crashed")
    assert isinstance(err, NexusError)
    assert str(err) == "Worker error: Agent crashed"

    err2 = SandboxError("bwrap exit code 1")
    assert isinstance(err2, NexusError)
    assert str(err2) == "Sandbox error: bwrap exit code 1"

    err3 = SelfHealExhaustedError(3, "syntax error")
    assert isinstance(err3, NexusError)
    assert "Self-healing exhausted after 3 retries" in str(err3)
