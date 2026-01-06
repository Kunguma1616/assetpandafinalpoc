import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Package, 
  Loader2, 
  ArrowLeft,
  Activity,
  Users,
  TrendingUp,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  FileDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// --- Interfaces ---

interface AssetHistoryRecord {
  id: string;
  assetName: string;
  assetCode: string;
  createdDate: string;
  field: string;
  newValue: string;
  oldValue: string;
}

interface RawAssetHistoryRecord {
  Id: string;
  "Asset.Name": string;
  "Asset.Name__c": string;
  CreatedDate: string;
  Field: string;
  NewValue: string;
  OldValue: string;
}

// Backend response interface
interface BackendHistoryRecord {
  id: string;
  asset_id: number;
  asset_name: string;
  asset_code: string;
  field: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

// --- FULL 157 Records from CSV ---
const RAW_DATA: RawAssetHistoryRecord[] = [
  {"Id":"017Vd000048gW7aIAE","Asset.Name":"Max 11 Dehumidifier W class DRIEAZ Revolution LGR  BLUE ONE","Asset.Name__c":"AST-0002","CreatedDate":"2025-07-17T07:49:16.000+0000","Field":"User__c","NewValue":"Adam Bernia","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd000048gW7bIAE","Asset.Name":"Max 11 Dehumidifier W class DRIEAZ Revolution LGR  BLUE ONE","Asset.Name__c":"AST-0002","CreatedDate":"2025-07-17T07:49:16.000+0000","Field":"User__c","NewValue":"0054G00000CSjRvQAL","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd000048h1ewIAA","Asset.Name":"Max 11 Dehumidifier W class DRIEAZ Revolution LGR  BLUE ONE","Asset.Name__c":"AST-0002","CreatedDate":"2025-07-17T07:53:31.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Adam Bernia"},
  {"Id":"017Vd000048h1exIAA","Asset.Name":"Max 11 Dehumidifier W class DRIEAZ Revolution LGR  BLUE ONE","Asset.Name__c":"AST-0002","CreatedDate":"2025-07-17T07:53:31.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000CSjRvQAL"},
  {"Id":"017KH00001Hup7ZYAR","Asset.Name":"Max 13 Dehumidifier DRIZAIR 12 Dehumidifier 230V","Asset.Name__c":"AST-0006","CreatedDate":"2024-07-01T14:29:52.000+0000","Field":"User__c","NewValue":"Adam Bernia","OldValue":"Andrew Oliver"},
  {"Id":"017KH00001Hup7aYAB","Asset.Name":"Max 13 Dehumidifier DRIZAIR 12 Dehumidifier 230V","Asset.Name__c":"AST-0006","CreatedDate":"2024-07-01T14:29:52.000+0000","Field":"User__c","NewValue":"0054G00000CSjRvQAL","OldValue":"0054G00000CKFTRQA5"},
  {"Id":"017Vd00002te0qrIAA","Asset.Name":"Max 13 Dehumidifier DRIZAIR 12 Dehumidifier 230V","Asset.Name__c":"AST-0006","CreatedDate":"2025-01-16T12:05:24.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Adam Bernia"},
  {"Id":"017Vd00002te0qsIAA","Asset.Name":"Max 13 Dehumidifier DRIZAIR 12 Dehumidifier 230V","Asset.Name__c":"AST-0006","CreatedDate":"2025-01-16T12:05:24.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000CSjRvQAL"},
  {"Id":"017Vd00002te5QUIAY","Asset.Name":"Max 13 Dehumidifier DRIZAIR 12 Dehumidifier 230V","Asset.Name__c":"AST-0006","CreatedDate":"2025-01-16T12:06:46.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002te5QVIAY","Asset.Name":"Max 13 Dehumidifier DRIZAIR 12 Dehumidifier 230V","Asset.Name__c":"AST-0006","CreatedDate":"2025-01-16T12:06:46.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002u8qdSIAQ","Asset.Name":"Max 13 Dehumidifier DRIZAIR 12 Dehumidifier 230V","Asset.Name__c":"AST-0006","CreatedDate":"2025-01-20T15:00:22.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002u8qdTIAQ","Asset.Name":"Max 13 Dehumidifier DRIZAIR 12 Dehumidifier 230V","Asset.Name__c":"AST-0006","CreatedDate":"2025-01-20T15:00:22.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002u7eiCIAQ","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T15:06:20.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Amandeep Staging Engineer"},
  {"Id":"017Vd00002u7eiDIAQ","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T15:06:20.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0052500000Az7xSAAR"},
  {"Id":"017Vd00002u92GYIAY","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T15:14:29.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002u92GZIAY","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T15:14:29.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002u9FLaIAM","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T15:14:48.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002u9FLbIAM","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T15:14:48.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002u9QanIAE","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:11:55.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002u9QaoIAE","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:11:55.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002uAPw5IAG","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:18:02.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Engineer"},
  {"Id":"017Vd00002uAPw6IAG","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:18:02.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002uB5RdIAK","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:12:41.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Engineer"},
  {"Id":"017Vd00002uB5ReIAK","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:12:41.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002uB5spIAC","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:15:57.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002uB5sqIAC","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:15:57.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002uB662IAC","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:18:12.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002uB663IAC","Asset.Name":"Pressure Washer KARCHER HD 5/11 P SMALL GREY","Asset.Name__c":"AST-0008","CreatedDate":"2025-01-20T16:18:12.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002zq9nNIAQ","Asset.Name":"Protimeter s12","Asset.Name__c":"AST-0011","CreatedDate":"2025-01-27T16:45:29.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002zq9nOIAQ","Asset.Name":"Protimeter s12","Asset.Name__c":"AST-0011","CreatedDate":"2025-01-27T16:45:29.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002zqIkyIAE","Asset.Name":"Protimeter s12","Asset.Name__c":"AST-0011","CreatedDate":"2025-01-27T16:45:22.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Engineer"},
  {"Id":"017Vd00002zqIkzIAE","Asset.Name":"Protimeter s12","Asset.Name__c":"AST-0011","CreatedDate":"2025-01-27T16:45:22.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002qXRt9IAG","Asset.Name":"A class humidifier Kool","Asset.Name__c":"AST-0013","CreatedDate":"2024-12-30T14:01:59.000+0000","Field":"User__c","NewValue":"Amandeep Staging Engineer","OldValue":"Test Engineer"},
  {"Id":"017Vd00002qXRtAIAW","Asset.Name":"A class humidifier Kool","Asset.Name__c":"AST-0013","CreatedDate":"2024-12-30T14:01:59.000+0000","Field":"User__c","NewValue":"0052500000Az7xSAAR","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002qXTtFIAW","Asset.Name":"A class humidifier Kool","Asset.Name__c":"AST-0013","CreatedDate":"2024-12-30T14:02:40.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Amandeep Staging Engineer"},
  {"Id":"017Vd00002qXTtGIAW","Asset.Name":"A class humidifier Kool","Asset.Name__c":"AST-0013","CreatedDate":"2024-12-30T14:02:40.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000Az7xSAAR"},
  {"Id":"017Vd00004AZJ7dIAH","Asset.Name":"A class humidifier Kool","Asset.Name__c":"AST-0013","CreatedDate":"2025-07-24T07:27:58.000+0000","Field":"User__c","NewValue":"Adam Bernia","OldValue":"Test Engineer"},
  {"Id":"017Vd00004AZJ7eIAH","Asset.Name":"A class humidifier Kool","Asset.Name__c":"AST-0013","CreatedDate":"2025-07-24T07:27:58.000+0000","Field":"User__c","NewValue":"0054G00000CSjRvQAL","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002u9ouAIAQ","Asset.Name":"Vacuum BOSCH","Asset.Name__c":"AST-0014","CreatedDate":"2025-01-20T15:36:40.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Amandeep Staging Engineer"},
  {"Id":"017Vd00002u9ouBIAQ","Asset.Name":"Vacuum BOSCH","Asset.Name__c":"AST-0014","CreatedDate":"2025-01-20T15:36:40.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0052500000Az7xSAAR"},
  {"Id":"017Vd0000483OqhIAE","Asset.Name":"Vacuum BOSCH","Asset.Name__c":"AST-0014","CreatedDate":"2025-07-15T13:58:34.000+0000","Field":"User__c","NewValue":"Adam Bernia","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd0000483OqiIAE","Asset.Name":"Vacuum BOSCH","Asset.Name__c":"AST-0014","CreatedDate":"2025-07-15T13:58:34.000+0000","Field":"User__c","NewValue":"0054G00000CSjRvQAL","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002rBSeLIAW","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-03T16:06:09.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Alexander Mikulsky"},
  {"Id":"017Vd00002rBSeMIAW","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-03T16:06:09.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005Vd00000BAvbZIAT"},
  {"Id":"017Vd00002rBSsjIAG","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-03T16:05:52.000+0000","Field":"User__c","NewValue":"Alexander Mikulsky","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002rBSskIAG","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-03T16:05:52.000+0000","Field":"User__c","NewValue":"005Vd00000BAvbZIAT","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002rp5c9IAA","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-07T10:38:42.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Alexander Mikulsky"},
  {"Id":"017Vd00002rp5cAIAQ","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-07T10:38:42.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005Vd00000BAvbZIAT"},
  {"Id":"017Vd00002rpT7AIAU","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-07T10:38:22.000+0000","Field":"User__c","NewValue":"Alexander Mikulsky","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002rpT7BIAU","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-07T10:38:22.000+0000","Field":"User__c","NewValue":"005Vd00000BAvbZIAT","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002syj7iIAA","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T13:31:59.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002syj7jIAA","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T13:31:59.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002syoWtIAI","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:13:28.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002syoWuIAI","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:13:28.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002syoWxIAI","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:32:27.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002syoWyIAI","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:32:27.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002syvDwIAI","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:21:02.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002syvDxIAI","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:21:02.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002syvdlIAA","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:05:23.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002syvdmIAA","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:05:23.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002syvsNIAQ","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T13:55:52.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002syvsOIAQ","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T13:55:52.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002sz4mXIAQ","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T13:54:51.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002sz4mYIAQ","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T13:54:51.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002sz59EIAQ","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:04:35.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002sz59FIAQ","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:04:35.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002sz5arIAA","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:14:25.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002sz5asIAA","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:14:25.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002szA7oIAE","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:09:33.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002szA7pIAE","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:09:33.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002szBeQIAU","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:10:02.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002szBeRIAU","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:10:02.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002szElwIAE","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:28:09.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002szElxIAE","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-13T14:28:09.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002tTEZSIA4","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-15T12:18:44.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002tTEZTIA4","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-15T12:18:44.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002tdYz7IAE","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-16T10:50:24.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002tdYz8IAE","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-16T10:50:24.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002u9GiFIAU","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T17:01:53.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Engineer"},
  {"Id":"017Vd00002u9GiGIAU","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T17:01:53.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002u9PORIA2","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:32:19.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002u9POSIA2","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:32:19.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002uATDuIAO","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:32:07.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Engineer"},
  {"Id":"017Vd00002uATDvIAO","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:32:07.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002uAVpoIAG","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:39:54.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Engineer"},
  {"Id":"017Vd00002uAVppIAG","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:39:54.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002uAYuIIAW","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:40:16.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Test Engineer"},
  {"Id":"017Vd00002uAYuJIAW","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:40:16.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002uB2fJIAS","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:30:53.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002uB2fKIAS","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:30:53.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002uB4w0IAC","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:40:33.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Engineer"},
  {"Id":"017Vd00002uB4w1IAC","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:40:33.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002uB9a6IAC","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:40:05.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002uB9a7IAC","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:40:05.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002uBGcEIAW","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:40:25.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002uBGcFIAW","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:40:25.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002uBMwFIAW","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T17:01:20.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002uBMwGIAW","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T17:01:20.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002uBRjmIAG","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T17:00:31.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Engineer"},
  {"Id":"017Vd00002uBRjnIAG","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T17:00:31.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"0054G00000B0Uv7QAF"},
  {"Id":"017Vd00002uBWJXIA4","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:59:53.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002uBWJYIA4","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T16:59:53.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002uBeSxIAK","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T17:11:49.000+0000","Field":"User__c","NewValue":"Test Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002uBeSyIAK","Asset.Name":"Test Asset 1 for Alexander","Asset.Name__c":"AST-0017","CreatedDate":"2025-01-20T17:11:49.000+0000","Field":"User__c","NewValue":"0054G00000B0Uv7QAF","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002sygTYIAY","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:19:09.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002sygTZIAY","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:19:09.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002sypABIAY","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:37:10.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002sypACIAY","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:37:10.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002syteBIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:19:20.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002syteCIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:19:20.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002syvOZIAY","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:15:30.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002syvOaIAI","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:15:30.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002syxbXIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T13:48:15.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Alexander Mikulsky"},
  {"Id":"017Vd00002syxbYIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T13:48:15.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"005Vd00000BAvbZIAT"},
  {"Id":"017Vd00002sz3R7IAI","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:14:09.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002sz3R8IAI","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:14:09.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002sz59PIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:31:45.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002sz59QIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:31:45.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002sz5aeIAA","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:00:18.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002sz5afIAA","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:00:18.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002sz5b7IAA","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:18:29.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002sz5b8IAA","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:18:29.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002sz7wRIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:10:46.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002sz7wSIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:10:46.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002szC0wIAE","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:37:00.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002szC0xIAE","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:37:00.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002szHAHIA2","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:35:37.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002szHAIIA2","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-13T14:35:37.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd0000322gsYIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-28T13:37:12.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd0000322gsZIAQ","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-28T13:37:12.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd0000322uIGIAY","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-28T13:38:15.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd0000322uIHIAY","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-28T13:38:15.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd0000323Pz7IAE","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-28T13:37:42.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd0000323Pz8IAE","Asset.Name":"Test Asset 2 for Alexander","Asset.Name__c":"AST-0018","CreatedDate":"2025-01-28T13:37:42.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002syUzvIAE","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T13:52:12.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002syUzwIAE","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T13:52:12.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002sysxqIAA","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:37:25.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002sysxrIAA","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:37:25.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd00002sz5FkIAI","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:27:29.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002sz5FlIAI","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:27:29.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002szCDvIAM","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:33:20.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002szCDwIAM","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:33:20.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002szDB6IAM","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:22:25.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Test Aliaksei"},
  {"Id":"017Vd00002szDB7IAM","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:22:25.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"005Vd00000AnQG5IAN"},
  {"Id":"017Vd00002szDefIAE","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:23:31.000+0000","Field":"User__c","NewValue":"Test Aliaksei","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002szDegIAE","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:23:31.000+0000","Field":"User__c","NewValue":"005Vd00000AnQG5IAN","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002szEm2IAE","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:36:17.000+0000","Field":"User__c","NewValue":"Warehouse Warehouse","OldValue":"Mariia Engineer"},
  {"Id":"017Vd00002szEm3IAE","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:36:17.000+0000","Field":"User__c","NewValue":"0052500000BIlUGAA1","OldValue":"005KH000001A9WuYAK"},
  {"Id":"017Vd00002szGMfIAM","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:34:51.000+0000","Field":"User__c","NewValue":"Mariia Engineer","OldValue":"Warehouse Warehouse"},
  {"Id":"017Vd00002szGMgIAM","Asset.Name":"Test Asset 3 for Alexander","Asset.Name__c":"AST-0019","CreatedDate":"2025-01-13T14:34:51.000+0000","Field":"User__c","NewValue":"005KH000001A9WuYAK","OldValue":"0052500000BIlUGAA1"},
  {"Id":"017Vd000045sRfQIAU","Asset.Name":"Plantation Asset Test 1","Asset.Name__c":"AST-0023","CreatedDate":"2025-07-09T10:14:53.000+0000","Field":"User__c","NewValue":"Roman Engineer","OldValue":"Max Andrusenko"},
  {"Id":"017Vd000045sRfRIAU","Asset.Name":"Plantation Asset Test 1","Asset.Name__c":"AST-0023","CreatedDate":"2025-07-09T10:14:53.000+0000","Field":"User__c","NewValue":"005Vd000005YCRDIA4","OldValue":"005Vd00000AS0W2IAL"},
  {"Id":"017Vd000045sRfSIAU","Asset.Name":"Plantation Asset Test 2","Asset.Name__c":"AST-0024","CreatedDate":"2025-07-09T10:14:53.000+0000","Field":"User__c","NewValue":"Roman Engineer","OldValue":"Max Andrusenko"},
  {"Id":"017Vd000045sRfTIAU","Asset.Name":"Plantation Asset Test 2","Asset.Name__c":"AST-0024","CreatedDate":"2025-07-09T10:14:53.000+0000","Field":"User__c","NewValue":"005Vd000005YCRDIA4","OldValue":"005Vd00000AS0W2IAL"},
  {"Id":"017Vd000045sRfUIAU","Asset.Name":"Plantation Asset Test 3","Asset.Name__c":"AST-0025","CreatedDate":"2025-07-09T10:14:53.000+0000","Field":"User__c","NewValue":"Roman Engineer","OldValue":"Max Andrusenko"},
  {"Id":"017Vd000045sRfVIAU","Asset.Name":"Plantation Asset Test 3","Asset.Name__c":"AST-0025","CreatedDate":"2025-07-09T10:14:53.000+0000","Field":"User__c","NewValue":"005Vd000005YCRDIA4","OldValue":"005Vd00000AS0W2IAL"}
];

// --- Helpers ---

function parseAssetHistory(data: RawAssetHistoryRecord[]): AssetHistoryRecord[] {
  return data
    .filter(r => !r.NewValue?.startsWith('00') && !r.OldValue?.startsWith('00'))
    .map((r) => ({
      id: r.Id,
      assetName: r["Asset.Name"],
      assetCode: r["Asset.Name__c"],
      createdDate: r.CreatedDate,
      field: r.Field,
      newValue: r.NewValue || '—',
      oldValue: r.OldValue || '—',
    }));
}

// Parse backend response to AssetHistoryRecord
function parseBackendHistory(data: BackendHistoryRecord[]): AssetHistoryRecord[] {
  return data.map((r) => ({
    id: r.id,
    assetName: r.asset_name,
    assetCode: r.asset_code,
    createdDate: r.created_at,
    field: r.field,
    newValue: r.new_value || '—',
    oldValue: r.old_value || '—',
  }));
}

function formatDate(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
}

function StatCard({ title, value, subtitle, icon, trend, className = "" }: StatCardProps) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{value}</span>
              {trend && (
                <span className={`flex items-center text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

export default function AssetHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AssetHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Try to fetch from backend
        const response = await fetch('http://localhost:5000/asset-history');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const backendData: BackendHistoryRecord[] = await response.json();
        
        // If backend returns data, use it; otherwise fall back to mock
        if (backendData && backendData.length > 0) {
          const parsedBackend = parseBackendHistory(backendData);
          // Combine backend data with mock data (backend first)
          const mockParsed = parseAssetHistory(RAW_DATA);
          setRecords([...parsedBackend, ...mockParsed]);
          console.log(`Loaded ${parsedBackend.length} records from backend + ${mockParsed.length} mock records`);
        } else {
          // Empty backend response, use mock data
          console.log('Backend returned empty, using mock data');
          setRecords(parseAssetHistory(RAW_DATA));
        }
      } catch (error) {
        // Fetch failed, fall back to mock data
        console.error('Failed to fetch from backend, using mock data:', error);
        setRecords(parseAssetHistory(RAW_DATA));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter Logic
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return records.filter((r) => {
      const matchSearch = !s || 
        r.assetName.toLowerCase().includes(s) || 
        r.assetCode.toLowerCase().includes(s) ||
        r.newValue.toLowerCase().includes(s) ||
        r.oldValue.toLowerCase().includes(s);
      const matchAsset = assetFilter === 'all' || r.assetName === assetFilter;
      return matchSearch && matchAsset;
    });
  }, [records, search, assetFilter]);

  const assetsList = useMemo(() => Array.from(new Set(records.map((r) => r.assetName))).sort(), [records]);
  const totalPages = Math.ceil(filtered.length / perPage);
  const rows = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => setPage(1), [search, assetFilter]);

  // --- Export Logic ---

  const handleExportCSV = (dataToExport: AssetHistoryRecord[], filename: string) => {
    const headers = ['Date', 'Time', 'Asset Name', 'Asset Code', 'From', 'To'];
    const csvRows = [
      headers.join(','),
      ...dataToExport.map(r => [
        formatDate(r.createdDate),
        formatTime(r.createdDate),
        `"${r.assetName.replace(/"/g, '""')}"`,
        r.assetCode,
        `"${r.oldValue.replace(/"/g, '""')}"`,
        `"${r.newValue.replace(/"/g, '""')}"`
      ].join(','))
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleExportPDF = (dataToExport: AssetHistoryRecord[], titleSuffix: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Pop-up blocked!');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #27549D; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #27549D; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Asset Allocation Report: ${titleSuffix}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Asset Name</th>
                <th>Code</th>
                <th>Transfer (From → To)</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport.map(r => `
                <tr>
                  <td>${formatDate(r.createdDate)} ${formatTime(r.createdDate)}</td>
                  <td>${r.assetName}</td>
                  <td>${r.assetCode}</td>
                  <td>${r.oldValue} → ${r.newValue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Stats Logic
  const stats = useMemo(() => ({
    total: records.length,
    assets: assetsList.length,
    users: new Set([...records.map(r => r.newValue), ...records.map(r => r.oldValue)]).size,
    recent: records.filter(r => new Date(r.createdDate).getFullYear() === 2025).length
  }), [records, assetsList]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Synchronizing history data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Asset Allocation History</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Current View ({filtered.length})</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleExportCSV(filtered, 'filtered-assets')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF(filtered, 'Filtered Results')}>
                    <FileText className="h-4 w-4 mr-2" /> Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Full Database ({records.length})</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleExportCSV(records, 'full-history')}>
                    <FileDown className="h-4 w-4 mr-2" /> Full CSV Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Movements" value={stats.total} icon={<Activity className="h-5 w-5" />} />
          <StatCard title="Unique Assets" value={stats.assets} icon={<Package className="h-5 w-5" />} />
          <StatCard title="Personnel Involved" value={stats.users} icon={<Users className="h-5 w-5" />} />
          <StatCard title="2025 Transfers" value={stats.recent} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        {/* Main Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Transfer Log</CardTitle>
                <CardDescription>Search and filter asset movements across the organization</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets, users..."
                    className="pl-9 w-full sm:w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={assetFilter} onValueChange={setAssetFilter}>
                  <SelectTrigger className="w-full sm:w-56">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    {assetsList.map(a => <SelectItem key={a} value={a}>{a.substring(0, 30)}...</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Timestamp</TableHead>
                  <TableHead>Asset Information</TableHead>
                  <TableHead>Allocation Change</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium">{formatDate(r.createdDate)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(r.createdDate)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{r.assetName}</p>
                          <Badge variant="secondary" className="text-xs">{r.assetCode}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{r.oldValue}</span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="font-medium">{r.newValue}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Asset Options</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              const assetHistory = records.filter(item => item.assetName === r.assetName);
                              handleExportCSV(assetHistory, `History-${r.assetCode}`);
                            }}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Asset History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const assetHistory = records.filter(item => item.assetName === r.assetName);
                              handleExportPDF(assetHistory, `Asset: ${r.assetName} (${r.assetCode})`);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" /> View PDF Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8" />
                        <p>No matching records found for your search criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(filtered.length, (page-1)*perPage + 1)} - {Math.min(filtered.length, page*perPage)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
