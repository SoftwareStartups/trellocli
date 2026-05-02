// promptHidden cannot be unit tested easily because it reads from process.stdin
// interactively. It is covered by manual verification and login command tests
// that mock the prompt dependency. isTTY is a thin wrapper over
// process.stdin.isTTY with no logic of its own.
