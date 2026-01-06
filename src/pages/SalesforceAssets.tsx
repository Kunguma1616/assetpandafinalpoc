import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, CheckCircle, XCircle, PoundSterling, Wrench, Star, Search, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, Calendar, MapPin, User, Building, Tag, 
  AlertTriangle, Loader2, ArrowLeft, Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// ============ TYPES ============
interface Asset {
  id: string;
  name: string;
  assetCode: string;
  accountName: string;
  assetType: string;
  assetLevel: number;
  assignedDate: string | null;
  city: string;
  country: string;
  description: string;
  consequenceOfFailure: string;
  equipmentOwner: string;
  installDate: string | null;
  isAvailable: boolean;
  isClientAsset: boolean;
  isSpecialized: boolean;
  maintenanceCost: number;
  manufactureDate: string | null;
  ownerName: string;
  price: number;
  productCode: string;
  usageEndDate: string | null;
  postalCode: string;
  address: string;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig { key: keyof Asset; direction: SortDirection; }
interface FilterConfig { search: string; assetType: string; availability: string; }

// ============ ROBUST CSV PARSER ============
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += char;
  }
  result.push(current);
  return result;
}

function parseCSV(csvText: string): Asset[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const getIndex = (name: string) => headers.findIndex(h => h === name);
  
  const idIdx = getIndex('Id'), nameIdx = getIndex('Name'), nameCodeIdx = getIndex('Name__c');
  const accountNameIdx = getIndex('Account.Name'), assetTypeIdx = getIndex('Asset_Type__c');
  const assetLevelIdx = getIndex('AssetLevel'), assignedDateIdx = getIndex('Assigned_Date__c');
  const cityIdx = getIndex('City'), consequenceIdx = getIndex('ConsequenceOfFailure');
  const installDateIdx = getIndex('InstallDate'), isAvailableIdx = getIndex('Is_Available__c');
  const isSpecializedIdx = getIndex('Is_Specialized__c'), maintenanceCostIdx = getIndex('Maintenance_Cost__c');
  const ownerNameIdx = getIndex('Owner.Name'), priceIdx = getIndex('Price'), productCodeIdx = getIndex('ProductCode');

  const assets: Asset[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const getValue = (idx: number) => idx >= 0 && idx < values.length ? values[idx].trim().replace(/^"|"$/g, '') : '';
    const getBool = (idx: number) => getValue(idx).toUpperCase() === 'TRUE';
    const getNum = (idx: number) => { const val = getValue(idx); return val ? parseFloat(val) || 0 : 0; };
    
    if (!getValue(idIdx) || getValue(idIdx) === '[Asset]') continue;

    assets.push({
      id: getValue(idIdx),
      name: getValue(nameIdx) || 'Unnamed Asset',
      assetCode: getValue(nameCodeIdx),
      accountName: getValue(accountNameIdx),
      assetType: getValue(assetTypeIdx) || 'General',
      assetLevel: parseInt(getValue(assetLevelIdx)) || 1,
      assignedDate: getValue(assignedDateIdx),
      city: getValue(cityIdx),
      country: getValue(getIndex('Country')),
      description: getValue(getIndex('Description')),
      consequenceOfFailure: getValue(consequenceIdx) || 'Low',
      equipmentOwner: getValue(getIndex('Equipment_Owner__c')),
      installDate: getValue(installDateIdx),
      isAvailable: getBool(isAvailableIdx),
      isClientAsset: getBool(getIndex('Is_a_client_asset__c')),
      isSpecialized: getBool(isSpecializedIdx),
      maintenanceCost: getNum(maintenanceCostIdx),
      manufactureDate: getValue(getIndex('ManufactureDate')),
      ownerName: getValue(ownerNameIdx),
      price: getNum(priceIdx),
      productCode: getValue(productCodeIdx),
      usageEndDate: getValue(getIndex('UsageEndDate')),
      postalCode: getValue(getIndex('PostalCode')),
      address: getValue(getIndex('Address')),
    });
  }
  return assets;
}

