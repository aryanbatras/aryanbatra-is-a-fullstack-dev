import Projects from "@/components/projects";
export default function Two() {
  return <>
  {/* <Projects/> */}
  <button style={{
    backgroundColor: 'blue',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '10px 10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  }} onClick={() => console.log("Enter Camera")}>Enter Camera</button>
  <button style={{
    backgroundColor: 'green',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '10px 10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  }} onClick={() => console.log("Disable Camera")}>Disable Camera</button>
  </>;
}
