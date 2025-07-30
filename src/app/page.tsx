import Navbar from "@/components/Navbar";
import FileExplorer from "@/components/FileExplorer";

export default function Home() {
  return (
    <div className="min-h-scree">
      <Navbar />
      <main className="pt-4">
        <FileExplorer />
      </main>
    </div>
  );
}
