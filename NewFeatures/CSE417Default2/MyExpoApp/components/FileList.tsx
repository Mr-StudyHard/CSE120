/**
 * FileList Component
 * 
 * Scrollable list container that renders all file cards:
 * - Maps through files array to create FileCard components
 * - Handles file selection and click events
 * - Passes data and event handlers to individual FileCards
 */
import React from 'react';
import { ScrollView } from 'react-native';
import { FileCard } from './FileCard';
import "../global.css";

interface File {
  id: number;
  name: string;
  date: string;
  type: string;
  typeColor: string;
  number: string;
}

interface FileListProps {
  files: File[];
  selectedFiles: Set<number>;
  onFilePress: (file: File) => void;
  onToggleFileSelection: (fileId: number) => void;
  getTypeColor: (color: string) => string;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFiles,
  onFilePress,
  onToggleFileSelection,
  getTypeColor,
}) => {
  return (
    <ScrollView className="flex-1 px-6">
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          isSelected={selectedFiles.has(file.id)}
          onPress={() => onFilePress(file)}
          onToggleSelection={() => onToggleFileSelection(file.id)}
          getTypeColor={getTypeColor}
        />
      ))}
    </ScrollView>
  );
};
