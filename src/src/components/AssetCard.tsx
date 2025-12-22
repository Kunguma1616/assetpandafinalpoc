import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Asset } from "@/types/asset";
import { cn } from "@/lib/utils";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'maintenance': return 'status-maintenance';
      default: return '';
    }
  };

  const getConditionClass = (condition: string | null) => {
    switch (condition) {
      case 'excellent': return 'condition-excellent';
      case 'good': return 'condition-good';
      case 'fair': return 'condition-fair';
      case 'poor': return 'condition-poor';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="glass-card overflow-hidden animate-fade-in hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">
            {asset.asset_name}
          </CardTitle>
          <Badge className={cn("shrink-0 text-xs", getStatusClass(asset.status))}>
            {asset.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image */}
        {asset.image_base64 && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={`data:image/jpeg;base64,${asset.image_base64}`}
              alt={asset.asset_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tag:</span>
            <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">
              {asset.asset_tag}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium">{asset.category}</span>
          </div>
          
          {asset.manufacturer && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Manufacturer:</span>
              <span className="font-medium">{asset.manufacturer}</span>
            </div>
          )}
          
          {asset.model_number && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span className="font-medium">{asset.model_number}</span>
            </div>
          )}
          
          {asset.condition && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Condition:</span>
              <span className={cn("font-medium capitalize", getConditionClass(asset.condition))}>
                {asset.condition}
              </span>
            </div>
          )}
        </div>
        
        {/* Description */}
        {asset.visual_description && (
          <p className="text-sm text-muted-foreground border-t border-border pt-3 line-clamp-3">
            {asset.visual_description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
