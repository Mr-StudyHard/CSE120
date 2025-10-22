import React from "react";
import { View, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faFileLines, faPaperclip, faMicrophone, faCamera } from "@fortawesome/free-solid-svg-icons";

import "../global.css";

type BottomNavigationProps = {
  onNotePress: () => void;
  onAttachmentPress: () => void;
  onMicrophonePress: () => void;
  onCameraPress: () => void;
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onNotePress,
  onAttachmentPress,
  onMicrophonePress,
  onCameraPress,
}) => {
  return (
    <View className="px-6 py-4 flex-row justify-around mb-4">
      <TouchableOpacity
        className="w-14 h-14 border-2 bg-button-outline border-button-outline rounded-full items-center justify-center"
        onPress={onNotePress}
      >
        <FontAwesomeIcon icon={faFileLines} size={20} color="black" />
      </TouchableOpacity>
      <TouchableOpacity
        className="w-14 h-14 border-2 bg-button-outline border-button-outline rounded-full items-center justify-center"
        onPress={onAttachmentPress}
      >
        <FontAwesomeIcon icon={faPaperclip} size={20} color="black" />
      </TouchableOpacity>
      <TouchableOpacity
        className="w-14 h-14 border-2 bg-button-outline border-button-outline rounded-full items-center justify-center"
        onPress={onMicrophonePress}
      >
        <FontAwesomeIcon icon={faMicrophone} size={20} color="black" />
      </TouchableOpacity>
      <TouchableOpacity
        className="w-14 h-14 border-2 bg-button-outline border-button-outline rounded-full items-center justify-center"
        onPress={onCameraPress}
      >
        <FontAwesomeIcon icon={faCamera} size={20} color="black" />
      </TouchableOpacity>
    </View>
  );
};
