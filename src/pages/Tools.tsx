import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Mock form components since they are usually imported from ui library
import { Input } from "@/components/ui/input"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label"; 

import { Plus, Hammer, CheckCircle, AlertCircle, LayoutDashboard, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// NOTE: Removed useNavigate as we are now using internal state for view switching.

// --- MOCK DATA ---
const tools = [
  { id: "TL-001", name: "Power Drill", category: "Power Tools", status: "Available", checkedOut: null, location: "Tool Room A", condition: "Good" },
  { id: "TL-002", name: "Torque Wrench", category: "Hand Tools", status: "Checked Out", checkedOut: "John Smith", location: "Field Site 1", condition: "Good" },
  { id: "TL-003", name: "Laser Level", category: "Measuring", status: "Available", checkedOut: null, location: "Tool Room B", condition: "Excellent" },
  { id: "TL-004", name: "Circular Saw", category: "Power Tools", status: "Maintenance", checkedOut: null, location: "Repair Shop", condition: "Fair" },
  { id: "TL-005", name: "Socket Set", category: "Hand Tools", status: "Available", checkedOut: null, location: "Tool Room A", condition: "Good" },
];

const TOTAL_TOOLS = 385;
const AVAILABLE_TOOLS = 312;
const CHECKED_OUT_TOOLS = 58; 

// --- NEW COMPONENT: ADD TOOL FORM STRUCTURE ---
const AddToolForm = ({ onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    condition: 'Good'
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (value, id) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic to save the new tool goes here (e.g., API call)
    console.log("Saving new tool:", formData);
    onSave(formData);
  };

  return (
    <Card className="shadow-lg border-t-4 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl flex items-center">
          <Hammer className="w-5 h-5 mr-2" /> Add New Tool Asset
        </CardTitle>
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tool Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tool Name</Label>
              <Input id="name" type="text" placeholder="e.g., Impact Driver" value={formData.name} onChange={handleChange} required />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'category')} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Power Tools">Power Tools</SelectItem>
                  <SelectItem value="Hand Tools">Hand Tools</SelectItem>
                  <SelectItem value="Measuring">Measuring</SelectItem>
                  <SelectItem value="Safety Gear">Safety Gear</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input id="location" type="text" placeholder="e.g., Tool Room C - Shelf 3" value={formData.location} onChange={handleChange} required />
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label htmlFor="condition">Tool Condition</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'condition')} defaultValue={formData.condition} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button type="submit" className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Save New Tool
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};


// --- MAIN COMPONENT: TOOLS (INVENTORY & ROUTER) ---
const Tools = () => {
  // 1. Internal state to manage the view: 'inventory' or 'add_tool'
  const [currentView, setCurrentView] = useState('inventory');
  
  // Note: If you still need external routing for the Dashboard, keep this:
  // const navigate = useNavigate(); 
  // const handleDashboard = () => navigate("/dashboard"); 

  const handleAddToolClick = () => {
    setCurrentView('add_tool');
  };

  const handleReturnToInventory = () => {
    setCurrentView('inventory');
  };
  
  // Mock function for saving/submitting the tool data
  const handleSaveNewTool = (newToolData) => {
    // In a real app, you'd integrate this with your tool state/API
    console.log("New Tool Data received and mocked as saved:", newToolData);
    handleReturnToInventory(); // Go back to inventory view after saving
  };


  // 2. Conditional Rendering for the Add Tool Form
  if (currentView === 'add_tool') {
    return (
      <div className="space-y-6 p-6 md:p-10 bg-gray-50 min-h-screen">
        <AddToolForm onCancel={handleReturnToInventory} onSave={handleSaveNewTool} />
      </div>
    );
  }


  // 3. Main Inventory View
  return (
    <div className="space-y-6 p-6 md:p-10 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tool Tracking Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage tool inventory and check-in/check-out statuses</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" /*onClick={handleDashboard}*/>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* ADD TOOL BUTTON: Now changes the local state/view */}
          <Button onClick={handleAddToolClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tool
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">

        <Card className="shadow-soft hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Tools</p>
                <h3 className="text-2xl font-bold mt-1">{TOTAL_TOOLS}</h3>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Hammer className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Available</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600">{AVAILABLE_TOOLS}</h3>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Checked Out</p>
                <h3 className="text-2xl font-bold mt-1 text-orange-600">{CHECKED_OUT_TOOLS}</h3>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-lg border-t-4 border-primary/20">
        <CardHeader>
          <CardTitle>Detailed Tool Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Checked Out To</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Condition</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tools.map((tool) => (
                <TableRow key={tool.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{tool.id}</TableCell>
                  <TableCell>{tool.name}</TableCell>
                  <TableCell className="text-muted-foreground">{tool.category}</TableCell>
                  <TableCell>
                    {/* Dynamic Badge styling based on status */}
                    <Badge
                      variant={
                        tool.status === "Available" ? "default" :
                        tool.status === "Checked Out" ? "secondary" :
                        "destructive"
                      }
                      className={
                        tool.status === "Available" ? "bg-green-500 hover:bg-green-600" :
                        tool.status === "Checked Out" ? "bg-orange-500 hover:bg-orange-600" :
                        "bg-red-500 hover:bg-red-600"
                      }
                    >
                      {tool.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{tool.checkedOut || "-"}</TableCell>
                  <TableCell>{tool.location}</TableCell>
                  <TableCell>{tool.condition}</TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tools;