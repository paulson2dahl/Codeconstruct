import { useState, useCallback } from 'react';

interface MultimodalOptions {
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
}

export const useMultimodal = (options: MultimodalOptions = {}) => {
  const {
    maxFileSize = 50,
    allowedTypes = [
      'image/*',
      'text/*',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.spreadsheet',
      'text/csv',
    ],
    maxFiles = 10,
  } = options;

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File ${file.name} exceeds ${maxFileSize}MB limit`;
    }

    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type || file.name.endsWith(type.replace('application/', '.').replace('vnd.openxmlformats-officedocument.', ''));
    });

    if (!isAllowed) {
      return `File type ${file.type} not allowed`;
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newErrors: Record<string, string> = {};

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors[file.name] = error;
      } else {
        validFiles.push(file);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles].slice(-maxFiles));
    }

    return validFiles;
  }, [validateFile, maxFiles]);

  const handleImagePaste = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrors(prev => ({ ...prev, [file.name]: error }));
      return null;
    }

    setUploadedFiles(prev => [...prev, file].slice(-maxFiles));
    return file;
  }, [validateFile, maxFiles]);

  const removeFile = useCallback((fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
    setErrors(prev => {
      const next = { ...prev };
      delete next[fileName];
      return next;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setErrors({});
  }, []);

  const uploadToSandbox = useCallback(async (file: File): Promise<string> => {
    // In real implementation, this would upload to the TrueForge sandbox
    // For now, return a mock path
    return `/sandbox/uploads/${file.name}`;
  }, []);

  const supportedTypes = allowedTypes;

  return {
    uploadedFiles,
    uploadProgress,
    errors,
    handleFileUpload,
    handleImagePaste,
    removeFile,
    clearFiles,
    uploadToSandbox,
    supportedTypes,
    validateFile,
  };
};