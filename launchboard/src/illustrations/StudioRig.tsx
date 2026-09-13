export function StudioRig() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[-400, 800, 600]} intensity={1.6} />
      <directionalLight position={[600, 200, 400]} intensity={0.35} />
    </>
  );
}
