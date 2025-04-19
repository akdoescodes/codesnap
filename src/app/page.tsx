"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [htmlCode, setHtmlCode] = useState("");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [isRendering, setIsRendering] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    renderHTML();
  }, [htmlCode]);

  const renderHTML = () => {
    if (iframeRef.current) {
      setIsRendering(true);
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        iframeDocument.body.innerHTML = htmlCode;
        // Apply Bootstrap styles (simplified - consider a proper import)
        const bootstrapLink = document.createElement("link");
        bootstrapLink.rel = "stylesheet";
        bootstrapLink.href = "https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css";
        bootstrapLink.integrity = "sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z";
        bootstrapLink.crossOrigin = "anonymous";
        iframeDocument.head.appendChild(bootstrapLink);
        setIsRendering(false);
      }
    }
  };

  const captureScreenshot = async () => {
    setIsRendering(true);
    try {
      if (!iframeRef.current || !iframeRef.current.contentDocument) {
        throw new Error("Iframe not loaded");
      }

      const iframeContent = iframeRef.current.contentDocument.documentElement;

      if (!iframeContent) {
        throw new Error("No content in iframe");
      }

      // Wait for images to load in the iframe
      const images = iframeContent.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve, reject) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => {
              console.error('Failed to load image:', img.src);
              resolve(false); // Resolve as false to not break Promise.all
            };
          }
        });
      });

      const allImagesLoaded = (await Promise.all(imagePromises)).every(loaded => loaded);

      if (!allImagesLoaded) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Not all images were loaded in the preview. Screenshot might be incomplete.",
        });
      }
      
      const canvas = await html2canvas(iframeContent, {
        width: width,
        height: height,
        scrollX: 0,
        scrollY: 0,
        windowWidth: width,
        windowHeight: height,
        useCORS: true,
        ignoreElements: (element) => {
          // Optionally ignore certain elements
          return false;
        }
      });

      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "code-screenshot.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Screenshot downloaded!",
        description: "Your CodeSnap is ready.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error capturing screenshot",
        description: error.message,
      });
    } finally {
      setIsRendering(false);
    }
  };

  const handlePresetChange = (value: string) => {
    const [newWidth, newHeight] = value.split("x").map(Number);
    setWidth(newWidth);
    setHeight(newHeight);
  };


  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10 bg-secondary">
      <h1 className="text-3xl font-bold mb-4 text-primary">CodeSnap</h1>
      <Card className="w-full max-w-3xl shadow-md rounded-lg p-4">
        <CardHeader>
          <CardTitle>Enter HTML Code</CardTitle>
          <CardDescription>Paste your HTML code and specify dimensions to capture a screenshot.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="html-code">HTML Code</Label>
            <Textarea
              id="html-code"
              className="rounded-md shadow-sm focus-visible:ring-primary"
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="&lt;div class=&quot;container&quot;&gt;&lt;h1&gt;Hello, Bootstrap!&lt;/h1&gt;&lt;/div&gt;"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
              <Label htmlFor="width">Preset Dimensions</Label>
              <Select onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={`${width}x${height}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="390x844">Phone (390x844)</SelectItem>
                  <SelectItem value="414x896">Phone Plus (414x896)</SelectItem>
                  <SelectItem value="375x812">iPhone X (375x812)</SelectItem>
                  <SelectItem value="768x1024">Tablet (768x1024)</SelectItem>
                  <SelectItem value="800x600">Default (800x600)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="width">Width</Label>
              <Input
                type="number"
                id="width"
                className="rounded-md shadow-sm focus-visible:ring-primary"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="height">Height</Label>
              <Input
                type="number"
                id="height"
                className="rounded-md shadow-sm focus-visible:ring-primary"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
          </div>
          <Button
            className="bg-accent text-white rounded-md hover:bg-orange-500 focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed"
            onClick={captureScreenshot}
            disabled={isRendering}
          >
            {isRendering ? "Rendering..." : "Capture Screenshot"}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 w-full max-w-3xl">
        <h2 className="text-xl font-semibold mb-2 text-muted-foreground">Preview</h2>
        <div className="border rounded-md overflow-hidden shadow-md">
          <iframe
            ref={iframeRef}
            style={{ width: `${width}px`, height: `${height}px` }}
            title="Rendered HTML"
            className="bg-white"
          />
        </div>
      </div>
    </div>
  );
}
