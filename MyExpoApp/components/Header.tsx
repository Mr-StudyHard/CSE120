import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faGear, faMagnifyingGlass, faLink } from "@fortawesome/free-solid-svg-icons";

import "../global.css";

type HeaderProps = {
  onLinkPress: () => void;
  getTypeColor: (color: string) => string;
  onSettingsPress?: () => void;
};

export const Header: React.FC<HeaderProps> = ({ onLinkPress, getTypeColor, onSettingsPress }) => {
  return (
    <View className="px-6 pt-4 pb-4 mt-10">
      <View className="flex-row justify-between items-center mt-12 mb-2">
        <Text className="text-white text-base">dsanchez113@ucmerced.edu</Text>
        <TouchableOpacity onPress={onSettingsPress}>
          <FontAwesomeIcon icon={faGear} size={20} color="white" />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center space-x-3">
        <View className="flex-1 bg-white rounded-lg px-4 py-3 flex-row items-center">
          <FontAwesomeIcon icon={faMagnifyingGlass} size={20} color="black" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-gray-900"
          />
        </View>
        <TouchableOpacity
          className="border-2 border-button-outline bg-black px-4 py-3 rounded-lg flex-row items-center"
          onPress={onLinkPress}
        >
          <FontAwesomeIcon icon={faLink} size={20} color={getTypeColor("button-border-color")} />
          <Text className="ml-2 font-semibold text-button-outline text-lg">Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
