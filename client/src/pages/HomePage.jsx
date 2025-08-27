import Navbar from "../components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">Welcome to the LMS</h1>
        <p className="opacity-70 mt-2">You’re logged in. Courses will appear here next.</p>
      </div>
    </>
  );
}
