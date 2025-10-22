/**
 * FileDetailModal Component
 * 
 * Full-screen modal showing detailed file information:
 * - File name, URL, creation date, and creator
 * - Clickable URL that opens in browser
 * - Copy link button with visual feedback
 * - File content display in a content box
 * - Close button to dismiss modal
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Clipboard, Linking } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import "../global.css";

interface FileDetailModalProps {
  isVisible: boolean;
  selectedFile: any;
  isCopyPressed: boolean;
  onClose: () => void;
  onCopyPress: () => void;
  getTypeColor: (color: string) => string;
}

export const FileDetailModal: React.FC<FileDetailModalProps> = ({
  isVisible,
  selectedFile,
  isCopyPressed,
  onClose,
  onCopyPress,
  getTypeColor,
}) => {
  if (!isVisible || !selectedFile) return null;

  const openURL = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 justify-center items-center">
      <View className="bg-background rounded-lg mx-6 w-11/12 max-h-4/5">
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-gray-600">
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full ${getTypeColor(selectedFile.typeColor)} mr-3`} />
            <Text className="text-white text-xl font-semibold">{selectedFile.type}</Text>
          </View>
          <View className="flex-row items-center space-x-5">
            <TouchableOpacity onPress={onCopyPress}>
              <Text className={`mr-4 text-base ${isCopyPressed ? 'text-gray-400' : 'text-white'}`}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <FontAwesomeIcon icon={faXmark} size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* File Details */}
        <ScrollView className="p-6">
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-1">Name:</Text>
            <Text className="text-white text-base">{selectedFile.name}</Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-1">URL:</Text>
            <TouchableOpacity onPress={() => openURL(selectedFile.url)}>
              <Text className="text-blue-400 text-base underline">{selectedFile.url}</Text>
            </TouchableOpacity>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-1">Created At:</Text>
            <Text className="text-white text-base">{selectedFile.createdAt}</Text>
          </View>
          
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-1">Creator:</Text>
            <Text className="text-white text-base">{selectedFile.creator}</Text>
          </View>

          {/* Content Box */}
          <View className="bg-gray-600 rounded-lg p-4 shadow-lg">
            <Text className="text-white text-base leading-6">{selectedFile.content}</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
