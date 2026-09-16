// CanvasRoot — mounts the single fixed <Canvas> that sits behind the entire page.
// Responsibilities:
//   - Configure renderer (DPR cap, antialias, alpha)
//   - Set up camera and default lighting
//   - Render SceneManager and Effects as children
//   - Pause rendering when tab is hidden (frameloop="never")
//   - On mobile (<768px) or prefers-reduced-motion: skip heavy 3D, show gradient fallback
// TODO: implement