// ============ MAIN COMPONENT ============
export default function SalesforceAssets() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({ search: '', assetType: 'all', availability: 'all' });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  // Add Asset Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    date: '',
    time: '',
    assetType: 'General'
  });

  // 1. AUTO-LOAD EFFECT
  useEffect(() => {
    const fetchLocalData = async () => {
      try {
        const response = await fetch('/assets.csv');
        if (!response.ok) throw new Error('File assets.csv not found in public folder');
        const text = await response.text();
        const parsedData = parseCSV(text);
        setAssets(parsedData);
      } catch (err) {
        setError('Please ensure assets.csv is in your public folder.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocalData();
  }, []);

  // 2. DATA PROCESSING
  const assetTypes = useMemo(() => ['all', ...Array.from(new Set(assets.map(a => a.assetType).filter(Boolean)))], [assets]);

  const filteredAssets = useMemo(() => assets.filter(asset => {
    const matchesSearch = filters.search === '' || 
      [asset.name, asset.assetCode, asset.accountName, asset.ownerName].some(f => f?.toLowerCase().includes(filters.search.toLowerCase()));
    const matchesType = filters.assetType === 'all' || asset.assetType === filters.assetType;
    const matchesAvailability = filters.availability === 'all' ||
      (filters.availability === 'available' && asset.isAvailable) ||
      (filters.availability === 'unavailable' && !asset.isAvailable);
    return matchesSearch && matchesType && matchesAvailability;
  }), [assets, filters]);

  const sortedAssets = useMemo(() => [...filteredAssets].sort((a, b) => {
    const aVal = a[sortConfig.key], bVal = b[sortConfig.key];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    if (typeof aVal === 'number' && typeof bVal === 'number') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    return 0;
  }), [filteredAssets, sortConfig]);

  const stats = useMemo(() => ({
    total: assets.length,
    available: assets.filter(a => a.isAvailable).length,
    unavailable: assets.filter(a => !a.isAvailable).length,
    value: assets.reduce((sum, a) => sum + (a.price || 0), 0),
  }), [assets]);

  // 3. UI HANDLERS
  const handleSort = (key: keyof Asset) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const formatCurrency = (val: number) => val ? `£${val.toLocaleString()}` : '-';

  const handleAddNewAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: Asset = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      assetCode: `NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      accountName: 'Internal',
      assetType: formData.assetType,
      assetLevel: 1,
      assignedDate: formData.date,
      city: 'London',
      country: 'UK',
      description: `Added via tool on ${formData.date} at ${formData.time}`,
      consequenceOfFailure: 'Medium',
      equipmentOwner: 'System Admin',
      installDate: formData.date,
      isAvailable: true,
      isClientAsset: false,
      isSpecialized: false,
      maintenanceCost: 0,
      manufactureDate: null,
      ownerName: 'Admin',
      price: parseFloat(formData.price) || 0,
      productCode: 'MANUAL-ENTRY',
      usageEndDate: null,
      postalCode: '',
      address: '',
    };

    setAssets([newEntry, ...assets]);
    setIsAddModalOpen(false);
    setFormData({ name: '', price: '', date: '', time: '', assetType: 'General' });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" /><p className="font-medium text-slate-600">Loading Asset Master Data...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        
        {/* HEADER STATS */}
        <header className="rounded-2xl bg-primary p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-white p-1 rounded-xl w-16 h-16 flex items-center justify-center overflow-hidden shadow-inner">
                   <img src="/aspectlogo.jpeg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Asset Salesforce Database</h1>
                  <p className="opacity-80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    UK Asset Tracking (GBP)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg">
                  <Plus className="mr-2 h-4 w-4" /> Add Asset Tool
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Total Assets" value={stats.total} />
              <StatBox label="Available" value={stats.available} color="text-emerald-400" />
              <StatBox label="Total Portfolio Value" value={formatCurrency(stats.value)} />
            </div>
          </div>
        </header>

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-10" placeholder="Search code, name, or account..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
          <div className="flex gap-2">
            <Select value={filters.assetType} onValueChange={v => setFilters({...filters, assetType: v})}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>{assetTypes.map(t => <SelectItem key={t} value={t}>{t === 'all' ? 'All Types' : t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* DATA TABLE */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <SortHeader k="assetCode" config={sortConfig} onSort={handleSort}>Code</SortHeader>
                <SortHeader k="name" config={sortConfig} onSort={handleSort}>Name</SortHeader>
                <SortHeader k="accountName" config={sortConfig} onSort={handleSort}>Account</SortHeader>
                <SortHeader k="isAvailable" config={sortConfig} onSort={handleSort}>Status</SortHeader>
                <SortHeader k="price" config={sortConfig} onSort={handleSort}>Price</SortHeader>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {sortedAssets.map(asset => (
                <TableRow key={asset.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSelectedAsset(asset)}>
                  <TableCell className="font-mono text-xs text-primary font-semibold">{asset.assetCode}</TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{asset.accountName}</TableCell>
                  <TableCell>
                    {asset.isAvailable ? 
                      <Badge className="bg-emerald-100 text-emerald-700 border-none">Available</Badge> : 
                      <Badge className="bg-slate-100 text-slate-500 border-none">In Use</Badge>
                    }
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(asset.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* ADD ASSET MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" /> Add New Asset
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNewAsset} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Asset Name</Label>
              <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Generator X1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Amount (GBP)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="price" type="number" required className="pl-10" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Asset Type</Label>
              <Select value={formData.assetType} onValueChange={v => setFormData({...formData, assetType: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="IT Equipment">IT Equipment</SelectItem>
                  <SelectItem value="Heavy Machinery">Heavy Machinery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">Save Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW DETAIL DIALOG */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedAsset?.name}</DialogTitle>
            <Badge variant="outline" className="w-fit">{selectedAsset?.assetCode}</Badge>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-6">
            <DetailItem icon={Building} label="Account" value={selectedAsset?.accountName} />
            <DetailItem icon={Calendar} label="Installation Date" value={selectedAsset?.installDate} />
            <DetailItem icon={Tag} label="Asset Type" value={selectedAsset?.assetType} />
            <DetailItem icon={PoundSterling} label="Purchase Price" value={formatCurrency(selectedAsset?.price || 0)} />
          </div>
          {selectedAsset?.description && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Internal Note</p>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedAsset.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SUB-COMPONENTS ============
function StatBox({ label, value, color = "text-white" }: any) {
  return (
    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SortHeader({ k, config, onSort, children }: any) {
  const isActive = config.key === k;
  return (
    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => onSort(k)}>
      <div className="flex items-center gap-1">
        {children}
        {isActive ? (config.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </div>
    </TableHead>
  );
}

function DetailItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Icon className="h-4 w-4" /></div>
      <div><p className="text-xs text-slate-400 font-medium">{label}</p><p className="text-sm font-semibold">{value || '-'}</p></div>
    </div>
  ); 
}