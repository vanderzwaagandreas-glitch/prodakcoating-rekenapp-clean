export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#020617",
      color: "white",
      padding: "40px",
      fontFamily: "Arial"
    }}>
      <h1>CoolShield Rekenapp</h1>

      <div style={{
        background: "#0f172a",
        padding: "20px",
        borderRadius: "20px",
        marginTop: "20px"
      }}>
        <h2>Geen sloopwerk</h2>
        <p>Bestaande dakbedekking blijft liggen</p>
      </div>

      <div style={{
        background: "#0f172a",
        padding: "20px",
        borderRadius: "20px",
        marginTop: "20px"
      }}>
        <h2>Witte variant</h2>
        <p>Cool Roof Tech · TSR 91% · SRI 115%</p>
      </div>
    </div>
  );
}
