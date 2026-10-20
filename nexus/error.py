class NexusError(Exception):
    """Base exception for all Nexus runtime and orchestration errors."""
    pass


class RouterError(NexusError):
    def __init__(self, message: str):
        super().__init__(f"Router error: {message}")


class WorkerError(NexusError):
    def __init__(self, message: str):
        super().__init__(f"Worker error: {message}")


class SandboxError(NexusError):
    def __init__(self, message: str):
        super().__init__(f"Sandbox error: {message}")


class SelfHealExhaustedError(NexusError):
    def __init__(self, retries: int, message: str):
        super().__init__(f"Self-healing exhausted after {retries} retries: {message}")


class BlackboardError(NexusError):
    def __init__(self, message: str):
        super().__init__(f"Blackboard error: {message}")


class CryptoError(NexusError):
    def __init__(self, message: str):
        super().__init__(f"Crypto error: {message}")


class LlmError(NexusError):
    def __init__(self, message: str):
        super().__init__(f"LLM error: {message}")
