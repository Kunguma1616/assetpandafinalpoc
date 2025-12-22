// Mock edge function for local development
// This simulates the AI analysis without needing Supabase Edge Functions

export const analyzeAsset = async (payload: {
  engineerName: string;
  engineerCategory: string;
  imageBase64: string;
  mimeType: string;
}) => {
  console.log('🔍 Mock analyzing asset:', payload.engineerName, payload.engineerCategory);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate mock analysis based on category
  const mockAnalysis = generateMockAnalysis(payload.engineerCategory, payload.engineerName);

  return {
    AssetName: mockAnalysis.name,
    Manufacturer: mockAnalysis.manufacturer,
    ModelNumber: mockAnalysis.model,
    Condition: mockAnalysis.condition,
    CategoryMatchConfidence: 'High',
    VisualDescription: mockAnalysis.description,
    _imageHash: generateSimpleHash(payload.imageBase64),
    _cached: false
  };
};

function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 100); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function generateMockAnalysis(category: string, name: string) {
  const analyses: Record<string, any> = {
    'Electronics': {
      name: name || 'MacBook Pro 14"',
      manufacturer: 'Apple',
      model: 'M3 Pro',
      condition: 'excellent',
      description: 'A silver laptop with modern design showing premium build quality. The device has aluminum unibody construction with Apple branding. Condition appears excellent with minimal wear.'
    },
    'Furniture': {
      name: name || 'Executive Office Chair',
      manufacturer: 'Herman Miller',
      model: 'Aeron',
      condition: 'good',
      description: 'An ergonomic office chair with mesh back support. The chair features adjustable arms and pneumatic height adjustment. Condition appears good with normal wear patterns.'
    },
    'Machinery': {
      name: name || 'Industrial Drill Press',
      manufacturer: 'DeWalt',
      model: 'DW1150',
      condition: 'fair',
      description: 'A heavy-duty drill press with cast iron construction. The machine shows signs of regular use with some surface wear. Condition appears fair with operational functionality intact.'
    },
    'Vehicles': {
      name: name || 'Ford Transit Van',
      manufacturer: 'Ford',
      model: 'Transit 350',
      condition: 'good',
      description: 'A white commercial van with standard cargo configuration. The vehicle shows typical commercial use wear on exterior. Condition appears good with maintained mechanical status.'
    },
    'IT Equipment': {
      name: name || 'Dell Server Rack',
      manufacturer: 'Dell',
      model: 'PowerEdge R750',
      condition: 'excellent',
      description: 'A server rack unit with front-facing LED indicators. The equipment has standard 19-inch rack mounting with cable management. Condition appears excellent with clean installation.'
    }
  };

  return analyses[category] || {
    name: name || 'Unknown Asset',
    manufacturer: 'Generic',
    model: 'N/A',
    condition: 'good',
    description: 'A standard asset showing normal wear patterns. The item appears functional with typical use characteristics. Condition appears good overall.'
  };
}

// Export for use in components
export default { analyzeAsset };