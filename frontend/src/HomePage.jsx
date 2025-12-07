export default function HomePage({ onCreateGroup }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >

      <h1 style={{ fontSize: "42px", fontWeight: "700", textDecoration: "underline" }}>
        Good Deed Secret Santa
      </h1>

      <div style={{
        display: "flex",
        gap: "60px",
        marginTop: "60px",
        alignItems: "center"
      }}>
        <img src="/tree.png" alt="tree" style={{ height: "200px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <button 
            style={btn} 
            onClick={() => {
              console.log("BUTTON WAS CLICKED!");
              console.log("onCreateGroup function:", onCreateGroup);
              if (onCreateGroup) {
                onCreateGroup();
              } else {
                console.log("onCreateGroup is undefined!");
              }
            }}
          >
            Create a new Group
          </button>
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