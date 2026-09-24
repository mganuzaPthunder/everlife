/** The front door: the title and a Play button. */
export function HomeScreen({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="home-screen">
      <div className="hero">
        <h1 className="logo">LunaLife</h1>
        <p className="tagline">Live a thousand lives beneath a midnight sunset.</p>
      </div>
      <div className="home-actions">
        <button type="button" className="btn primary big-btn home-play" onClick={onPlay}>▶ Play</button>
      </div>
    </div>
  );
}
