import React from "react";
import { ScrollView } from "react-native";

import { FileCard } from "./FileCard";

import "../global.css";

type FileItem = {
  id: number;
  name: string;
  date: string;
  type: string;
  typeColor: string;
  number: string;
};

type FileListProps = {
  files: FileItem[];
  selectedFiles: Set<number>;
  onFilePress: (file: FileItem) => void;
  onToggleFileSelection: (fileId: number) => void;
  getTypeColor: (color: string) => string;
};

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
