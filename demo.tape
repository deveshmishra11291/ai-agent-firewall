# AI Agent Firewall - Automated Terminal GIF Generator
# Requirements: brew install vhs
# Usage: cd ~/ai-agent-firewall && vhs demo.tape

Output demo.gif

Set Shell "zsh"
Set FontSize 14
Set FontFamily "JetBrains Mono"
Set Width 1100
Set Height 680
Set Padding 20
Set Theme "Catppuccin Mocha"
Set WindowBar "Colorful"
Set BorderRadius 12
Set TypingSpeed 45ms

# Clean previous test files silently
Hide
Type "rm -rf test_*.py .firewall-quarantine"
Enter
Show

# 1. Run the agent under active firewall supervision
Type "aaf run \"python demo_agent.py\""
Sleep 500ms
Enter
Sleep 6s

# 2. Verify in-place neutralization of the attack
Type "cat test_backdoor.py"
Sleep 500ms
Enter
Sleep 3s

# 3. Show isolated payload in the quarantine vault
Type "cat .firewall-quarantine/test_backdoor.py.*.quarantine"
Sleep 500ms
Enter
Sleep 4s
