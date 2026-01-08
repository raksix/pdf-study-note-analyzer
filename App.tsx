import React, { useState, useCallback, useEffect, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import AnalysisResultCard from './components/AnalysisResultCard';
import RoadmapView from './components/RoadmapView';
import { AnalyzedFile, AnalysisResult, Priority, RoadmapStep } from './types';
import { fileToBase64, generateId } from './services/fileHelpers';
import { analyzePdfContent, createUnifiedRoadmap } from './services/geminiService';
import { generateHtmlReport } from './services/htmlGenerator';

const STORAGE_KEY = 'pdf_study_assistant_data';
const ROADMAP_STORAGE_KEY = 'pdf_study_assistant_roadmap';

const App: React.FC = () => {
  // Initialize state from localStorage
  const [files, setFiles] = useState<AnalyzedFile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: AnalyzedFile[] = JSON.parse(saved);
          // If page was reloaded during analysis, we lost the file object, so mark as error
          return parsed.map(f => {
            if (f.status === 'analyzing' || f.status === 'uploading') {
              return { 
                ...f, 
                status: 'error', 
                errorMessage: 'Sayfa yenilendiği için işlem tamamlanamadı.' 
              };
            }
            return f;
          });
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
    return [];
  });

  const [roadmap, setRoadmap] = useState<RoadmapStep[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(ROADMAP_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  // Save to localStorage whenever files change
  useEffect(() => {
    try {
      // Remove the 'file' object (which is not serializable) before saving
      const dataToSave = files.map(f => {
        const { file, ...rest } = f;
        return rest;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  }, [files]);

  // Save roadmap
  useEffect(() => {
    try {
      localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(roadmap));
    } catch (e) {
      console.error("Failed to save roadmap:", e);
    }
  }, [roadmap]);

  // Calculate all unique topics from all completed files
  const allTopics = useMemo(() => {
    const uniqueTopics = new Set<string>();
    files.forEach(file => {
      if (file.status === 'completed' && file.result?.topics) {
        file.result.topics.forEach(topic => uniqueTopics.add(topic));
      }
    });
    // Sort alphabetically with Turkish locale support
    return Array.from(uniqueTopics).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [files]);

  // Calculate High Priority topics specifically from the study plans
  const highPriorityTopics = useMemo(() => {
    const uniqueHighPriority = new Set<string>();
    files.forEach(file => {
      if (file.status === 'completed' && file.result?.studyPlan) {
        file.result.studyPlan.forEach(item => {
          // Check for 'Yüksek' which corresponds to Priority.HIGH
          if (item.priority === Priority.HIGH) {
            uniqueHighPriority.add(item.topic);
          }
        });
      }
    });
    return Array.from(uniqueHighPriority).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [files]);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    // Create initial state entries for new files
    const newFileEntries: AnalyzedFile[] = selectedFiles.map(file => ({
      id: generateId(),
      file: file, // Store file reference for processing
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      status: 'idle',
      timestamp: Date.now()
    }));

    setFiles(prev => [...newFileEntries, ...prev]);

    // Process each file individually
    newFileEntries.forEach(fileEntry => {
      processFile(fileEntry);
    });
  }, []);

  const processFile = async (fileEntry: AnalyzedFile) => {
    updateFileStatus(fileEntry.id, 'analyzing');

    try {
      if (!fileEntry.file) {
        throw new Error("Dosya verisi bulunamadı.");
      }

      // 1. Convert to Base64
      const base64Data = await fileToBase64(fileEntry.file);

      // 2. Call Gemini API
      const result = await analyzePdfContent(base64Data, fileEntry.fileType);

      // 3. Update Status to Completed
      updateFileStatus(fileEntry.id, 'completed', result);

    } catch (error: any) {
      console.error(`Error processing file ${fileEntry.fileName}:`, error);
      updateFileStatus(fileEntry.id, 'error', undefined, error.message || "Bilinmeyen bir hata oluştu");
    }
  };

  const updateFileStatus = (id: string, status: AnalyzedFile['status'], result?: AnalysisResult, errorMessage?: string) => {
    setFiles(prevFiles => 
      prevFiles.map(f => {
        if (f.id === id) {
          return { ...f, status, result, errorMessage };
        }
        return f;
      })
    );
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    // Reset roadmap if files change significantly? Optional. For now we keep it.
  };

  const clearAll = () => {
    if (confirm("Tüm kayıtlı analizler ve yol haritası silinsin mi?")) {
      setFiles([]);
      setRoadmap([]);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ROADMAP_STORAGE_KEY);
    }
  };

  const handleGenerateRoadmap = async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.result);
    if (completedFiles.length === 0) return;

    setIsGeneratingRoadmap(true);
    try {
      const results = completedFiles.map(f => f.result!);
      const newRoadmap = await createUnifiedRoadmap(results);
      setRoadmap(newRoadmap);
    } catch (error) {
      alert("Yol haritası oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleDownloadReport = () => {
    const htmlContent = generateHtmlReport(files, allTopics, highPriorityTopics, roadmap);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `calisma-raporu-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasCompletedFiles = files.some(f => f.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Akıllı Çalışma Asistanı</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Otomatik Kayıt Aktif
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 sm:text-4xl">
            PDF Dosyalarını Yükle, <br/>
            <span className="text-indigo-600">Çalışma Planını Oluştur</span>
          </h2>
          <p className="text-lg text-slate-600">
            Ders notlarını veya kitaplarını yükle. Yapay zeka senin için konuları çıkarsın, özetlesin ve neye çalışman gerektiğini söylesin.
          </p>
        </div>

        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Dosya Yükle
          </h3>
          <FileUpload onFilesSelected={handleFilesSelected} />
        </section>

        {/* Results Section */}
        {files.length > 0 && (
          <section className="space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-baseline gap-3">
                 <h3 className="text-xl font-bold text-slate-800">Analiz Sonuçları</h3>
                 <span className="text-sm text-slate-500">{files.length} dosya</span>
               </div>
               
               {files.length > 0 && (
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={handleDownloadReport} 
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Raporu İndir (HTML)
                    </button>
                    <button onClick={clearAll} className="text-sm text-red-600 hover:text-red-800 hover:underline">
                      Tümünü Temizle
                    </button>
                 </div>
               )}
             </div>
             
             <div className="grid grid-cols-1 gap-6">
                {files.map(fileEntry => (
                  <AnalysisResultCard 
                    key={fileEntry.id} 
                    item={fileEntry} 
                    onRemove={removeFile} 
                  />
                ))}
             </div>

             {/* AGGREGATED SUMMARY & ROADMAP SECTION */}
             {(allTopics.length > 0 || highPriorityTopics.length > 0) && (
               <div className="mt-12 space-y-8">
                 
                 {/* Generate Roadmap Button */}
                 {hasCompletedFiles && roadmap.length === 0 && (
                   <div className="text-center py-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2">Tüm Dökümanlar İçin Yol Haritası</h3>
                      <p className="text-indigo-700 mb-4 max-w-lg mx-auto">Tüm dosyaları analiz ettik. Şimdi hepsini birleştirip sıralı bir çalışma programı oluşturabiliriz.</p>
                      <button 
                        onClick={handleGenerateRoadmap}
                        disabled={isGeneratingRoadmap}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                      >
                        {isGeneratingRoadmap ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Oluşturuluyor...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Yol Haritası Oluştur
                          </>
                        )}
                      </button>
                   </div>
                 )}

                 {/* Roadmap View */}
                 {roadmap.length > 0 && (
                   <RoadmapView steps={roadmap} />
                 )}

                 {/* 1. HIGH PRIORITY FOCUS AREA */}
                 {highPriorityTopics.length > 0 && (
                   <div className="bg-rose-50 border border-rose-200 rounded-2xl shadow-md p-6 sm:p-8 relative overflow-hidden">
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-rose-800 mb-2 flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Kesin Çalışman Gerekenler
                        </h3>
                        <p className="text-rose-700 mb-6">
                          Yapay zeka analizlerine göre öncelikli olarak odaklanman gereken, kritik öneme sahip konular:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {highPriorityTopics.map((topic, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
                              <span className="mt-1 w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                              <span className="text-rose-900 font-medium">{topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>
                 )}

                 {/* 2. GENERAL TOPICS SUMMARY */}
                 {allTopics.length > 0 && (
                    <div className="bg-slate-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                        {/* Decorative Background Pattern */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-800 opacity-50 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-600 opacity-30 blur-3xl"></div>

                        <div className="relative z-10">
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Tüm Konu Başlıkları
                          </h3>
                          
                          <div className="flex flex-wrap gap-2">
                            {allTopics.map((topic, idx) => (
                              <span 
                                key={idx} 
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                    </div>
                 )}
               </div>
             )}
          </section>
        )}
        
        {files.length === 0 && (
          <div className="text-center py-12 opacity-40">
            <div className="inline-block p-4 bg-slate-200 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg">Henüz bir dosya yüklenmedi.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;