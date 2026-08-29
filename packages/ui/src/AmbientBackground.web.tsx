// Web: real CSS radial-gradient blobs + @keyframes drift, defined in
// app/globals.css — cheaper and smoother than JS-driven animation for a
// continuous ambient loop.
export function AmbientBackground() {
  return (
    <div className="sc-ambient-bg">
      <div className="sc-ambient-blob" style={{ width: 420, height: 420, top: -100, left: -100 }} />
      <div
        className="sc-ambient-blob"
        style={{ width: 360, height: 360, bottom: -60, right: -80, animationDelay: "3s" }}
      />
      <div
        className="sc-ambient-blob"
        style={{ width: 260, height: 260, top: "38%", right: "6%", animationDelay: "6s" }}
      />
    </div>
  );
}
