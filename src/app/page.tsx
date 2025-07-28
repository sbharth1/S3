import Navbar from "@/components/nav";
import FileExplorer from "@/components/FileExplorer";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-4">
        <FileExplorer />
      </main>
    </div>
  );
}
