import importlib.util
import inspect
from pathlib import Path
from nexus.agents.base import Agent
from nexus.llm.base import LlmClient


class PluginLoader:
    """Dynamically discovers and loads external AI worker agents from directories."""

    def load_from_directory(self, dir_path: str, llm: LlmClient) -> list[Agent]:
        path = Path(dir_path)
        if not path.is_dir():
            return []

        loaded_agents: list[Agent] = []

        for file_path in sorted(path.glob("*.py")):
            if file_path.name.startswith("__"):
                continue

            module_name = f"nexus_plugin_{file_path.stem}"
            try:
                spec = importlib.util.spec_from_file_location(module_name, file_path)
                if spec is None or spec.loader is None:
                    continue

                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)

                for _, obj in inspect.getmembers(module, inspect.isclass):
                    if issubclass(obj, Agent) and obj is not Agent:
                        agent_instance = obj(llm)
                        loaded_agents.append(agent_instance)
            except Exception:
                continue

        return loaded_agents
