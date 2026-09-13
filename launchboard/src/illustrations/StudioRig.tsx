export function StudioRig() {
  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[-400, 800, 600]} intensity={3.4} />
      <directionalLight position={[600, 200, 400]} intensity={0.9} />
    </>
  );
}
