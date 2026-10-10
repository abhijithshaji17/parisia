# Parisia Project Rules

1. **Preserve the existing design.** Before changing the booking experience, inspect the existing page structure, styles, and reusable components. Do not redesign unrelated sections or introduce a new visual system.

2. **Validate every required booking field.** The inquiry form must reject missing required values and malformed email addresses. The end date must not precede the start date. Display a useful error beside the relevant field.

3. **Make the form accessible.** Every input must have a programmatically associated label. Errors must be identifiable without relying on colour alone, and all fields must be usable with a keyboard.

4. **Verify changes before declaring them complete.** Add or update tests for valid submission, missing fields, invalid email, and invalid travel dates. Run the available tests and report their actual results. Never claim a test passed if it was not run.

5. **Keep changes focused.** Do not add dependencies or modify unrelated files unless there is a clear reason. Explain any necessary deviation before making it.

6. **Respect the existing stack.** Inspect the project's package configuration and follow its current framework, styling conventions, and test setup instead of assuming a particular library.