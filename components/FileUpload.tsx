import React, { ChangeEvent } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      // Reset input value to allow selecting the same file again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out cursor-pointer
        ${disabled 
          ? 'bg-slate-100 border-slate-300 opacity-50 cursor-not-allowed' 
          : 'bg-white border-indigo-300 hover:bg-indigo-50 hover:border-indigo-500 shadow-sm'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className={`w-10 h-10 mb-3 ${disabled ? 'text-slate-400' : 'text-indigo-500'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className={`mb-2 text-sm ${disabled ? 'text-slate-500' : 'text-slate-700'}`}>
            <span className="font-semibold">PDF Yüklemek için Tıklayın</span>
          </p>
          <p className="text-xs text-slate-500">Sadece PDF dosyaları (Maks 10MB)</p>
        </div>
        <input 
          id="file-upload" 
          type="file" 
          accept="application/pdf" 
          multiple 
          className="hidden" 
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
};

export default FileUpload;