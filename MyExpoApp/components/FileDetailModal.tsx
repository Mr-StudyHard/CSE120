import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking, Image } from "react-native";
import { Video } from "expo-av";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import "../global.css";

type FileDetailModalProps = {
  isVisible: boolean;
  selectedFile: any;
  isCopyPressed: boolean;
  onClose: () => void;
  onCopyPress: () => void;
  getTypeColor: (color: string) => string;
};

export const FileDetailModal: React.FC<FileDetailModalProps> = ({
  isVisible,
  selectedFile,
  isCopyPressed,
  onClose,
  onCopyPress,
  getTypeColor,
}) => {
  if (!isVisible || !selectedFile) {
    return null;
  }

  const openURL = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err));
  };

  const fileUrl: string | undefined = selectedFile.url;
  const typeLabel = (selectedFile.type ?? "").toString().toLowerCase();
  const isImagePreview = Boolean(
    fileUrl &&
      (typeLabel.includes("image") ||
        /\.(png|jpe?g|gif|bmp|webp|heic)$/i.test(fileUrl))
  );
  const isVideoPreview = Boolean(
    fileUrl &&
      (typeLabel.includes("video") ||
        typeLabel.includes("record") ||
        /\.(mp4|mov|m4v|avi|wmv|webm)$/i.test(fileUrl))
  );

  return (
    <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 justify-center items-center">
      <View className="bg-background rounded-lg mx-6 w-11/12" style={{ maxHeight: "80%" }}>
        <View className="flex-row items-center justify-between p-6 border-b border-gray-600">
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full ${getTypeColor(selectedFile.typeColor)} mr-3`} />
            <Text className="text-white text-xl font-semibold">{selectedFile.type}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onCopyPress}>
              <Text className={`mr-4 text-base ${isCopyPressed ? "text-gray-400" : "text-white"}`}>
                Copy Link
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <FontAwesomeIcon icon={faXmark} size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="p-6">
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-1">Name:</Text>
            <Text className="text-white text-base">{selectedFile.name}</Text>
          </View>

          {fileUrl && (isImagePreview || isVideoPreview) ? (
            <View className="mb-4">
              {isImagePreview ? (
                <Image
                  source={{ uri: fileUrl }}
                  style={{ width: "100%", aspectRatio: 1.6, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ) : null}
              {isVideoPreview ? (
                <Video
                  source={{ uri: fileUrl }}
                  style={{ width: "100%", height: 220, borderRadius: 12 }}
                  resizeMode="contain"
                  useNativeControls
                />
              ) : null}
            </View>
          ) : null}

          {selectedFile.url ? (
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-1">URL:</Text>
              <TouchableOpacity onPress={() => openURL(selectedFile.url)}>
                <Text className="text-blue-400 text-base underline">{selectedFile.url}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {selectedFile.createdAt ? (
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-1">Created At:</Text>
              <Text className="text-white text-base">{selectedFile.createdAt}</Text>
            </View>
          ) : null}

          {selectedFile.creator ? (
            <View className="mb-6">
              <Text className="text-gray-400 text-sm mb-1">Creator:</Text>
              <Text className="text-white text-base">{selectedFile.creator}</Text>
            </View>
          ) : null}

          {selectedFile.content ? (
            <View className="bg-gray-600 rounded-lg p-4">
              <Text className="text-white text-base leading-6">{selectedFile.content}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
};
