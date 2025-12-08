import { useNavigate } from 'react-router-dom';
import {SnowForeground, SnowBackground} from "../components/Snow.jsx";

export default function HomePage() {
  var navigate = useNavigate();

  function goToCreateGroup() {
    navigate('/create');
  }

  function goToLogin() {
    navigate('/login');
  }

  return (
    <>
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
            <button className="btn-primary" onClick={goToCreateGroup}>Create a new Group</button>
            <button className="btn-primary" onClick={goToLogin}>Log into your Group</button>
          </div>

          <img src="/tree.png" alt="tree" style={{ height: "200px" }} />
        </div>
      </div>
      {/*Snow Effects*/}
      <SnowForeground />
      <SnowBackground />
    </>
  );
}