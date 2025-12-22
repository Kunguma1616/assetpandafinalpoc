import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Upload as UploadIcon, Hammer, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Tools from "./Tools";

const TRADE_CATEGORIES = [
  "Damp & Mould", "Drains & Blockages", "Electricians", "Fire Safety",
  "Heating & Hot Water", "Leak Detection", "Plumbing & Cold Water", "Roofing",
  "Air Conditioning & Refrigeration", "Carpentry", "Doors, Windows & Locks",
  "Fencing, Decking & Cladding", "Flooring", "Gardening", "Handyman & Odd Jobs",
  "Painting & Decorating", "Paths & Patios", "Pest Control", "Plastering & Tiling",
  "Refurbishment", "Rubbish Removal", "Sanitising & Hygiene", "Ventilation",
  "Walls & Ceilings",
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;
  const { toast } = useToast();

  const [engineerName, setEngineerName] = useState("");
  const [engineerCategory, setEngineerCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Redirect if NOT logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleReset = () => {
    setEngineerName("");
    setEngineerCategory("");
    setSelectedImage(null);
    setPreviewUrl("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!engineerName.trim() || !engineerCategory || !selectedImage || !userId) {
      toast({ title: "Missing Info", description: "Please fill all fields and select an image.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);

      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        const [, imageData] = base64Image.split(",");

        const { data: analysisData, error: analysisError } = await supabase.functions.invoke("analyze-asset", {
          body: {
            engineerName: engineerName.trim(),
            engineerCategory,
            imageBase64: imageData,
            mimeType: selectedImage.type,
          },
        });

        if (analysisError) {
          toast({ title: "Analysis Failed", description: analysisError.message, variant: "destructive" });
          setIsAnalyzing(false);
          return;
        }

        const assetTag = `ASSET-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const { error: insertError } = await supabase.from("assets").insert({
          user_id: userId,
          asset_tag: assetTag,
          asset_name: analysisData.AssetName || "Unknown Asset",
          manufacturer: analysisData.Manufacturer,
          model_number: analysisData.ModelNumber,
          category: engineerCategory,
          trade_category: engineerCategory,
          condition: analysisData.Condition?.toLowerCase() || "unknown",
          category_match_confidence: analysisData.CategoryMatchConfidence,
          visual_description: analysisData.VisualDescription,
          image_urls: [base64Image],
        });

        if (insertError) {
          toast({ title: "Database Error", description: "Failed to save asset details.", variant: "destructive" });
          setIsAnalyzing(false);
          return;
        }

        toast({ title: "Success!", description: "Asset analyzed and saved." });
        navigate("/dashboard");
      };
    } catch (error) {
      toast({ title: "Error", description: "Unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* PAGE TITLE */}
      <div>
        <h1 className="text-3xl font-bold">Asset Registration</h1>
        <p className="text-muted-foreground mt-1">Upload and analyze assets using AI.</p>
      </div>

      {/* ENGINEER FORM */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle>Engineer Information</CardTitle>
          <CardDescription>Provide your details for accurate asset categorization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>Engineer Name</Label>
              <Input
                placeholder="Enter your full name"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2">
              <Label>Trade Category</Label>
              <Select value={engineerCategory} onValueChange={setEngineerCategory} disabled={isAnalyzing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your trade" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* IMAGE UPLOAD */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle>Asset Image Upload</CardTitle>
          <CardDescription>Upload a clear asset photo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="border-2 border-dashed p-8 text-center rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
            <input 
              type="file" 
              id="image-upload" 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
              disabled={isAnalyzing}
            />
            <label htmlFor="image-upload" className="cursor-pointer">

              {previewUrl ? (
                <div className="space-y-4">
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                  <p className="text-sm text-muted-foreground">Click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>
              )}

            </label>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !engineerName || !engineerCategory || !selectedImage}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Hammer className="mr-2 h-4 w-4" />
                  Analyze & Register
                </>
              )}
            </Button>

            {selectedImage && (
              <Button variant="outline" onClick={handleReset} disabled={isAnalyzing}>
                Reset
              </Button>
            )}
          </div>

        </CardContent>
      </Card>

    </div>
  );
};

export default Index;