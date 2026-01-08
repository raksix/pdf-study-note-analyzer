import { AnalyzedFile, Priority, RoadmapStep } from "../types";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case Priority.HIGH: return 'bg-red-100 text-red-700 border-red-200';
    case 'Yüksek': return 'bg-red-100 text-red-700 border-red-200';
    case Priority.MEDIUM: return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Orta': return 'bg-amber-100 text-amber-700 border-amber-200';
    case Priority.LOW: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Düşük': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export const generateHtmlReport = (
  files: AnalyzedFile[], 
  allTopics: string[], 
  highPriorityTopics: string[],
  roadmap: RoadmapStep[] = []
): string => {
  const date = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // 1. Generate Cards HTML
  const cardsHtml = files.map(file => {
    if (file.status !== 'completed' || !file.result) return '';
    
    const topicsHtml = file.result.topics.map(t => 
      `<span class="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-medium shadow-sm">${t}</span>`
    ).join('');

    const tableRowsHtml = file.result.studyPlan.map(item => `
      <tr class="bg-white border-b border-slate-100 hover:bg-slate-50">
        <td class="px-4 py-3 font-medium text-slate-900 w-1/4 align-top">${item.topic}</td>
        <td class="px-4 py-3 w-2/4 align-top text-slate-600">${item.action}</td>
        <td class="px-4 py-3 text-center w-1/4 align-top">
          <span class="px-2 py-1 rounded text-xs font-semibold border inline-block ${getPriorityColor(item.priority)}">
            ${item.priority}
          </span>
        </td>
      </tr>
    `).join('');

    return `
      <div class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8 break-inside-avoid">
        <!-- Card Header -->
        <div class="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-3">
          <div class="p-2 bg-indigo-100 rounded-lg shrink-0">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
          </div>
          <div>
            <h3 class="font-bold text-lg text-slate-800">${file.fileName}</h3>
            <p class="text-xs text-slate-500">Dosya Boyutu: ${(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Summary -->
          <div>
            <h4 class="text-xs uppercase tracking-wide text-slate-500 font-bold mb-2">Özet</h4>
            <p class="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm md:text-base">
              ${file.result.summary}
            </p>
          </div>

          <!-- Topics -->
          <div>
            <h4 class="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Ana Konular</h4>
            <div class="flex flex-wrap gap-2">
              ${topicsHtml}
            </div>
          </div>

          <!-- Plan Table -->
          <div>
            <h4 class="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Çalışma Planı</h4>
            <div class="overflow-x-auto rounded-lg border border-slate-200">
              <table class="w-full text-sm text-left text-slate-600 border-collapse">
                <thead class="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="px-4 py-3 font-semibold">Konu</th>
                    <th class="px-4 py-3 font-semibold">Yapılacaklar</th>
                    <th class="px-4 py-3 font-semibold text-center">Öncelik</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 2. Generate Roadmap HTML
  let roadmapHtml = '';
  if (roadmap.length > 0) {
    const stepsHtml = roadmap.map(step => `
      <div class="relative pl-10 mb-8 last:mb-0 break-inside-avoid">
         <div class="absolute -left-[9px] top-1 w-5 h-5 rounded-full bg-white border-4 border-indigo-600"></div>
         <div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 w-fit">
                ${step.stepName}
              </span>
              <h4 class="text-lg font-bold text-slate-800">${step.title}</h4>
            </div>
            <p class="text-slate-600 mb-4 text-sm leading-relaxed">${step.description}</p>
            <div>
               <h5 class="text-xs font-semibold text-slate-500 uppercase mb-2">Konular</h5>
               <div class="flex flex-wrap gap-2">
                 ${step.topics.map(t => `<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-white border border-slate-300 text-slate-700">${t}</span>`).join('')}
               </div>
            </div>
         </div>
      </div>
    `).join('');

    roadmapHtml = `
      <div class="bg-white rounded-2xl shadow-lg border border-indigo-100 p-8 mb-8 break-inside-avoid">
         <div class="mb-8">
            <h3 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
               <span class="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                 </svg>
               </span>
               Kişiselleştirilmiş Yol Haritası
            </h3>
         </div>
         <div class="relative border-l-2 border-indigo-200 ml-5 py-2">
           ${stepsHtml}
         </div>
      </div>
    `;
  }

  // 3. Generate High Priority HTML
  let highPriorityHtml = '';
  if (highPriorityTopics.length > 0) {
    const items = highPriorityTopics.map(topic => `
      <div class="flex items-start gap-2 bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
        <span class="mt-1.5 w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
        <span class="text-rose-900 font-medium">${topic}</span>
      </div>
    `).join('');

    highPriorityHtml = `
      <div class="bg-rose-50 border border-rose-200 rounded-2xl shadow-md p-6 mb-8 break-inside-avoid">
        <h3 class="text-2xl font-bold text-rose-800 mb-2 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Kesin Çalışman Gerekenler
        </h3>
        <p class="text-rose-700 mb-6 text-sm">Bu liste, yüklediğiniz tüm dökümanlardan çıkarılan <strong>Yüksek Öncelikli</strong> konuları içerir.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${items}
        </div>
      </div>
    `;
  }

  // 4. Generate All Topics HTML
  let allTopicsHtml = '';
  if (allTopics.length > 0) {
    const tags = allTopics.map(topic => `
      <span class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm font-medium">
        ${topic}
      </span>
    `).join('');

    allTopicsHtml = `
      <div class="bg-slate-900 rounded-2xl shadow-xl p-8 text-white break-inside-avoid relative overflow-hidden">
         <!-- BG Pattern -->
         <div class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-800 opacity-50 blur-3xl"></div>
         <div class="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-600 opacity-30 blur-3xl"></div>
         
         <div class="relative z-10">
            <h3 class="text-xl font-bold mb-6 flex items-center gap-3 text-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Tüm Konu Başlıkları
            </h3>
            <div class="flex flex-wrap gap-2">
              ${tags}
            </div>
         </div>
      </div>
    `;
  }

  // 5. Combine into Full HTML
  return `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Çalışma Raporu - ${date}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
          @media print {
            .no-print { display: none; }
            body { background-color: white; }
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-900 antialiased py-10 print:py-0">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Header -->
          <div class="text-center mb-12 border-b border-slate-200 pb-8">
             <div class="inline-block p-3 bg-indigo-600 rounded-xl mb-4 shadow-lg shadow-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
             </div>
             <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Kişiselleştirilmiş Çalışma Raporu</h1>
             <p class="text-slate-500 mt-2">Oluşturulma Tarihi: ${date}</p>
          </div>

          <!-- Content -->
          <div class="space-y-8">
            ${cardsHtml}
            
            ${roadmapHtml}

            ${highPriorityHtml}
            
            ${allTopicsHtml}
          </div>

          <!-- Footer -->
          <div class="mt-16 text-center text-slate-400 text-sm border-t border-slate-200 pt-8 no-print">
            <p>Bu rapor Yapay Zeka Destekli Çalışma Asistanı tarafından oluşturulmuştur.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};