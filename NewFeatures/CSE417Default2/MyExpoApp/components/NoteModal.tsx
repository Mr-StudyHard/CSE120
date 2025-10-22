/**
 * NoteModal Component
 * 
 * Modal popup for creating new notes with:
 * - Text input area for typing notes
 * - Keyboard handling for mobile
 * - Save button to store the note
 * - Close button to dismiss modal
 */
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import "../global.css";

interface NoteModalProps {
  isVisible: boolean;
  noteText: string;
  onNoteTextChange: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isVisible,
  noteText,
  onNoteTextChange,
  onClose,
  onSave,
}) => {
  if (!isVisible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="absolute bottom-0 left-0 right-0 bg-background border-t-2 border-button-outline"
    >
      <View className="px-4 py-4">
        {/* Header with close button */}
        <View className="flex-row justify-end items-center mb-4">
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full items-center justify-center"
          >
            <FontAwesomeIcon icon={faXmark} size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Text Input Area */}
        <View className="bg-gray-600 rounded-lg px-4 py-3 mb-4">
          <TextInput
            placeholder="Type a new note..."
            placeholderTextColor="#9CA3AF"
            value={noteText}
            onChangeText={onNoteTextChange}
            className="text-white text-base"
            multiline
            autoFocus
            style={{ minHeight: 40, maxHeight: 120 }}
          />
        </View>

        {/* Post Button */}
        <View className="flex-row justify-end">
          <TouchableOpacity
            className="bg-button-outline rounded-lg px-4 py-2"
            onPress={onSave}
          >
            <Text className="text-black font-semibold text-sm">
              Save Note
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
