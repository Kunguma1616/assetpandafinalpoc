import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { toast } from 'sonner';
import {
  Upload as UploadIcon,
  Loader2,
  LogOut,
  LayoutDashboard
} from 'lucide-react';

import heroWarehouse from '@/assets/hero-warehouse.jpg';

const TRADE_CATEGORIES = [
  'Electricians', 'Plumbing', 'HVAC', 'Carpentry', 'Painting', 'Welding',
  'Masonry', 'Roofing', 'Flooring', 'Landscaping', 'Equipment Operators',
  'General Maintenance', 'IT/Technology', 'Automotive', 'Manufacturing',
  'Warehouse', 'Construction', 'Safety Equipment', 'Medical Equipment',
  'Laboratory Equipment', 'Office Equipment', 'Facility Management',
  'Energy/Utilities', 'Transportation'
];

const Upload = () => {
  const navigate = useNavigate();

  const [engineerName, setEngineerName] = useState('');
  const [engineerCategory, setEngineerCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // =======================
  // IMAGE SELECT
  // =======================
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be less than 20MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // =======================
  // ANALYZE & SAVE (FLASK ONLY)
  // =======================
  const handleAnalyze = async () => {
    if (!engineerName.trim() || !engineerCategory || !imageFile) {
      toast.error('Please fill all fields and select an image');
      return;
    }

    setLoading(true);

    try {
      // Prepare form data for Flask
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('engineer_name', engineerName);
      formData.append('engineer_category', engineerCategory);

      // Send to Flask
      const response = await fetch('http://localhost:5000/upload-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to analyze or save asset.');
        console.error(result);
        setLoading(false);
        return;
      }

      toast.success('Asset analyzed & saved successfully!');
      setLoading(false);

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error occurred.');
      setLoading(false);
    }
  };

  // =======================
  // FAKE SIGN OUT (NO SUPABASE AUTH)
  // =======================
  const handleSignOut = async () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <div className="relative h-64 bg-gradient-primary overflow-hidden">
        <img src={heroWarehouse} className="absolute inset-0 w-full h-full object-cover opacity-30" />

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <img src="/aspectlogo.jpeg" className="h-10 w-auto" />
              </div>

              <h1 className="text-3xl font-bold text-primary-foreground">
                Asset Management System
              </h1>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>

              <Button
                variant="outline"
                onClick={handleSignOut}
                className="bg-white/10 text-primary-foreground border-white/20 hover:bg-white/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          <p className="text-lg text-primary-foreground/90">
            AI-powered asset identification and tracking
          </p>
        </div>
      </div>

      {/* BODY */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto shadow-medium">
          <CardHeader>
            <CardTitle>Upload Asset Image</CardTitle>
            <CardDescription>
              Upload an image of your asset and our AI will automatically identify it
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Engineer Name */}
            <div className="space-y-2">
              <Label htmlFor="engineer-name">Engineer Name</Label>
              <Input
                id="engineer-name"
                placeholder="Enter your name"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="trade-category">Trade Category</Label>
              <Select
                value={engineerCategory}
                onValueChange={setEngineerCategory}
                disabled={loading}
              >
                <SelectTrigger id="trade-category">
                  <SelectValue placeholder="Select your trade category" />
                </SelectTrigger>

                <SelectContent>
                  {TRADE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Asset Image</Label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded"
                  />
                ) : (
                  <div className="space-y-2">
                    <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload image (Max 20MB)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleAnalyze}
              className="w-full"
              size="lg"
              disabled={loading || !engineerName || !engineerCategory || !imageFile}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Asset...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-5 w-5" />
                  Analyze & Register Asset
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
