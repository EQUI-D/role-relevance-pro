import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Building2, LogOut, Users, TrendingUp, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlacementDashboardProps {
  user: any;
  onLogout: () => void;
}

const PlacementDashboard = ({ user, onLogout }: PlacementDashboardProps) => {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [jobPostings, setJobPostings] = useState<any[]>([
    {
      id: 1,
      company: "TCS",
      title: "Software Developer",
      createdDate: "2024-01-15",
      applicants: 45,
      processed: 32,
      avgScore: 78
    },
    {
      id: 2,
      company: "Infosys",
      title: "Associate Consultant",
      createdDate: "2024-01-14",
      applicants: 67,
      processed: 67,
      avgScore: 72
    }
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const companies = [
    "TCS", "Infosys", "Wipro", "Microsoft", "Amazon", "Google", "IBM", "Accenture"
  ];

  const handleJobSubmit = async () => {
    if (!selectedCompany || !jobTitle || !jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      const newJob = {
        id: Date.now(),
        company: selectedCompany,
        title: jobTitle,
        createdDate: new Date().toISOString().split('T')[0],
        applicants: 0,
        processed: 0,
        avgScore: 0
      };

      setJobPostings([newJob, ...jobPostings]);
      setSelectedCompany("");
      setJobTitle("");
      setJobDescription("");
      setIsUploading(false);

      toast({
        title: "Job description uploaded successfully",
        description: "Students can now apply for this position",
      });
    }, 1500);
  };

  const filteredJobs = jobPostings.filter(job =>
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Placement Team Portal</h1>
              <p className="text-sm text-muted-foreground">Recruitment Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.location} Team</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Job Description</TabsTrigger>
            <TabsTrigger value="dashboard">Results Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-accent" />
                  Create Job Posting
                </CardTitle>
                <CardDescription>
                  Upload job descriptions to start receiving student applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Software Developer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the complete job description including requirements, skills, and qualifications..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-32"
                  />
                </div>

                <Button
                  onClick={handleJobSubmit}
                  disabled={!selectedCompany || !jobTitle || !jobDescription || isUploading}
                  className="w-full gradient-accent text-white shadow-elegant"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publishing Job...
                    </div>
                  ) : (
                    "Publish Job Description"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Search and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{jobPostings.length}</p>
                      <p className="text-sm text-muted-foreground">Active Jobs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-8 h-8 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">{jobPostings.reduce((sum, job) => sum + job.applicants, 0)}</p>
                      <p className="text-sm text-muted-foreground">Total Applicants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-success" />
                    <div>
                      <p className="text-2xl font-bold">{jobPostings.reduce((sum, job) => sum + job.processed, 0)}</p>
                      <p className="text-sm text-muted-foreground">Processed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Job Listings */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Job Postings & Results</CardTitle>
                <CardDescription>
                  Monitor applications and view resume analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No job postings found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <p className="text-muted-foreground">{job.company}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Created: {job.createdDate}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-semibold text-lg">{job.applicants}</p>
                            <p className="text-muted-foreground">Applicants</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-semibold text-lg">{job.processed}</p>
                            <p className="text-muted-foreground">Processed</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-semibold text-lg">{job.avgScore}%</p>
                            <p className="text-muted-foreground">Avg Score</p>
                          </div>
                        </div>

                        <Button variant="outline" className="w-full">
                          View Detailed Results
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlacementDashboard;