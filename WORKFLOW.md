### Round 1 - Vague 
Improve the scroll animation in Parisia.

### Round 2 - Spec-driven 
Inspect the existing Parisia repository before editing. Find the files responsible for scroll-driven canvas frame rendering and understand how scroll progress is mapped to frames. Propose a short plan before coding.

Improve or refactor only the scroll-progress-to-frame-index calculation. Preserve the existing visual design, animation timing, responsive behaviour, and current project conventions. Handle the start and end of the scroll range, intermediate progress, and invalid or out-of-range values explicitly. Avoid unnecessary dependencies and unrelated changes.

Write tests for the first frame, last frame, an intermediate position, boundary values, and invalid inputs where applicable. Run the existing build and lint checks, plus the new tests. Review the Git diff and report the actual results. Do not claim tests passed unless you ran them. If the current implementation already handles these cases correctly, explain that before proposing changes.

### Project specific AI mistake
The README describes Parisia as using vanilla JavaScript, while its package.json declares React and TypeScript-related tooling. That discrepancy is a real reason to inspect the source before trusting project documentation. Documentation inconsistency detected.