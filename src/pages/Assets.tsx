import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Search, Upload, LayoutDashboard, FileDown, Trash2 } from "lucide-react";
import heroWarehouse from "@/assets/hero-warehouse.jpg";

interface Asset {
  id: number;
  engineer_name: string;
  engineer_category: string;
  asset_name: string;
  manufacturer?: string;
  model_number?: string;
  condition?: string;
  visual_description?: string;
  category?: string;
  image_base64: string;
  uploaded_at: string;
}

const Assets = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // -----------------------------------------------
  // FETCH ASSETS
  // -----------------------------------------------
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await fetch("http://localhost:5000/assets");
      const data = await res.json();
      console.log("✅ Loaded assets:", data);
      
      // Check for duplicate IDs and warn
      const ids = data.map((a: Asset) => a.id);
      const duplicates = ids.filter((id: number, index: number) => ids.indexOf(id) !== index);
      if (duplicates.length > 0) {
        console.warn("⚠️ WARNING: Duplicate asset IDs detected:", duplicates);
        console.warn("This will cause React key errors. Please fix your database!");
      }
      
      setAssets(data);
      setFilteredAssets(data);
    } catch (err) {
      console.error("❌ Failed to load assets:", err);
    }
    setLoading(false);
  };

  // -----------------------------------------------
  // SEARCH FILTER
  // -----------------------------------------------
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = assets.filter((a) => {
      const name = a.asset_name?.toLowerCase() || "";
      const engineer = a.engineer_name?.toLowerCase() || "";
      const model = a.model_number?.toLowerCase() || "";
      const manufacturer = a.manufacturer?.toLowerCase() || "";
      const category = a.category?.toLowerCase() || "";
      
      return (
        name.includes(term) ||
        engineer.includes(term) ||
        model.includes(term) ||
        manufacturer.includes(term) ||
        category.includes(term)
      );
    });
    setFilteredAssets(filtered);
  }, [searchTerm, assets]);

  // -----------------------------------------------
  // DELETE ASSET
  // -----------------------------------------------
  const deleteAsset = async (id: number) => {
    if (!confirm("Delete this asset?")) return;
    
    try {
      await fetch(`http://localhost:5000/assets/${id}`, { method: "DELETE" });
      loadAssets();
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  // -----------------------------------------------
  // VIEW ASSET DETAIL
  // -----------------------------------------------
  const viewAssetDetail = (id: number) => {
    console.log("🔍 Attempting to view asset:", id);
    
    const asset = assets.find(a => a.id === id);
    if (asset) {
      alert(`Asset Details:\n\nName: ${asset.asset_name}\nManufacturer: ${asset.manufacturer || 'N/A'}\nModel: ${asset.model_number || 'N/A'}\nCondition: ${asset.condition || 'N/A'}\nCategory: ${asset.category || 'N/A'}\nEngineer: ${asset.engineer_name}\nTeam: ${asset.engineer_category}\n\nDescription: ${asset.visual_description || 'N/A'}`);
    }
    
    // UNCOMMENT when route is created:
    // navigate(`/assets/${id}`);
  };

  // -----------------------------------------------
  // CONDITION BADGE COLOR
  // -----------------------------------------------
  const getConditionColor = (condition?: string) => {
    if (!condition) return "bg-gray-500";
    const c = condition.toLowerCase();
    if (c === "excellent") return "bg-green-500";
    if (c === "good") return "bg-blue-500";
    if (c === "fair") return "bg-yellow-500";
    if (c === "poor") return "bg-red-500";
    return "bg-gray-500";
  };

  // -----------------------------------------------
  // PDF GENERATION - FIXED FOR LARGE PAYLOADS
  // -----------------------------------------------
  const generatePDF = async () => {
    const assetsToReport = filteredAssets;

    if (assetsToReport.length === 0) {
      alert("No assets available in the current search results to report.");
      return;
    }

    setPdfGenerating(true);

    try {
      // Option 1: Send asset IDs only (recommended)
      // Backend fetches images from database
      const payload = {
        engineer_name: assetsToReport[0].engineer_name,
        engineer_category: assetsToReport[0].engineer_category,
        asset_ids: assetsToReport.map(a => a.id)
      };

      const res = await fetch("http://localhost:5000/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("Request too large. Try generating report with fewer assets or use the alternative method below.");
        }
        throw new Error(`PDF generation failed: ${res.status} ${res.statusText}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${assetsToReport[0].engineer_name}_Asset_Report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert("PDF generated successfully!");
    } catch (err) {
      console.error("❌ PDF generation error:", err);
      
      // If still getting 413 error, try alternative method
      if (err instanceof Error && err.message.includes("413")) {
        const tryAlternative = confirm(
          "The report is too large to generate all at once.\n\n" +
          "Would you like to try an alternative method?\n" +
          "- Split into smaller batches\n" +
          "- Reduce image quality\n" +
          "- Select fewer assets"
        );
        
        if (tryAlternative) {
          await generatePDFAlternative(assetsToReport);
        }
      } else {
        alert(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setPdfGenerating(false);
    }
  };

  // -----------------------------------------------
  // ALTERNATIVE: Generate PDF with compressed images
  // -----------------------------------------------
  const generatePDFAlternative = async (assetsToReport: Asset[]) => {
    try {
      // Send request without images, let backend fetch from DB
      const formData = new FormData();
      formData.append("engineer_name", assetsToReport[0].engineer_name);
      formData.append("engineer_category", assetsToReport[0].engineer_category);
      
      // Just send metadata and IDs
      const payload = assetsToReport.map((a) => ({
        id: a.id,
        filename: a.asset_name,
        metadata: {
          Manufacturer: a.manufacturer,
          Model: a.model_number,
          Condition: a.condition,
          Category: a.category,
          Description: a.visual_description,
        },
      }));
      
      formData.append("assets_json", JSON.stringify(payload));

      const res = await fetch("http://localhost:5000/generate-pdf-lite", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Alternative PDF generation failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${assetsToReport[0].engineer_name}_Asset_Report_Compressed.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert("Compressed PDF generated successfully!");
    } catch (err) {
      console.error("❌ Alternative PDF generation error:", err);
      alert("Failed to generate compressed PDF. Try selecting fewer assets.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading assets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden">
        <img
          src={heroWarehouse}
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          alt="Warehouse"
        />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-xl border border-white/20">
                <img src="/aspectlogo.jpeg" className="w-full h-full object-contain p-1" alt="Logo" />
              </div>
              <div>
                <h1 className="text-3xl text-white font-bold">Assets Inventory</h1>
                <p className="text-white/80">{assets.length} total assets</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/dashboard")} className="bg-white/10 text-white hover:bg-white/20">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              <Button onClick={() => navigate("/upload")} className="bg-white text-blue-600 hover:bg-white/90">
                <Upload className="mr-2 h-4 w-4" /> Upload Asset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-8">
        {/* SEARCH & PDF */}
        <div className="mb-6 flex gap-4 items-center justify-between">
          <div className="flex gap-2 items-center max-w-md flex-1">
            <Search className="text-gray-400" />
            <Input
              placeholder="Search by name, model, manufacturer, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={generatePDF}
            disabled={filteredAssets.length === 0 || pdfGenerating}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {pdfGenerating ? "Generating..." : `Download PDF Report (${filteredAssets.length})`}
          </Button>
        </div>

        {/* ASSET GRID */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-xl">No assets found matching your search criteria.</p>
            <Button onClick={() => navigate("/upload")} className="mt-4">
              Upload New Asset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <Card 
                key={`asset-${asset.id}-${asset.uploaded_at}`}
                className="shadow-md hover:shadow-xl transition-all cursor-pointer"
                onClick={() => viewAssetDetail(asset.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{asset.asset_name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        deleteAsset(asset.id);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {asset.condition && (
                    <Badge className={`${getConditionColor(asset.condition)} text-white w-fit`}>
                      {asset.condition}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* IMAGE */}
                  {asset.image_base64 ? (
                    <img
                      src={`data:image/jpeg;base64,${asset.image_base64}`}
                      className="w-full h-48 object-cover rounded-lg border"
                      alt={asset.asset_name}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}

                  {/* METADATA */}
                  <div className="text-sm space-y-1.5 border-t pt-3">
                    {asset.manufacturer && (
                      <p>
                        <strong className="text-gray-600">Manufacturer:</strong> {asset.manufacturer}
                      </p>
                    )}
                    {asset.model_number && (
                      <p>
                        <strong className="text-gray-600">Model:</strong> {asset.model_number}
                      </p>
                    )}
                    {asset.category && (
                      <p>
                        <strong className="text-gray-600">Category:</strong> {asset.category}
                      </p>
                    )}
                    <p>
                      <strong className="text-gray-600">Engineer:</strong> {asset.engineer_name}
                    </p>
                    <p>
                      <strong className="text-gray-600">Team:</strong> {asset.engineer_category}
                    </p>
                  </div>

                  {/* VISUAL DESCRIPTION */}
                  {asset.visual_description && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Description:</p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {asset.visual_description}
                      </p>
                    </div>
                  )}

                  {/* UPLOAD DATE */}
                  <p className="text-xs text-gray-400 border-t pt-2">
                    Added: {new Date(asset.uploaded_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assets;