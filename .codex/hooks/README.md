# Command policy

Run `python .codex/hooks/pre_tool_use_policy.py --self-test`. The checker reads tool-call JSON from stdin and denies risky commands with exit 2. It conservatively denies all recursive shell deletion; it is a defense in depth, not a shell parser or sandbox. Host hook registration is not changed by this repository.
