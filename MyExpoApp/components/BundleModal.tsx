import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import "../global.css";
import { copyToClipboard } from "../utils/helpers";

type BundleFile = {
  id: number;
  name: string;
  type: string;
  typeColor: string;
  url: string;
  createdAt: string;
  creator: string;
  content: string;
};

type BundleData = {
  id: number;
  name: string;
  bundledUrls: string[];
  createdAt: string;
  creator: string;
  files: BundleFile[];
};

type BundleModalProps = {
  isVisible: boolean;
  bundleData: BundleData | null;
  onClose: () => void;
  getTypeColor: (color: string) => string;
};

export const BundleModal: React.FC<BundleModalProps> = ({
  isVisible,
  bundleData,
  onClose,
  getTypeColor,
}) => {
  if (!isVisible || !bundleData) {
    return null;
  }

  const openURL = (url: string) => {
    Linking.openURL(url).catch((error) => {
      console.error("Failed to open URL:", error);
    });
  };

  const copyAllLinks = () => {
    if (!bundleData.bundledUrls.length) {
      return;
    }

    copyToClipboard(bundleData.bundledUrls.join("\n"));
  };

  const copyFileLink = (url: string) => {
    copyToClipboard(url);
  };

  return (
    <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 justify-center items-center">
      <View className="bg-background rounded-lg mx-6 w-11/12" style={{ maxHeight: "80%" }}>
        <View className="flex-row items-center justify-between p-6 border-b border-gray-600">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-button-outline mr-3" />
            <Text className="text-white text-xl font-semibold">Bundle</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={copyAllLinks}>
              <Text className="mr-4 text-white text-base">Copy Links</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <FontAwesomeIcon icon={faXmark} size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

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

          <View className="border-t border-gray-600 pt-4">
            <Text className="text-white text-lg font-semibold mb-4">Bundled Files:</Text>
            {bundleData.files.map((file) => (
              <View key={file.id} className="bg-card-bg rounded-lg p-4 mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full ${getTypeColor(file.typeColor)} mr-2`} />
                    <Text className="text-white text-base font-semibold">{file.type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyFileLink(file.url)}>
                    <Text className="text-white text-sm">Copy Link</Text>
                  </TouchableOpacity>
                </View>

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
