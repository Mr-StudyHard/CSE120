/**
 * Header Component
 * 
 * Top section of the app containing:
 * - User email and settings gear icon
 * - Search bar for filtering files
 * - Link button for creating file bundles
 */
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import "../global.css";

interface HeaderProps {
  onLinkPress: () => void;
  getTypeColor: (color: string) => string;
}

export const Header: React.FC<HeaderProps> = ({ onLinkPress, getTypeColor }) => {
  return (
    <View className="px-6 pt-4 pb-4 mt-8">
      {/* Email and Settings */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white text-base">dsanchez113@ucmerced.edu</Text>
        <TouchableOpacity>
          <FontAwesomeIcon icon={faGear} size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar and Bundle Button */}
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
          <FontAwesomeIcon
            icon={faLink}
            size={20}
            color="#D7827E"
          />
          <Text className="ml-2 font-semibold text-button-outline text-lg">
            Link
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
