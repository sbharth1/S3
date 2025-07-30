"use client";
import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderIcon, FileIcon, UploadIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderNotEmptyDialog, setShowFolderNotEmptyDialog] =
    useState(false);

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

  async function confirmDelete(key: string) {
    if (!itemToDelete) return;
    setLoading(true);
    try {
      if (key.endsWith("/")) {
        const res = await fetch(
          `${API_BASE_URL}/api/objects?prefix=${encodeURIComponent(key)}`
        );
        if (!res.ok) throw new Error("Failed to check folder contents");
        const data = await res.json();
        const hasFiles =
          (data.files?.length || 0) > 0 || (data.folders?.length || 0) > 0;
        if (hasFiles) {
          setItemToDelete(null);
          setShowDeleteDialog(false);
          setShowFolderNotEmptyDialog(true);
          return;
        }
      }
      const deleteRes = await fetch(
        `${API_BASE_URL}/api/delete?key=${encodeURIComponent(key)}`,
        { method: "DELETE" }
      );
      if (!deleteRes.ok) throw new Error("Failed to delete object");
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
        "w-full h-[calc(90vh-64px)] mx-auto p-6 bg-card rounded-xl shadow-xl mt-8 border border-border container",
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          {prefix !== "" && (
            <>
              <Button
                onClick={() =>
                  handleUploadClick(
                    prefix.endsWith("/") ? prefix : prefix + "/"
                  )
                }
                variant="default"
                size="sm"
                className="gap-1 w-full sm:w-auto"
              >
                <UploadIcon className="w-4 h-4" /> Upload to Current
              </Button>
              <Button
                onClick={() => setShowCreateFolderDialog(true)}
                variant="secondary"
                size="sm"
                className="gap-1 w-full sm:w-auto"
              >
                + Create Folder in {prefix === "" ? "Root" : "Current"}
              </Button>
            </>
          )}
          {prefix === "" && (
            <>
              <Button
                onClick={() => handleUploadClick("")}
                variant="default"
                size="sm"
                className="gap-1 w-full sm:w-auto"
              >
                <UploadIcon className="w-4 h-4" /> Upload to Root
              </Button>
              <Button
                onClick={() => setShowCreateFolderDialog(true)}
                variant="secondary"
                size="sm"
                className="gap-1 w-full sm:w-auto"
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
            {!loading && folders.length === 0 && files.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No files or folders
              </div>
            )}

            {folders.length > 0 &&
              folders.map((folder) => (
                <div
                  key={folder}
                  className="p-4 flex items-center hover:bg-accent/50 group transition-colors cursor-pointer"
                  tabIndex={0}
                  role="button"
                  onClick={() => handleFolderClick(folder)}
                >
                  <FolderIcon className="w-5 h-5 mr-3 text-light-500" />
                  <span className="flex-1 font-medium text-light-700 group-hover:underline">
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
                    className="gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
                    title="Upload to this folder"
                  >
                    <UploadIcon className="w-4 h-4" /> Upload
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(folder);
                      setShowDeleteDialog(true);
                    }}
                    variant="destructive"
                    size="sm"
                    className="gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition ml-2"
                    title="Delete this folder"
                  >
                    🗑 Delete
                  </Button>
                </div>
              ))}
            {files.length > 0 &&
              files.map((file) => (
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
                    onClick={() => {
                      setItemToDelete(file.Key);
                      setShowDeleteDialog(true);
                    }}
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

      {/* empty folder dialog */}
      <AlertDialog
        open={showFolderNotEmptyDialog}
        onOpenChange={setShowFolderNotEmptyDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Folder Not Empty</AlertDialogTitle>
            <AlertDialogDescription>
              This folder contains files or other folders. Please delete them
              first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowFolderNotEmptyDialog(false)}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog  */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{itemToDelete}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) confirmDelete(itemToDelete);
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog  */}
      <Dialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
      >
        <DialogContent className="sm:max-w-md w-[90vw]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. documents"
            />
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setNewFolderName("");
                  setShowCreateFolderDialog(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="w-full sm:w-auto"
              onClick={async () => {
                if (newFolderName.trim()) {
                  await handleCreateFolder(newFolderName.trim());
                  setNewFolderName("");
                  setShowCreateFolderDialog(false);
                }
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
