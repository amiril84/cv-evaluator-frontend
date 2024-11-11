import { ChangeEvent, useState } from 'react';
import { Upload, Download, FileText, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Section {
  name: string;
  score: number;
  keywords: string[];
}

interface EvaluationResult {
  name: string;
  matchScore: number;
  sections: Section[];
}

const CVEvaluator = () => {
  const [cvFile, setCvFile] = useState(null);
  const [jobFile, setJobFile] = useState(null);
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>, type: 'cv' | 'jd') => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      if (type === 'cv') {
        setCvFile(file);
      } else {
        setJobFile(file);
      }
      setError(null);
    } else {
      setError('Please upload a PDF file under 5MB');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-blue-500');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-500');
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, type: 'cv' | 'jd') => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-500');
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      if (type === 'cv') {
        setCvFile(file);
      } else {
        setJobFile(file);
      }
      setError(null);
    } else {
      setError('Please upload a PDF file under 5MB');
    }
  };

  const evaluateCV = async () => {
    if (!cvFile || !jobFile) {
      setError('Please upload both CV and Job Description');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    const formData = new FormData();
    formData.append('cv', cvFile);
    formData.append('jobDescription', jobFile);

    try {
      console.log('Sending request to API...');
      const response = await fetch('http://cv-evaluator-backend-production.up.railway.app:3000/api/evaluate', {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', response.status);
      const result = await response.json();
      console.log('Parsed result:', result);

      if (!response.ok) {
        throw new Error(`API error: ${result.error || 'Unknown error'}`);
      }

      setEvaluationReport(result);
    } catch (error) {
      console.error('Full error details:', error);
      setError('Failed to evaluate CV. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch('http://cv-evaluator-backend-production.up.railway.app:3000/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationReport),
      });
  
      if (!response.ok) throw new Error('Failed to generate PDF');
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv-evaluation-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report');
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CV Evaluator</h1>
          <p className="text-lg text-gray-600">
            Upload your CV and job description to get personalized evaluation
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
              isEvaluating ? 'opacity-50 pointer-events-none' : 'hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'cv')}
          >
            <input
              type="file"
              id="cv-upload"
              className="hidden"
              accept=".pdf"
              onChange={(e) => handleFileUpload(e, 'cv')}
              disabled={isEvaluating}
            />
            <label 
              htmlFor="cv-upload" 
              className="cursor-pointer block space-y-4"
            >
              <Upload className="w-12 h-12 mx-auto text-blue-600" />
              <div className="text-xl font-medium text-blue-600">Upload CV</div>
              <div className="text-sm text-gray-500">or drag and drop</div>
              <div className="text-xs text-gray-400">PDF up to 5MB</div>
            </label>
            {cvFile && (
              <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                Selected: {cvFile.name}
              </div>
            )}
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
              isEvaluating ? 'opacity-50 pointer-events-none' : 'hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'jd')}
          >
            <input
              type="file"
              id="job-upload"
              className="hidden"
              accept=".pdf"
              onChange={(e) => handleFileUpload(e, 'jd')}
              disabled={isEvaluating}
            />
            <label 
              htmlFor="job-upload" 
              className="cursor-pointer block space-y-4"
            >
              <Upload className="w-12 h-12 mx-auto text-blue-600" />
              <div className="text-xl font-medium text-blue-600">Upload Job Description</div>
              <div className="text-sm text-gray-500">or drag and drop</div>
              <div className="text-xs text-gray-400">PDF up to 5MB</div>
            </label>
            {jobFile && (
              <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                Selected: {jobFile.name}
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={evaluateCV}
            disabled={!cvFile || !jobFile || isEvaluating}
            className="bg-blue-600 text-white px-8 py-6 rounded-lg text-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {isEvaluating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Evaluating...
              </div>
            ) : (
              'Evaluate CV'
            )}
          </Button>
        </div>

        {evaluationReport && (
          <Card className="animate-in fade-in slide-in-from-bottom">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Evaluation Report</h2>
                <Button
                  onClick={downloadReport}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>

              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-lg font-medium">Match Score</span>
                  <span className="text-xl font-bold text-blue-600">
                    {evaluationReport.matchScore}%
                  </span>
                </div>
                <Progress 
                  value={evaluationReport.matchScore} 
                  className="h-3 rounded-full"
                />
              </div>

              <div className="space-y-6">
                {evaluationReport.sections.map((section, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-4 p-4 rounded-lg bg-gray-50"
                  >
                    {section.status === 'success' && (
                      <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    )}
                    {section.status === 'warning' && (
                      <Clock className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                    )}
                    {section.status === 'error' && (
                      <AlertCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="text-lg font-medium mb-1">{section.title}</h3>
                      {section.title === "Missing Keywords" ? (
                        <div className="flex flex-wrap gap-2">
                          {section.description.map((keyword, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-200 rounded-md text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600">{section.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CVEvaluator;