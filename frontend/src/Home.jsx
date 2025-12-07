export default function Home() {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#efc1c5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}>
        
        {/* Top Right Initials */}
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "#1c531f",
          color: "white",
          padding: "8px 14px",
          borderRadius: "0 0 0 12px",
          fontWeight: "bold"
        }}>
          AS
        </div>
  
        {/* Title */}
        <h1 style={{ fontSize: "42px", fontWeight: "bold", textDecoration: "underline" }}>
          Good Deed Secret Santa
        </h1>
  
        {/* Button Section */}
        <div style={{
          display: "flex",
          gap: "60px",
          marginTop: "60px",
          alignItems: "center"
        }}>
          <img src="/tree.png" alt="tree" style={{ height: "200px" }} />
  
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <button style={btn}>Create a new Group</button>
            <button style={btn}>Log into your Group</button>
          </div>
  
          <img src="/tree.png" alt="tree" style={{ height: "200px" }} />
        </div>
      </div>
    );
  }
  
  const btn = {
    background: "black",
    color: "white",
    padding: "15px 25px",
    borderRadius: "25px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px"
  };
  