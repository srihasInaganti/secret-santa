import {SnowForeground, SnowBackground} from "../components/Snow.jsx";
import "../components/NavBar.css";

export default function HomePage() {
  return (
    <>
      {/*Snow Effects*/}
      <SnowForeground />
      <SnowBackground />

      <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <h1 style={{
          fontSize: "42px",
          fontWeight: "700",
          textDecoration: "underline",
          color: "white",
          fontFamily: "'Mountains of Christmas', cursive"
        }}>
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
            <button className="btn-primary">Create a new Group</button>
            <button className="btn-primary">Log into your Group</button>
          </div>

          <img src="/tree.png" alt="tree" style={{ height: "200px" }} />
        </div>
      </div>
    </>
  );
}