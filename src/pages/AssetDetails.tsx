import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Asset {
  id: number;
  engineer_name: string;
  engineer_category: string;
  asset_name: string | null;
  manufacturer: string | null;
  model_number: string | null;
  condition: string | null;
  visual_description: string | null;
  image_base64: string | null;
  category_match_confidence: number | null;
}

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`http://localhost:5000/assets/${id}`);
        const data = await res.json();
        setAsset(data);
      } catch (err) {
        console.error("Error loading asset:", err);
      }
      setLoading(false);
    };

    fetchAsset();
  }, [id]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!asset) return <div className="p-6 text-center">Asset not found.</div>;

  return (
    <div className="container mx-auto p-6">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
        ← Back
      </Button>

      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">{asset.asset_name}</h1>

        {asset.image_base64 && (
          <img
            src={`data:image/jpeg;base64,${asset.image_base64}`}
            alt="Asset"
            className="w-full rounded-md mb-4 shadow"
          />
        )}

        <div className="space-y-3 text-lg">

          <p>
            <strong>Engineer:</strong> {asset.engineer_name}
          </p>

          <p>
            <strong>Category:</strong> {asset.engineer_category}
          </p>

          {asset.manufacturer && (
            <p>
              <strong>Manufacturer:</strong> {asset.manufacturer}
            </p>
          )}

          {asset.model_number && (
            <p>
              <strong>Model Number:</strong> {asset.model_number}
            </p>
          )}

          {asset.condition && (
            <p>
              <strong>Condition:</strong> {asset.condition}
            </p>
          )}

          {asset.category_match_confidence !== null && (
            <p>
              <strong>Category Confidence:</strong> {asset.category_match_confidence}%
            </p>
          )}

          {asset.visual_description && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
              <strong>AI Description:</strong>
              <p className="mt-2">{asset.visual_description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetails;
