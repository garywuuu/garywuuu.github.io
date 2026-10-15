# Handwired cats

The Play page uses [Handwired](https://github.com/chenglou/handwired) to choose
the cats' moods, targets, mood durations, movement speeds, and swatting paw.
The existing Three.js code supplies available playmates and toys, resolves
the selected target to a scene object, and animates the result. Petting still
interrupts autonomous behavior immediately.

This is a fixed-weight arithmetic network, without training or server calls.
It runs on the CPU when a mood expires, not every animation frame. Rendering,
collision handling, and the dragons continue to use their existing code.

`brain.ts` builds a circuit of weighted sums, ReGLU gates, and exact comparisons.
The first eligible behavior wins. A roll is quantized down to 1/65,536 so the
comparison inputs are exactly representable in FP32. This preserves the
existing behavior probabilities to within one such step; durations and speeds
use FP32 arithmetic. When objects are missing, the same fallback priorities apply.

The two files in `vendor/handwired/` are unmodified upstream runtime sources,
pinned to commit `4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (MIT license included).
The generated browser module is checked in, so GitHub Pages needs no build step
and visitors make no additional third-party request to load Handwired.

```sh
cd cat-brain
npm ci
npm run build
npm test
```

Deploy only the feature changes. The repository may contain unrelated,
unpublished domain-migration edits; those are not part of this integration.
