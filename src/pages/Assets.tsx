import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Search, Upload, LayoutDashboard, FileDown, Trash2, Cloud } from "lucide-react";

interface Asset {
  id: number;
  engineer_name: string;
  engineer_category: string;
  asset_name: string;
  asset_type?: string;
  manufacturer?: string;
  model_number?: string;
  condition?: string;
  visual_description?: string;
  category?: string;
  image_base64: string;
  stored_location?: string;
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
      const res = await fetch("https://aivison-3.onrender.com/assets")
      const data = await res.json();
      console.log("✅ Loaded assets:", data);

      const ids = data.map((a: Asset) => a.id);
      const duplicates = ids.filter((id: number, index: number) => ids.indexOf(id) !== index);
      if (duplicates.length > 0) {
        console.warn("⚠️ WARNING: Duplicate asset IDs detected:", duplicates);
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
      const assetType = a.asset_type?.toLowerCase() || "";
      const engineer = a.engineer_name?.toLowerCase() || "";
      const model = a.model_number?.toLowerCase() || "";
      const manufacturer = a.manufacturer?.toLowerCase() || "";
      const category = a.category?.toLowerCase() || "";

      return (
        name.includes(term) ||
        assetType.includes(term) ||
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
      await fetch(`https://aivison-3.onrender.com/assets/${id}`, { method: "DELETE" });
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

    const asset = assets.find((a) => a.id === id);
    if (asset) {
      alert(
        `Asset Details:\n\nName: ${asset.asset_name}\nAsset Type: ${asset.asset_type || "N/A"}\nManufacturer: ${asset.manufacturer || "N/A"}\nModel: ${asset.model_number || "N/A"}\nCondition: ${asset.condition || "N/A"}\nCategory: ${asset.category || "N/A"}\nUser: ${asset.engineer_name}\nTeam: ${asset.engineer_category}\n\nDescription: ${asset.visual_description || "N/A"}`
      );
    }
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
  // PDF GENERATION
  // -----------------------------------------------
  const generatePDF = async () => {
    const assetsToReport = filteredAssets;

    if (assetsToReport.length === 0) {
      alert("No assets available in the current search results to report.");
      return;
    }

    setPdfGenerating(true);

    try {
      const payload = {
        engineer_name: assetsToReport[0].engineer_name,
        engineer_category: assetsToReport[0].engineer_category,
        asset_ids: assetsToReport.map((a) => a.id),
      };

      const res = await fetch("https://aivison-3.onrender.com/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("Request too large. Try generating report with fewer assets.");
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
      alert(`Failed to generate PDF: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <Cloud className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Assets Inventory</h1>
                <p className="text-slate-300 text-sm">{assets.length} total assets</p>
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
      <div className="container mx-auto px-4 py-6">
        {/* SEARCH & PDF */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, asset type, user, manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={generatePDF} disabled={pdfGenerating} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            {pdfGenerating ? "Generating..." : `Download PDF Report (${filteredAssets.length})`}
          </Button>
        </div>

        {/* ASSET GRID */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No assets found matching your search criteria.</p>
            <Button onClick={() => navigate("/upload")} className="mt-4">
              Upload New Asset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => viewAssetDetail(asset.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{asset.asset_name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
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
                      src={asset.image_base64.startsWith('data:') ? asset.image_base64 : `data:image/jpeg;base64,${asset.image_base64}`}
                      alt={asset.asset_name}
                      className="w-full h-48 object-cover rounded-md border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-48 bg-muted rounded-md flex items-center justify-center ${asset.image_base64 ? 'hidden' : ''}`}>
                    <span className="text-muted-foreground">No Image</span>
                  </div>

                  {/* METADATA */}
                  <div className="space-y-1.5 text-sm">
                    {/* ASSET NAME */}
                    <p className="text-foreground">
                      <span className="font-semibold text-blue-600 underline">Asset Name:</span> {asset.asset_name}
                    </p>
                    {/* ASSET TYPE */}
                    <p className="text-foreground">
                      <span className="font-semibold text-blue-600 underline">Asset Type:</span> {asset.asset_type || 'N/A'}
                    </p>
                    {/* USER (Engineer Name) */}
                    <p className="text-foreground">
                      <span className="font-semibold text-blue-600 underline">User:</span> {asset.engineer_name}
                    </p>
                    {asset.manufacturer && (
                      <p className="text-foreground">
                        <span className="font-semibold">Manufacturer:</span> {asset.manufacturer}
                      </p>
                    )}
                    {asset.model_number && (
                      <p className="text-foreground">
                        <span className="font-semibold">Model:</span> {asset.model_number}
                      </p>
                    )}
                    {asset.category && (
                      <p className="text-foreground">
                        <span className="font-semibold">Category:</span> {asset.category}
                      </p>
                    )}
                    <p className="text-foreground">
                      <span className="font-semibold">Team:</span> {asset.engineer_category}
                    </p>
                    {/* STORAGE LOCATION */}
                    {asset.stored_location && (
                      <p className="text-foreground flex items-center gap-1">
                        <Cloud className="h-3 w-3" />
                        <span className="font-semibold">Stored At:</span> {asset.stored_location}
                      </p>
                    )}
                  </div>

                  {/* VISUAL DESCRIPTION */}
                  {asset.visual_description && (
                    <div className="pt-2 border-t">
                      <p className="font-semibold text-sm">Description:</p>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {asset.visual_description}
                      </p>
                    </div>
                  )}

                  {/* UPLOAD DATE */}
                  <p className="text-xs text-muted-foreground pt-2">
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
