from typing import Any
from nexus.app_store import AppStore
from nexus.blackboard import Blackboard
from nexus.llm import MockLlmClient
from nexus.agents import CodingAgent, ResearchAgent, DataAgent, OpsAgent
from nexus.router import TaskPlanner, RouterSupervisor
from nexus.trust import SandboxRunner, SelfHealer, ReceiptSigner


def list_demo_scenarios() -> list[str]:
    return ["self-heal", "orchestration", "app-store"]


async def run_demo_scenario(name: str) -> dict[str, Any]:
    if name == "self-heal":
        mock_llm = MockLlmClient()
        mock_llm.add_rule(
            "NameError",
            "numbers = [1, 2, 3, 4, 5]\nprint(f'Sum calculated: {sum(numbers)}')"
        )

        sandbox = SandboxRunner()
        healer = SelfHealer(sandbox=sandbox, llm=mock_llm)

        # Broken code triggering NameError in sandbox
        broken_code = "print(f'Sum calculated: {sum(undefined_numbers_var)}')"

        output = await healer.execute_with_healing(broken_code, max_retries=2)

        return {
            "status": "success",
            "scenario": "self-heal",
            "broken_input": broken_code,
            "output": output.strip(),
        }

    elif name == "orchestration":
        mock_llm = MockLlmClient()
        mock_llm.add_rule("market trends", "Tech market indices up 5.2% over Q3.")
        mock_llm.add_rule("clean csv", "Cleaned 12,000 data rows, normalized prices.")
        mock_llm.add_rule("code", "def forecast(): return 'Q4 growth estimated at 6.1%'\nprint(forecast())")

        store = AppStore()
        coding = CodingAgent(mock_llm)
        research = ResearchAgent(mock_llm)
        data = DataAgent(mock_llm)
        ops = OpsAgent(mock_llm)

        store.register(coding.manifest())
        store.register(research.manifest())
        store.register(data.manifest())
        store.register(ops.manifest())

        agents = {
            "coding-agent": coding,
            "research-agent": research,
            "data-agent": data,
            "ops-agent": ops,
        }

        bb = Blackboard()
        planner = TaskPlanner()
        supervisor = RouterSupervisor(store)

        task = "Research market trends, clean csv data, and generate python forecast script"
        subtasks = planner.decompose(task)

        outputs = []
        for st in subtasks:
            out = await supervisor.execute_subtask(st, agents, bb)
            outputs.append({
                "subtask_id": st.id,
                "agent_id": out.agent_id,
                "result": out.result,
            })

        signer = ReceiptSigner.generate()
        receipt = signer.sign("demo-task", str(outputs))

        return {
            "status": "success",
            "scenario": "orchestration",
            "subtasks_executed": len(subtasks),
            "outputs": outputs,
            "receipt": receipt.model_dump(),
        }

    elif name == "app-store":
        mock_llm = MockLlmClient()
        store = AppStore()
        for a in [CodingAgent(mock_llm), ResearchAgent(mock_llm), DataAgent(mock_llm), OpsAgent(mock_llm)]:
            store.register(a.manifest())

        best = store.find_best_worker(["python", "code"])
        return {
            "status": "success",
            "scenario": "app-store",
            "total_workers": len(store.list()),
            "best_coder": best.id if best else None,
        }

    else:
        raise ValueError(f"Unknown scenario '{name}'. Available: {list_demo_scenarios()}")
