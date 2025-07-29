"use client";
import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderIcon, FileIcon, UploadIcon } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

interface S3File {
  Key: string;
  Size: number;
  LastModified: string;
}

interface FileExplorerProps {
  initialPrefix?: string;
}

export default function FileExplorer({
  initialPrefix = "",
}: FileExplorerProps) {
  const [prefix, setPrefix] = useState(initialPrefix);
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchObjects(prefix);
    setBreadcrumbs(prefix ? prefix.split("/").filter(Boolean) : []);
  }, [prefix]);

  async function fetchObjects(currentPrefix: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/objects?prefix=${encodeURIComponent(
          currentPrefix
        )}`
      );
      if (!res.ok) throw new Error("Failed to fetch objects");
      const data = await res.json();
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFolderClick(folder: string) {
    setPrefix(folder);
  }

  function handleBreadcrumbClick(idx: number) {
    const newPrefix = breadcrumbs.slice(0, idx + 1).join("/") + "/";
    setPrefix(newPrefix);
  }

  function handleRootClick() {
    setPrefix("");
  }

  function handleUploadClick(targetKey: string) {
    setUploadTarget(targetKey);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const filesInput = e.target.files;
    if (!filesInput || filesInput.length === 0 || uploadTarget === null) return;
    setLoading(true);
    setError(null);
    try {
      for (let i = 0; i < filesInput.length; i++) {
        let key = uploadTarget;
        if (key === "" || key.endsWith("/")) {
          key = key + filesInput[i].name;
        }
        const res = await fetch(
          `${API_BASE_URL}/api/upload?key=${encodeURIComponent(key)}`,
          { method: "POST" }
        );
        if (!res.ok) throw new Error("Failed to get upload URL");
        const { url } = await res.json();
        const putRes = await fetch(url, {
          method: "PUT",
          body: filesInput[i],
          headers: { "Content-Type": filesInput[i].type },
        });
        if (!putRes.ok) throw new Error("Failed to upload file to S3");
      }
      fetchObjects(prefix);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setLoading(false);
      setUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }


  async function handleDelete(key: string) {
    if (!confirm(`Are you sure you want to delete "${key}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/delete?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete object");
      await fetchObjects(prefix);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFolder(name: string) {
    const fullPath = prefix + name + "/";
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/create-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName: fullPath }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      await fetchObjects(prefix);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div
      className={cn(
        "max-w-3xl mx-auto p-6 bg-card rounded-xl shadow-xl mt-8 border border-border",
        loading && "opacity-60 pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRootClick}
            className={cn("px-2", !prefix && "font-bold text-primary")}
          >
            Root
          </Button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className="text-gray-300">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBreadcrumbClick(idx)}
                className={cn(
                  "px-2",
                  idx === breadcrumbs.length - 1 && "font-bold text-primary"
                )}
              >
                {crumb}
              </Button>
            </React.Fragment>
          ))}
        </nav>
        <div className="flex gap-2">
          {prefix !== "" && (
            <>
              <Button
                onClick={() =>
                  handleUploadClick(prefix.endsWith("/") ? prefix : prefix + "/")
                }
                variant="default"
                size="sm"
                className="gap-1"
              >
                <UploadIcon className="w-4 h-4" /> Upload to Current
              </Button>
              <Button
                onClick={() => {
                  const name = window.prompt("Enter new folder name:");
                  if (name) handleCreateFolder(name);
                }}
                variant="secondary"
                size="sm"
                className="gap-1"
              >
                + Create Folder in Current
              </Button>
            </>
          )}
          {prefix === "" && (
            <>
              <Button
                onClick={() => handleUploadClick("")}
                variant="default"
                size="sm"
                className="gap-1"
              >
                <UploadIcon className="w-4 h-4" /> Upload to Root
              </Button>
              <Button
                onClick={() => {
                  const name = window.prompt("Enter new folder name:");
                  if (name) handleCreateFolder(name);
                }}
                variant="secondary"
                size="sm"
                className="gap-1"
              >
                + Create Folder in Root
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
      {error && <div className="text-red-500 mb-2 font-medium">{error}</div>}
      <div className="rounded-lg overflow-hidden border bg-muted divide-y">
        {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">
            Loading...
          </div>
        ) : (
          <>
            {folders.length === 0 && files.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No files or folders
              </div>
            )}
            {folders.map((folder) => (
              <div
                key={folder}
                className="p-4 flex items-center hover:bg-accent/50 group transition-colors cursor-pointer"
                tabIndex={0}
                role="button"
                onClick={() => handleFolderClick(folder)}
              >
                <FolderIcon className="w-5 h-5 mr-3 text-blue-500" />
                <span className="flex-1 font-medium text-blue-700 group-hover:underline">
                  {folder.replace(prefix, "")}
                </span>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick(
                      folder.endsWith("/") ? folder : folder + "/"
                    );
                  }}
                  variant="secondary"
                  size="sm"
                  className="gap-1 opacity-0 group-hover:opacity-100 transition"
                  title="Upload to this folder"
                >
                  <UploadIcon className="w-4 h-4" /> Upload
                </Button>
                <Button
                  onClick={() => handleDelete(folder)}
                  variant="destructive"
                  size="sm"
                  className="gap-1 opacity-0 group-hover:opacity-100 transition ml-2"
                  title="Delete this folder"
                >
                  🗑 Delete
                </Button>
              </div>
            ))}
            {files.map((file) => (
              <div
                key={file.Key}
                className="p-4 flex items-center hover:bg-accent/30 group transition-colors"
              >
                <FileIcon className="w-5 h-5 mr-3 text-gray-500" />
                <span className="flex-1 truncate">
                  {file.Key.replace(prefix, "")}
                </span>
                <span className="ml-4 text-xs text-muted-foreground">
                  {(file.Size / 1024).toFixed(1)} KB
                </span>
                <span className="ml-4 text-xs text-muted-foreground">
                  {file.LastModified &&
                    new Date(file.LastModified).toLocaleString()}
                </span>
                <Button
                  onClick={() => handleUploadClick(file.Key)}
                  variant="secondary"
                  size="sm"
                  className="gap-1 opacity-0 group-hover:opacity-100 transition ml-2"
                  title="Upload to this file"
                >
                  <UploadIcon className="w-4 h-4" /> Upload
                </Button>
                <Button
                  onClick={() => handleDelete(file.Key)}
                  variant="destructive"
                  size="sm"
                  className="gap-1 opacity-0 group-hover:opacity-100 transition ml-2"
                  title="Delete this file"
                >
                  🗑 Delete
                </Button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
