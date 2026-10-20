from abc import ABC, abstractmethod
from pydantic import BaseModel
from nexus.app_store import AgentManifest
from nexus.blackboard import Blackboard
from nexus.llm import LlmClient


class AgentOutput(BaseModel):
    agent_id: str
    result: str
    is_code: bool = False


class Agent(ABC):
    """Abstract base class for all specialized worker agents."""

    def __init__(self, llm: LlmClient):
        self.llm = llm

    @abstractmethod
    def manifest(self) -> AgentManifest:
        pass

    @abstractmethod
    async def execute(self, task: str, blackboard: Blackboard) -> AgentOutput:
        pass
