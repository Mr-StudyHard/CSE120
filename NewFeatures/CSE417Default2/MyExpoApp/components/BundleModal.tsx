/**
 * BundleModal Component
 * 
 * Modal showing bundle details with all bundled files:
 * - Bundle metadata (name, URLs, creation date, creator)
 * - List of all files included in the bundle
 * - Each bundled file shows as a mini file detail card
 * - Copy links functionality for the entire bundle
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Clipboard, Linking } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import "../global.css";

interface BundleFile {
  id: number;
  name: string;
  type: string;
  typeColor: string;
  url: string;
  createdAt: string;
  creator: string;
  content: string;
}

interface BundleModalProps {
  isVisible: boolean;
  bundleData: {
    name: string;
    bundledUrls: string[];
    createdAt: string;
    creator: string;
    files: BundleFile[];
  };
  isCopyPressed: boolean;
  onClose: () => void;
  onCopyPress: () => void;
  getTypeColor: (color: string) => string;
}

export const BundleModal: React.FC<BundleModalProps> = ({
  isVisible,
  bundleData,
  isCopyPressed,
  onClose,
  onCopyPress,
  getTypeColor,
}) => {
  if (!isVisible || !bundleData) return null;

  const openURL = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const copyAllLinks = () => {
    try {
      const allUrls = bundleData.bundledUrls.join('\n');
      Clipboard.setString(allUrls);
      Alert.alert('Success', 'All bundle links copied to clipboard!');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy links to clipboard');
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const copyFileLink = (url: string) => {
    try {
      Clipboard.setString(url);
      Alert.alert('Success', 'File link copied to clipboard!');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy link to clipboard');
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 justify-center items-center">
      <View className="bg-background rounded-lg mx-6 w-11/12 max-h-4/5">
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-gray-600">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-button-outline mr-3" />
            <Text className="text-white text-xl font-semibold">Bundle</Text>
          </View>
          <View className="flex-row items-center space-x-5">
            <TouchableOpacity onPress={copyAllLinks}>
              <Text className="mr-4 text-white text-base">Copy Links</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <FontAwesomeIcon icon={faXmark} size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bundle Details */}
        <ScrollView className="p-6">
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-1">Name:</Text>
            <Text className="text-white text-base">{bundleData.name}</Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-1">Bundled URLs:</Text>
            {bundleData.bundledUrls.map((url, index) => (
              <TouchableOpacity key={index} onPress={() => openURL(url)}>
                <Text className="text-blue-400 text-base underline">{url}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-1">Created At:</Text>
            <Text className="text-white text-base">{bundleData.createdAt}</Text>
          </View>
          
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-1">Creator:</Text>
            <Text className="text-white text-base">{bundleData.creator}</Text>
          </View>

          {/* Bundled Files List */}
          <View className="border-t border-gray-600 pt-4">
            <Text className="text-white text-lg font-semibold mb-4">Bundled Files:</Text>
            {bundleData.files.map((file) => (
              <View key={file.id} className="bg-card-bg rounded-lg p-4 mb-3">
                {/* File Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full ${getTypeColor(file.typeColor)} mr-2`} />
                    <Text className="text-white text-base font-semibold">{file.type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyFileLink(file.url)}>
                    <Text className="text-white text-sm">Copy Link</Text>
                  </TouchableOpacity>
                </View>

                {/* File Details */}
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs mb-1">Name:</Text>
                  <Text className="text-white text-sm">{file.name}</Text>
                </View>
                
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs mb-1">URL:</Text>
                  <TouchableOpacity onPress={() => openURL(file.url)}>
                    <Text className="text-blue-400 text-sm underline">{file.url}</Text>
                  </TouchableOpacity>
                </View>
                
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs mb-1">Created At:</Text>
                  <Text className="text-white text-sm">{file.createdAt}</Text>
                </View>
                
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs mb-1">Creator:</Text>
                  <Text className="text-white text-sm">{file.creator}</Text>
                </View>

                {/* Content Box */}
                <View className="bg-gray-600 rounded-lg p-3">
                  <Text className="text-white text-sm leading-5">{file.content}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
