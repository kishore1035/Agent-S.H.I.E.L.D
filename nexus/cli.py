import asyncio
import json
import os
import sys
import click
from nexus.app_store import AppStore
from nexus.blackboard import Blackboard
from nexus.llm import MockLlmClient, ApiLlmClient
from nexus.agents import CodingAgent, ResearchAgent, DataAgent, OpsAgent, Agent
from nexus.router import TaskPlanner, RouterSupervisor
from nexus.trust import ReceiptSigner, SignedReceipt, SandboxRunner, SelfHealer


def build_system(mock_llm: bool = True):
    if mock_llm or "OPENAI_API_KEY" not in os.environ:
        llm = MockLlmClient()
        llm.add_rule("clean csv", "data cleaned: 50 records ready")
        llm.add_rule("code", "def solve():\n    return 'solved successfully'\nprint(solve())")
        llm.add_rule("research", "Key findings: architecture verified and operational")
        llm.add_rule("deploy", "echo 'deployment script validated'")
    else:
        llm = ApiLlmClient(api_key=os.environ["OPENAI_API_KEY"])

    store = AppStore()
    agents: dict[str, Agent] = {
        "coding-agent": CodingAgent(llm),
        "research-agent": ResearchAgent(llm),
        "data-agent": DataAgent(llm),
        "ops-agent": OpsAgent(llm),
    }

    for agent in agents.values():
        store.register(agent.manifest())

    return store, agents, llm


@click.group()
def cli():
    """Nexus: Autonomous Multi-Agent Orchestration Hub."""
    pass


@cli.command("list-agents")
def list_agents():
    """List all registered agents in the App Store."""
    store, _, _ = build_system(mock_llm=True)
    click.echo("\n=== Nexus Worker App Store ===")
    for manifest in store.list():
        click.echo(
            f"• [{manifest.id}] {manifest.name} (v{manifest.version}) - "
            f"Capabilities: {manifest.capabilities} (Timeout: {manifest.timeout_secs}s)"
        )
    click.echo("")


@cli.command("verify-receipt")
@click.argument("receipt_path", type=click.Path(exists=True, dir_okay=False))
def verify_receipt(receipt_path: str):
    """Cryptographically verify an execution receipt."""
    try:
        with open(receipt_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        receipt = SignedReceipt(**data)
        if receipt.verify():
            click.echo(f"✅ Receipt signature is VALID. Signed at: {receipt.timestamp}")
        else:
            click.echo("❌ Receipt signature is INVALID or tampered with.", err=True)
            sys.exit(1)
    except Exception as e:
        click.echo(f"❌ Failed to parse receipt: {e}", err=True)
        sys.exit(1)


@cli.command("run")
@click.argument("task")
@click.option("--mock-llm", is_flag=True, default=False, help="Use deterministic mock LLM.")
@click.option("--sandbox-retries", default=3, help="Max self-healing retry iterations.")
@click.option("--export-receipt", type=click.Path(dir_okay=False), help="Path to export signed receipt JSON.")
@click.option("--dry-run", is_flag=True, default=False, help="Display execution plan without running agents.")
def run_task(
    task: str,
    mock_llm: bool,
    sandbox_retries: int,
    export_receipt: str | None,
    dry_run: bool,
):
    """Decompose and execute a task across specialized worker agents."""
    asyncio.run(
        _run_task_async(
            task=task,
            mock_llm=mock_llm,
            sandbox_retries=sandbox_retries,
            export_receipt=export_receipt,
            dry_run=dry_run,
        )
    )


async def _run_task_async(
    task: str,
    mock_llm: bool,
    sandbox_retries: int,
    export_receipt: str | None,
    dry_run: bool,
):
    click.echo(f"🚀 Dispatching task: \"{task}\"")
    planner = TaskPlanner()
    subtasks = planner.decompose(task)

    if dry_run:
        click.echo("\nPlan (dry run):")
        for i, st in enumerate(subtasks, 1):
            click.echo(f"  {i}. [{st.id}] {st.description} (tags={st.tags})")
        return

    store, agents, llm = build_system(mock_llm=mock_llm)
    bb = Blackboard()
    supervisor = RouterSupervisor(store)
    sandbox = SandboxRunner()
    healer = SelfHealer(sandbox=sandbox, llm=llm)

    results = []

    for st in subtasks:
        worker_id = supervisor.select_worker(st)
        click.echo(f"⚡ Subtask [{st.id}] routed to: {worker_id}")

        output = await supervisor.execute_subtask(st, agents, bb)

        # If agent output is code, run in Trust Layer sandbox with self-healing
        if output.is_code:
            click.echo(f"🛡️  Trust Layer: Testing code output in sandbox...")
            try:
                verified_out = await healer.execute_with_healing(output.result, max_retries=sandbox_retries)
                click.echo(f"✅ Sandbox execution successful.")
                results.append(f"[{st.id}] Verified Code Output:\n{verified_out}")
            except Exception as e:
                click.echo(f"⚠️  Sandbox warning: {e}")
                results.append(f"[{st.id}] Raw Code:\n{output.result}")
        else:
            results.append(f"[{st.id}] Output:\n{output.result}")

    merged_result = "\n\n".join(results)
    click.echo("\n=== Merged Execution Result ===")
    click.echo(merged_result)

    # Sign receipt with Ed25519
    signer = ReceiptSigner.generate()
    receipt = signer.sign(task_id="nexus-run-final", payload=merged_result)

    if export_receipt:
        with open(export_receipt, "w", encoding="utf-8") as f:
            f.write(receipt.model_dump_json(indent=2))
        click.echo(f"\n📝 Signed receipt exported to {export_receipt}")

    click.echo("\n✨ Task completed successfully.")


if __name__ == "__main__":
    cli()
