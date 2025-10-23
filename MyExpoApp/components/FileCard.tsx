import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCheck, faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";

import "../global.css";

type FileCardProps = {
  file: {
    id: number;
    name: string;
    date: string;
    type: string;
    typeColor: string;
    number: string;
  };
  isSelected: boolean;
  onPress: () => void;
  onToggleSelection: () => void;
  getTypeColor: (color: string) => string;
  onMenuPress?: () => void;
};

export const FileCard: React.FC<FileCardProps> = ({
  file,
  isSelected,
  onPress,
  onToggleSelection,
  getTypeColor,
  onMenuPress,
}) => {
  return (
    <TouchableOpacity className="bg-card-bg rounded-lg p-4 mb-3 flex-row items-center" onPress={onPress}>
      <TouchableOpacity
        className={`w-7 h-7 rounded mr-4 items-center justify-center ${
          isSelected ? "bg-button-outline" : "border-2 border-white"
        }`}
        onPress={onToggleSelection}
      >
        {isSelected && <FontAwesomeIcon icon={faCheck} size={15} color="black" />}
      </TouchableOpacity>

      <View className="w-10 h-10 bg-button-outline rounded-full items-center justify-center mr-4">
        <Text className="text-black font-bold text-lg">D</Text>
      </View>

      <View className="flex-1">
        <Text className="text-white text-base font-medium mb-1">{file.name}</Text>
        <Text className="text-gray-400 text-sm">{file.date}</Text>
      </View>

      <View className="flex-row items-start">
        <View className={`w-2 h-2 rounded-full ${getTypeColor(file.typeColor)} mt-1 mr-2`} />
        <View className="items-end mr-3">
          <Text className="text-white text-sm mb-1">{file.type}</Text>
          <Text className="text-gray-400 text-sm">{file.number}</Text>
        </View>
        <TouchableOpacity
          onPress={onMenuPress}
          className="px-2 py-1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Open menu for ${file.name}`}
        >
          <FontAwesomeIcon icon={faEllipsisVertical} size={22} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
