from pydantic import BaseModel, Field


class AgentManifest(BaseModel):
    id: str
    name: str
    capabilities: list[str] = Field(default_factory=list)
    version: str = "1.0.0"
    timeout_secs: float = 30.0
