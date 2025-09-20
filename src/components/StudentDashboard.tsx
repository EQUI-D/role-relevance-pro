import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Building2, LogOut, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
}

const StudentDashboard = ({ user, onLogout }: StudentDashboardProps) => {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResumes, setUploadedResumes] = useState<any[]>([]);
  const { toast } = useToast();

  const companies = [
    { id: "1", name: "TCS", roles: ["Software Developer", "System Engineer"] },
    { id: "2", name: "Infosys", roles: ["Associate Consultant", "Developer"] },
    { id: "3", name: "Wipro", roles: ["Project Engineer", "Analyst"] },
    { id: "4", name: "Microsoft", roles: ["Software Engineer", "Program Manager"] },
    { id: "5", name: "Amazon", roles: ["SDE I", "Business Analyst"] },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.name.endsWith(".docx")) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCompany) {
      toast({
        title: "Missing information",
        description: "Please select a company and upload your resume",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Simulate upload and processing
    setTimeout(() => {
      const newResume = {
        id: Date.now(),
        company: companies.find(c => c.id === selectedCompany)?.name,
        fileName: selectedFile.name,
        uploadDate: new Date().toLocaleDateString(),
        status: "Processing",
        relevanceScore: null,
      };

      setUploadedResumes([...uploadedResumes, newResume]);
      setSelectedFile(null);
      setSelectedCompany("");
      setIsUploading(false);

      toast({
        title: "Resume uploaded successfully",
        description: "Your resume is being analyzed. Results will be available shortly.",
      });

      // Simulate processing completion
      setTimeout(() => {
        setUploadedResumes(prev => 
          prev.map(resume => 
            resume.id === newResume.id 
              ? { ...resume, status: "Completed", relevanceScore: Math.floor(Math.random() * 40) + 60 }
              : resume
          )
        );
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Portal</h1>
              <p className="text-sm text-muted-foreground">Resume Submission System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.location}</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Submit your resume for company-specific job openings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company">Select Company</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {company.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Resume File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center transition-smooth hover:border-primary">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Label htmlFor="resume" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF or DOCX files only
                    </p>
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedCompany || isUploading}
                className="w-full gradient-primary text-white shadow-elegant"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading & Processing...
                  </div>
                ) : (
                  "Submit Resume"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Section */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                Submission Status
              </CardTitle>
              <CardDescription>
                Track your resume submissions and analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedResumes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No resumes submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedResumes.map((resume) => (
                    <div key={resume.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{resume.company}</p>
                          <p className="text-sm text-muted-foreground">{resume.fileName}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            resume.status === "Completed" 
                              ? "bg-success/10 text-success" 
                              : "bg-warning/10 text-warning"
                          }`}>
                            {resume.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Uploaded: {resume.uploadDate}</span>
                        {resume.relevanceScore && (
                          <span className="font-medium text-primary">
                            Score: {resume.relevanceScore}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;