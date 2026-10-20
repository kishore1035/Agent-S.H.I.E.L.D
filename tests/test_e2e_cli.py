import json
import pytest
from click.testing import CliRunner
from nexus.cli import cli

def test_cli_list_agents():
    runner = CliRunner()
    result = runner.invoke(cli, ["list-agents"])
    assert result.exit_code == 0
    assert "Nexus Worker App Store" in result.output
    assert "coding-agent" in result.output
    assert "research-agent" in result.output
    assert "data-agent" in result.output
    assert "ops-agent" in result.output

def test_cli_dry_run():
    runner = CliRunner()
    result = runner.invoke(cli, ["run", "Analyze customer data and write report", "--dry-run"])
    assert result.exit_code == 0
    assert "Plan (dry run):" in result.output
    assert "subtask-data" in result.output or "subtask-code" in result.output

def test_cli_run_and_verify_receipt(tmp_path):
    receipt_file = str(tmp_path / "receipt.json")
    runner = CliRunner()

    # Run task with mock LLM and export receipt
    run_res = runner.invoke(cli, [
        "run",
        "Process csv numbers and output code",
        "--mock-llm",
        "--export-receipt",
        receipt_file,
    ])
    assert run_res.exit_code == 0, run_res.output
    assert "Task completed successfully" in run_res.output

    # Check receipt file content
    with open(receipt_file, "r") as f:
        data = json.load(f)
    assert "payload_digest" in data
    assert "signature" in data

    # Verify receipt via CLI
    verify_res = runner.invoke(cli, ["verify-receipt", receipt_file])
    assert verify_res.exit_code == 0
    assert "Receipt signature is VALID" in verify_res.output
