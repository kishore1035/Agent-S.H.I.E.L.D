import asyncio
import shutil
import sys
from pydantic import BaseModel
from nexus.error import SandboxError


class SandboxResult(BaseModel):
    exit_code: int
    stdout: str
    stderr: str


class SandboxRunner:
    """Isolates untrusted agent code execution using Bubblewrap Linux namespaces."""

    def __init__(self, force_unconfined: bool = False):
        self.has_bwrap = (shutil.which("bwrap") is not None) and (not force_unconfined)

    async def run_code(self, code: str, timeout_secs: float = 10.0) -> SandboxResult:
        if self.has_bwrap:
            cmd = [
                "bwrap",
                "--ro-bind", "/", "/",
                "--tmpfs", "/tmp",
                "--dev", "/dev",
                "--proc", "/proc",
                "--unshare-all",
                sys.executable,
                "-c",
                code,
            ]
        else:
            cmd = [sys.executable, "-c", code]

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                proc.communicate(),
                timeout=timeout_secs,
            )

            stdout = stdout_bytes.decode("utf-8", errors="replace")
            stderr = stderr_bytes.decode("utf-8", errors="replace")
            exit_code = proc.returncode if proc.returncode is not None else -1

            return SandboxResult(
                exit_code=exit_code,
                stdout=stdout,
                stderr=stderr,
            )
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            raise SandboxError(f"Execution timed out after {timeout_secs}s")
        except Exception as e:
            raise SandboxError(f"Sandbox runner failed: {e}") from e
