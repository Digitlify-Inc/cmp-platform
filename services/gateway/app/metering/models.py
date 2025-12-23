"""Data models for usage metering."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class TokenUsage:
    """Token usage for a single model call."""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    def __add__(self, other: "TokenUsage") -> "TokenUsage":
        """Add two TokenUsage objects."""
        return TokenUsage(
            prompt_tokens=self.prompt_tokens + other.prompt_tokens,
            completion_tokens=self.completion_tokens + other.completion_tokens,
            total_tokens=self.total_tokens + other.total_tokens,
        )


@dataclass
class RunMetrics:
    """Metrics collected during a single run execution."""

    run_id: UUID = field(default_factory=uuid4)
    start_time: datetime = field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None

    # Model and token usage
    model: str = ""
    token_usage: TokenUsage = field(default_factory=TokenUsage)

    # Tool/function calls
    tool_calls: int = 0
    tool_names: list[str] = field(default_factory=list)

    # Status
    status: str = "pending"  # pending, running, success, error
    error_message: Optional[str] = None

    @property
    def duration_ms(self) -> int:
        """Calculate duration in milliseconds."""
        if self.end_time is None:
            return 0
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() * 1000)

    def complete(self, status: str = "success", error: Optional[str] = None) -> None:
        """Mark the run as complete."""
        self.end_time = datetime.utcnow()
        self.status = status
        self.error_message = error

    def add_tool_call(self, tool_name: str) -> None:
        """Record a tool call."""
        self.tool_calls += 1
        if tool_name not in self.tool_names:
            self.tool_names.append(tool_name)

    def add_tokens(self, prompt: int = 0, completion: int = 0) -> None:
        """Add token usage."""
        self.token_usage.prompt_tokens += prompt
        self.token_usage.completion_tokens += completion
        self.token_usage.total_tokens += prompt + completion
