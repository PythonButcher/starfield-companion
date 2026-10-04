"""Conservative shell policy. Read a tool-call JSON object from stdin."""
import json
import re
import sys


def deny_reason(command):
    rules = [
        (r"\bgit\b[^\n;|]*\b(restore|checkout)\b", "Use patches or git switch; restore/checkout can discard work."),
        (r"\bgit\b[^\n;|]*\breset\b[^\n;|]*--hard", "Hard reset discards work."),
        (r"\bgit\b[^\n;|]*\bclean\b[^\n;|]*(-\w*f|--force)", "Forced clean deletes untracked work."),
        (r"\bgit\b[^\n;|]*\bpush\b[^\n;|]*(--force|-f\b|\+\w)", "Force push rewrites remote history."),
        (r"(?<![>\d])>(?!>)", "Blind output redirection can overwrite source; use reviewed file edits."),
        (r"\b(rm|rmdir|Remove-Item)\b[^\n;|]*(-[\w]*r[\w]*f|-[\w]*f[\w]*r|-Recurse|/s)", "Recursive shell deletion requires explicit path review."),
    ]
    for pattern, reason in rules:
        if re.search(pattern, command, re.IGNORECASE):
            return reason
    return None


def self_test():
    denied = ['git restore a.py', 'git checkout -- a.py', 'git reset --hard',
              'git clean -fd', 'git push --force-with-lease', 'echo bad > app.py',
              'rm -rf ../outside', 'Remove-Item C:/source -Recurse -Force']
    allowed = ['git status', 'git switch -c codex/test', 'python -m pytest -q', 'npm run build']
    assert all(deny_reason(cmd) for cmd in denied)
    assert all(deny_reason(cmd) is None for cmd in allowed)
    print('12 policy cases passed')


if __name__ == '__main__':
    if '--self-test' in sys.argv:
        self_test()
    else:
        try:
            payload = json.load(sys.stdin)
            args = payload.get('tool_input', payload.get('arguments', payload))
            if isinstance(args, str):
                args = json.loads(args)
            command = args.get('cmd', args.get('command', ''))
            reason = deny_reason(command)
        except (ValueError, AttributeError, TypeError):
            reason = 'Invalid tool-call JSON; command cannot be reviewed.'
        if reason:
            print(reason, file=sys.stderr)
            sys.exit(2)
