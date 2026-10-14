export function SocialPreviewCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#111111",
        color: "#f2f0e8",
        padding: "72px 84px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          color: "#c7f464",
          fontSize: 28,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            backgroundColor: "#c7f464",
          }}
        />
        Amiracle
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            color: "#c7f464",
            fontSize: 20,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Developer portfolio
        </div>
        <div style={{ fontSize: 68, lineHeight: 1.1, fontWeight: 700 }}>
          Projects, experience, and skills.
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: 2,
          backgroundColor: "#c7f464",
        }}
      />
    </div>
  );
}
