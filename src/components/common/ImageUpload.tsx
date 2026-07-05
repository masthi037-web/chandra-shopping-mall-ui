"use client";

import imageCompression from 'browser-image-compression';
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, UploadCloud, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/components/providers/TenantContext";

interface ImageUploadProps {
    value?: string;
    onChange: (value: string | null) => void;
    disabled?: boolean;
    label?: string | React.ReactNode;
    className?: string;
    companyDomain: string; // Changed from companyId
    maxFiles?: number;
    accept?: string;
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    label = "Upload Media",
    className,
    companyDomain, // Changed from companyId
    maxFiles = 3,
    accept = "image/*"
}: ImageUploadProps) {
    const [filePaths, setFilePaths] = useState<string[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { maxImageSizeMB = 2 } = useTenant();

    // Utility to check if a URL or file is a video
    const isVideo = (url: string) => {
        return /\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes('video');
    };

    // Parse initial value
    useEffect(() => {
        if (value) {
            const paths = value.split("&&&").filter(Boolean);
            setFilePaths(paths);

            const formattedPreviews = paths.map(path => {
                if (path.startsWith('http') || path.startsWith('blob:')) return path;
                const cleanPath = path.startsWith('/') ? path.slice(1) : path;
                return `https://api.manabuy.in/${cleanPath}`;
            });
            setPreviews(formattedPreviews);
        } else {
            setFilePaths([]);
            setPreviews([]);
        }
    }, [value]);


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!companyDomain) {
            toast({ title: "Error", description: "Company Domain is missing", variant: "destructive" });
            return;
        }

        if (filePaths.length >= maxFiles) {
            toast({ title: "Limit Reached", description: `You can only upload up to ${maxFiles} items.`, variant: "destructive" });
            return;
        }

        const isFileVideo = file.type.startsWith('video/');

        // local preview
        const objectUrl = URL.createObjectURL(file);

        // Optimistically update preview BUT NOT filePaths yet
        const newPreviews = [...previews, objectUrl];
        setPreviews(newPreviews);
        setIsUploading(true);

        try {
            let fileToUpload = file;

            // Only compress if it's an image and exceeds limit
            if (!isFileVideo && file.size > maxImageSizeMB * 1024 * 1024) {
                console.log(`Original Image Size: ${(file.size / 1024 / 1024).toFixed(2)} MB - Compressing...`);
                try {
                    const options = {
                        maxSizeMB: 1.9,
                        maxWidthOrHeight: 1200,
                        useWebWorker: true
                    };
                    const compressedFile = await imageCompression(file, options);
                    fileToUpload = compressedFile;
                } catch (error) {
                    console.error("Compression failed, using original", error);
                }
            }

            // 2. Create FormData
            const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            const formData = new FormData();
            formData.append("file", fileToUpload);
            formData.append("domain", companyDomain);
            formData.append("fileName", uniqueFileName);

            // 3. Upload to Backend
            const { url } = await adminService.uploadCompanyImage(formData);

            // 3. Update Parent with concatenated string
            const finalUrl = `https://api.manabuy.in${url}`;

            const newPaths = [...filePaths, finalUrl];
            setFilePaths(newPaths);
            onChange(newPaths.join("&&&"));

            toast({ title: "Success", description: `${isFileVideo ? 'Video' : 'Image'} uploaded successfully` });

        } catch (error) {
            console.error("[ImageUpload] Error:", error);
            toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
            setPreviews(previews);
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const handleRemove = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const newPaths = filePaths.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        setFilePaths(newPaths);
        setPreviews(newPreviews);

        onChange(newPaths.length > 0 ? newPaths.join("&&&") : null);
    };

    const handleClick = () => {
        if (!disabled && !isUploading && inputRef.current && filePaths.length < maxFiles) {
            inputRef.current.click();
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex justify-between items-center">
                <Label>{label}</Label>
                <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-medium text-muted-foreground uppercase tracking-wider">
                    {filePaths.length} / {maxFiles}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Render Previews */}
                {previews.map((previewUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-background group">
                        {isVideo(previewUrl) ? (
                            <video
                                src={previewUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                            />
                        ) : (
                            <Image
                                src={previewUrl}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                                unoptimized={previewUrl.startsWith('blob:')}
                            />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={(e) => handleRemove(e, index)}
                                disabled={disabled || isUploading}
                                type="button"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Upload Button */}
                {filePaths.length < maxFiles && (
                    <div
                        onClick={handleClick}
                        className={cn(
                            "relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/25 transition-all duration-300 hover:bg-secondary/50 hover:border-primary/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden group",
                            (disabled || isUploading) && "opacity-50 cursor-not-allowed hover:bg-transparent hover:scale-100"
                        )}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={disabled || isUploading}
                        />

                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="text-[10px] font-medium text-muted-foreground animate-pulse">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground transition-colors group-hover:text-primary">
                                <Plus className="w-8 h-8 mb-1 transition-transform group-hover:rotate-90 duration-500" />
                                <span className="text-xs font-bold tracking-tight">Add Media</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
