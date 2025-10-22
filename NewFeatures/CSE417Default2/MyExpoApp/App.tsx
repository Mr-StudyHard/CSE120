import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Alert } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

// Components
import { Header } from './components/Header';
import { FileList } from './components/FileList';
import { BottomNavigation } from './components/BottomNavigation';
import { NoteModal } from './components/NoteModal';
import { FileDetailModal } from './components/FileDetailModal';
import { BundleModal } from './components/BundleModal';

// Utils and Data
import { getTypeColor, copyToClipboard } from './utils/helpers';
import { files } from './data/files';

import "./global.css";

function AppContent() {
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isFileDetailVisible, setIsFileDetailVisible] = useState(false);
  const [isCopyPressed, setIsCopyPressed] = useState(false);
  const [selectedFilesForUpload, setSelectedFilesForUpload] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [isBundleDetailVisible, setIsBundleDetailVisible] = useState(false);

  const toggleFileSelection = (fileId: number) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const openFileDetail = (file: any) => {
    setSelectedFile(file);
    setIsFileDetailVisible(true);
  };

  const handleCopyPress = () => {
    if (selectedFile) {
      copyToClipboard(selectedFile.url, setIsCopyPressed);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });
      
      if (!result.canceled) {
        setSelectedFilesForUpload(result.assets);
        Alert.alert(
          'Files Selected', 
          `${result.assets.length} file(s) selected for upload:\n${result.assets.map(file => file.name).join('\n')}\n\nNote: Upload functionality will be added later.`
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select files');
      console.error('Document picker error:', err);
    }
  };

  const handleNoteSave = () => {
    console.log("Posting note:", noteText);
    setIsNoteModalVisible(false);
    setNoteText("");
  };

  const handleLinkPress = () => {
    if (selectedFiles.size === 0) {
      Alert.alert('No Files Selected', 'Please select files to create a bundle.');
      return;
    }

    const selectedFilesData = files.filter(file => selectedFiles.has(file.id));
    const bundleUrls = selectedFilesData.map(file => file.url);
    
    const newBundle = {
      id: Date.now(), // Simple ID generation
      name: `Bundle ${bundles.length + 1}`,
      bundledUrls: bundleUrls,
      createdAt: new Date().toISOString(),
      creator: "dsanchez113@ucmerced.edu",
      files: selectedFilesData,
      type: "Bundle",
      typeColor: "button-border-color",
      number: `${250 + bundles.length}`,
      date: new Date().toLocaleString(),
      content: `Bundle containing ${selectedFilesData.length} file(s)`
    };

    setBundles(prev => [...prev, newBundle]);
    setSelectedFiles(new Set()); // Clear selection
    Alert.alert('Bundle Created', `Bundle created with ${selectedFilesData.length} file(s).`);
  };

  const openBundleDetail = (bundle: any) => {
    setSelectedBundle(bundle);
    setIsBundleDetailVisible(true);
  };

  const handleMicrophonePress = () => {
    // TODO: Implement microphone functionality
    console.log("Microphone button pressed");
  };

  const handleCameraPress = () => {
    // TODO: Implement camera functionality
    console.log("Camera button pressed");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />

      <Header onLinkPress={handleLinkPress} getTypeColor={getTypeColor} />

      <FileList
        files={[...files, ...bundles]}
        selectedFiles={selectedFiles}
        onFilePress={(file) => {
          if (file.type === 'Bundle') {
            openBundleDetail(file);
          } else {
            openFileDetail(file);
          }
        }}
        onToggleFileSelection={toggleFileSelection}
        getTypeColor={getTypeColor}
      />

      <BottomNavigation
        onNotePress={() => setIsNoteModalVisible(true)}
        onAttachmentPress={pickDocument}
        onMicrophonePress={handleMicrophonePress}
        onCameraPress={handleCameraPress}
      />

      <NoteModal
        isVisible={isNoteModalVisible}
        noteText={noteText}
        onNoteTextChange={setNoteText}
        onClose={() => setIsNoteModalVisible(false)}
        onSave={handleNoteSave}
      />

      <FileDetailModal
        isVisible={isFileDetailVisible}
        selectedFile={selectedFile}
        isCopyPressed={isCopyPressed}
        onClose={() => setIsFileDetailVisible(false)}
        onCopyPress={handleCopyPress}
        getTypeColor={getTypeColor}
      />

      <BundleModal
        isVisible={isBundleDetailVisible}
        bundleData={selectedBundle}
        isCopyPressed={isCopyPressed}
        onClose={() => setIsBundleDetailVisible(false)}
        onCopyPress={handleCopyPress}
        getTypeColor={getTypeColor}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}