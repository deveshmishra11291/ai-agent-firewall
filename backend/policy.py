"""Convert security analysis into the capability policy consumed by sandbox-host."""

from typing import Any


def create_policy(security_result: dict[str, Any]) -> dict[str, Any]:
    """Deny any request whose security analysis is not explicitly safe."""
    capabilities = set(security_result.get("capabilities", []))
    decision = "ALLOW" if security_result.get("safe", False) else "DENY"
    return {
        "decision": decision,
        "network": "network" in capabilities and decision == "ALLOW",
        "filesystem_read": "filesystem_read" in capabilities and decision == "ALLOW",
        "filesystem_write": "filesystem_write" in capabilities and decision == "ALLOW",
        "process_execution": "process_execution" in capabilities and decision == "ALLOW",
        "dynamic_execution": "dynamic_execution" in capabilities and decision == "ALLOW",
    }


generate_policy = create_policy
